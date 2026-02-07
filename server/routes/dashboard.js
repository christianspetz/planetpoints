const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const { EQUIVALENTS } = require('../config/materials');

const router = express.Router();

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT total_carbon_saved, total_water_saved, streak_current, streak_best, selected_animal_id, animal_points FROM users WHERE id = $1`,
      [req.userId]
    );
    const user = userResult.rows[0];

    // Fetch selected animal info
    let animal = null;
    if (user.selected_animal_id) {
      const animalResult = await pool.query(`
        SELECT a.id, a.name, a.emoji, a.color, a.species, a.conservation_status,
               ua.current_stage,
               s_cur.stage_name as current_stage_name,
               s_next.stage_name as next_stage_name,
               s_next.points_required as next_stage_points
        FROM animals a
        LEFT JOIN user_animals ua ON ua.animal_id = a.id AND ua.user_id = $1
        LEFT JOIN animal_stages s_cur ON s_cur.animal_id = a.id AND s_cur.stage_number = ua.current_stage
        LEFT JOIN animal_stages s_next ON s_next.animal_id = a.id AND s_next.stage_number = ua.current_stage + 1
        WHERE a.id = $2
      `, [req.userId, user.selected_animal_id]);
      if (animalResult.rows.length > 0) {
        animal = animalResult.rows[0];
      }
    }

    const itemsResult = await pool.query(
      'SELECT COALESCE(SUM(item_count), 0) as total_items FROM recycling_logs WHERE user_id = $1',
      [req.userId]
    );
    const totalItems = parseInt(itemsResult.rows[0].total_items);

    const recentResult = await pool.query(
      `SELECT id, material_type, item_count, carbon_saved_kg, water_saved_l, logged_at
       FROM recycling_logs WHERE user_id = $1
       ORDER BY logged_at DESC LIMIT 5`,
      [req.userId]
    );

    const carbon = parseFloat(user.total_carbon_saved);
    const water = parseFloat(user.total_water_saved);

    res.json({
      success: true,
      data: {
        total_carbon_saved: carbon,
        total_water_saved: water,
        streak_current: user.streak_current,
        streak_best: user.streak_best,
        total_items: totalItems,
        recent_logs: recentResult.rows,
        equivalents: {
          trees: Math.floor(carbon / EQUIVALENTS.kg_co2_per_tree * 10) / 10,
          km_not_driven: Math.round(carbon * EQUIVALENTS.km_per_kg_co2 * 10) / 10,
          bathtubs: Math.round(water / EQUIVALENTS.liters_per_bathtub * 10) / 10,
        },
        animal,
        animal_points: user.animal_points,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

module.exports = router;
