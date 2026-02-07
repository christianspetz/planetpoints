const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');

const router = express.Router();

// GET /api/animals — list all animals with user's lock/unlock status
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
        ua.unlocked_at,
        ua.current_stage,
        COALESCE(ua.current_stage, 0) > 0 AS is_unlocked
      FROM animals a
      LEFT JOIN user_animals ua ON ua.animal_id = a.id AND ua.user_id = $1
      ORDER BY a.is_premium ASC, a.id ASC
    `, [req.userId]);

    const userResult = await pool.query(
      'SELECT selected_animal_id, animal_points FROM users WHERE id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        animals: result.rows,
        selected_animal_id: userResult.rows[0].selected_animal_id,
        animal_points: userResult.rows[0].animal_points,
      },
    });
  } catch (err) {
    console.error('Animals list error:', err);
    res.status(500).json({ success: false, error: 'Failed to load animals.' });
  }
});

// POST /api/animals/select — choose active animal
router.post('/select', authenticate, async (req, res) => {
  try {
    const { animal_id } = req.body;
    if (!animal_id) {
      return res.status(400).json({ success: false, error: 'animal_id is required.' });
    }

    // Check if user owns this animal
    const owned = await pool.query(
      'SELECT 1 FROM user_animals WHERE user_id = $1 AND animal_id = $2',
      [req.userId, animal_id]
    );

    if (owned.rows.length === 0) {
      // If it's a free animal, auto-unlock it
      const animal = await pool.query('SELECT is_premium FROM animals WHERE id = $1', [animal_id]);
      if (animal.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Animal not found.' });
      }
      if (animal.rows[0].is_premium) {
        return res.status(403).json({ success: false, error: 'You haven\'t unlocked this animal yet.' });
      }
      // Auto-unlock free animal
      await pool.query(
        'INSERT INTO user_animals (user_id, animal_id, current_stage) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING',
        [req.userId, animal_id]
      );
    }

    await pool.query('UPDATE users SET selected_animal_id = $1 WHERE id = $2', [animal_id, req.userId]);

    res.json({ success: true, data: { selected_animal_id: animal_id } });
  } catch (err) {
    console.error('Animal select error:', err);
    res.status(500).json({ success: false, error: 'Failed to select animal.' });
  }
});

// GET /api/animals/my-collection — user's unlocked animals with stages
router.get('/my-collection', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, ua.unlocked_at, ua.current_stage
      FROM user_animals ua
      JOIN animals a ON a.id = ua.animal_id
      WHERE ua.user_id = $1
      ORDER BY ua.unlocked_at ASC
    `, [req.userId]);

    const userResult = await pool.query(
      'SELECT selected_animal_id, animal_points FROM users WHERE id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        collection: result.rows,
        selected_animal_id: userResult.rows[0].selected_animal_id,
        animal_points: userResult.rows[0].animal_points,
      },
    });
  } catch (err) {
    console.error('Collection error:', err);
    res.status(500).json({ success: false, error: 'Failed to load collection.' });
  }
});

// POST /api/animals/unlock/:id — unlock a premium animal (requires Stripe payment)
router.post('/unlock/:id', authenticate, async (req, res) => {
  try {
    const animalId = parseInt(req.params.id);
    const animal = await pool.query('SELECT * FROM animals WHERE id = $1', [animalId]);

    if (animal.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Animal not found.' });
    }

    if (animal.rows[0].is_premium) {
      return res.status(402).json({
        success: false,
        error: 'Premium animals require purchase. Use POST /api/payments/unlock-animal instead.',
      });
    }

    // Free animal — unlock directly
    const owned = await pool.query(
      'SELECT 1 FROM user_animals WHERE user_id = $1 AND animal_id = $2',
      [req.userId, animalId]
    );

    if (owned.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'You already own this animal.' });
    }

    await pool.query(
      'INSERT INTO user_animals (user_id, animal_id, current_stage) VALUES ($1, $2, 1)',
      [req.userId, animalId]
    );

    res.json({
      success: true,
      data: {
        animal: animal.rows[0],
        message: `${animal.rows[0].name} unlocked!`,
      },
    });
  } catch (err) {
    console.error('Animal unlock error:', err);
    res.status(500).json({ success: false, error: 'Failed to unlock animal.' });
  }
});

// GET /api/animals/:id/stages — get all evolution stages for an animal
router.get('/:id/stages', authenticate, async (req, res) => {
  try {
    const animalId = parseInt(req.params.id);

    const animal = await pool.query('SELECT * FROM animals WHERE id = $1', [animalId]);
    if (animal.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Animal not found.' });
    }

    const stages = await pool.query(
      'SELECT * FROM animal_stages WHERE animal_id = $1 ORDER BY stage_number',
      [animalId]
    );

    // Get user's current stage for this animal
    const userAnimal = await pool.query(
      'SELECT current_stage FROM user_animals WHERE user_id = $1 AND animal_id = $2',
      [req.userId, animalId]
    );

    const userResult = await pool.query(
      'SELECT animal_points FROM users WHERE id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        animal: animal.rows[0],
        stages: stages.rows,
        current_stage: userAnimal.rows[0]?.current_stage || 0,
        animal_points: userResult.rows[0].animal_points,
      },
    });
  } catch (err) {
    console.error('Animal stages error:', err);
    res.status(500).json({ success: false, error: 'Failed to load stages.' });
  }
});

module.exports = router;
