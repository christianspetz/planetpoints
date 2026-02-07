const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const { validateLog } = require('../middleware/validate');
const { MATERIALS } = require('../config/materials');
const { ANIMAL_POINTS } = require('../config/animalPoints');

const router = express.Router();

async function checkAndAwardBadges(userId) {
  const newBadges = [];

  // Get user stats
  const userResult = await pool.query(
    `SELECT streak_current, total_carbon_saved FROM users WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];

  // Get total items and total logs
  const logStats = await pool.query(
    `SELECT COUNT(*) as total_logs, COALESCE(SUM(item_count), 0) as total_items FROM recycling_logs WHERE user_id = $1`,
    [userId]
  );
  const { total_logs, total_items } = logStats.rows[0];

  // Get badges user already has
  const earnedResult = await pool.query('SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]);
  const earnedSet = new Set(earnedResult.rows.map((r) => r.badge_id));

  // Get all badges
  const badgesResult = await pool.query('SELECT * FROM badges');

  for (const badge of badgesResult.rows) {
    if (earnedSet.has(badge.id)) continue;

    const criteria = badge.criteria;
    let earned = false;

    switch (criteria.type) {
      case 'total_logs':
        earned = parseInt(total_logs) >= criteria.value;
        break;
      case 'streak':
        earned = user.streak_current >= criteria.value;
        break;
      case 'total_items':
        earned = parseInt(total_items) >= criteria.value;
        break;
      case 'carbon_saved':
        earned = parseFloat(user.total_carbon_saved) >= criteria.value;
        break;
    }

    if (earned) {
      await pool.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, badge.id]
      );
      newBadges.push({ id: badge.id, name: badge.name, emoji: badge.emoji, description: badge.description });
    }
  }

  return newBadges;
}

// POST /api/log
router.post('/', authenticate, validateLog, async (req, res) => {
  try {
    const { material_type, item_count } = req.body;
    const material = MATERIALS[material_type];

    const carbon_saved_kg = item_count * material.weight_kg * material.carbon_per_kg;
    const water_saved_l = item_count * material.weight_kg * material.water_per_kg;

    // Insert log
    const logResult = await pool.query(
      `INSERT INTO recycling_logs (user_id, material_type, item_count, carbon_saved_kg, water_saved_l)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, material_type, item_count, carbon_saved_kg, water_saved_l, logged_at`,
      [req.userId, material_type, item_count, carbon_saved_kg, water_saved_l]
    );

    // Update user totals and streak
    const today = new Date().toISOString().split('T')[0];
    const userResult = await pool.query('SELECT streak_last_log_date, streak_current, streak_best FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    let newStreak = user.streak_current;
    const lastLog = user.streak_last_log_date ? user.streak_last_log_date.toISOString().split('T')[0] : null;

    if (lastLog === today) {
      // Already logged today, no streak change
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastLog === yesterdayStr) {
        newStreak = user.streak_current + 1;
      } else {
        newStreak = 1;
      }
    }

    const newBest = Math.max(newStreak, user.streak_best);

    await pool.query(
      `UPDATE users SET
         total_carbon_saved = total_carbon_saved + $1,
         total_water_saved = total_water_saved + $2,
         streak_current = $3,
         streak_best = $4,
         streak_last_log_date = $5
       WHERE id = $6`,
      [carbon_saved_kg, water_saved_l, newStreak, newBest, today, req.userId]
    );

    // Check badges
    const newBadges = await checkAndAwardBadges(req.userId);

    // Award animal points
    let evolution = null;
    const pointsEarned = (ANIMAL_POINTS[material_type] || 3) * item_count;

    const animalUser = await pool.query(
      'SELECT selected_animal_id, animal_points FROM users WHERE id = $1',
      [req.userId]
    );

    if (animalUser.rows[0].selected_animal_id) {
      const newPoints = animalUser.rows[0].animal_points + pointsEarned;
      await pool.query('UPDATE users SET animal_points = $1 WHERE id = $2', [newPoints, req.userId]);

      // Check for evolution
      const ua = await pool.query(
        'SELECT current_stage FROM user_animals WHERE user_id = $1 AND animal_id = $2',
        [req.userId, animalUser.rows[0].selected_animal_id]
      );

      if (ua.rows.length > 0) {
        const currentStage = ua.rows[0].current_stage;
        const nextStage = await pool.query(
          `SELECT * FROM animal_stages WHERE animal_id = $1 AND stage_number = $2`,
          [animalUser.rows[0].selected_animal_id, currentStage + 1]
        );

        if (nextStage.rows.length > 0 && newPoints >= nextStage.rows[0].points_required) {
          const newStageNum = currentStage + 1;
          await pool.query(
            'UPDATE user_animals SET current_stage = $1 WHERE user_id = $2 AND animal_id = $3',
            [newStageNum, req.userId, animalUser.rows[0].selected_animal_id]
          );

          const animalInfo = await pool.query(
            'SELECT name, emoji FROM animals WHERE id = $1',
            [animalUser.rows[0].selected_animal_id]
          );

          evolution = {
            animal_name: animalInfo.rows[0].name,
            animal_emoji: animalInfo.rows[0].emoji,
            new_stage: newStageNum,
            stage_name: nextStage.rows[0].stage_name,
          };
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        log: logResult.rows[0],
        new_badges: newBadges,
        streak: newStreak,
        points_earned: pointsEarned,
        evolution,
      },
    });
  } catch (err) {
    console.error('Log create error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// GET /api/log?page=1&limit=20
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM recycling_logs WHERE user_id = $1', [req.userId]);
    const total = parseInt(countResult.rows[0].count);

    const logsResult = await pool.query(
      `SELECT id, material_type, item_count, carbon_saved_kg, water_saved_l, logged_at
       FROM recycling_logs WHERE user_id = $1
       ORDER BY logged_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        logs: logsResult.rows,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Log list error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// DELETE /api/log/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM recycling_logs WHERE id = $1 AND user_id = $2
       RETURNING carbon_saved_kg, water_saved_l`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Log not found.' });
    }

    const { carbon_saved_kg, water_saved_l } = result.rows[0];

    // Subtract from user totals
    await pool.query(
      `UPDATE users SET
         total_carbon_saved = GREATEST(0, total_carbon_saved - $1),
         total_water_saved = GREATEST(0, total_water_saved - $2)
       WHERE id = $3`,
      [carbon_saved_kg, water_saved_l, req.userId]
    );

    res.json({ success: true, data: { message: 'Log deleted' } });
  } catch (err) {
    console.error('Log delete error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

module.exports = router;
