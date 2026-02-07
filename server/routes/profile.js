const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const { validateProfile } = require('../middleware/validate');

const router = express.Router();

// GET /api/profile
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, display_name, streak_current, streak_best,
              total_carbon_saved, total_water_saved, created_at,
              is_premium, subscription_status
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Profile get error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// PATCH /api/profile
router.patch('/', authenticate, validateProfile, async (req, res) => {
  try {
    const { display_name } = req.body;

    if (!display_name) {
      return res.status(422).json({ success: false, error: 'Nothing to update.' });
    }

    const result = await pool.query(
      `UPDATE users SET display_name = $1 WHERE id = $2
       RETURNING id, email, display_name, streak_current, streak_best, total_carbon_saved, total_water_saved, created_at`,
      [display_name, req.userId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

module.exports = router;
