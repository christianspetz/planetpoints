const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const { EQUIVALENTS } = require('../config/materials');

const router = express.Router();

// GET /api/impact/history?days=30
router.get('/history', authenticate, async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));

    const result = await pool.query(
      `SELECT
         DATE(logged_at) as date,
         COALESCE(SUM(carbon_saved_kg), 0) as carbon_saved,
         COALESCE(SUM(water_saved_l), 0) as water_saved,
         COALESCE(SUM(item_count), 0) as items
       FROM recycling_logs
       WHERE user_id = $1 AND logged_at >= NOW() - make_interval(days => $2)
       GROUP BY DATE(logged_at)
       ORDER BY date ASC`,
      [req.userId, days]
    );

    res.json({ success: true, data: { days: result.rows } });
  } catch (err) {
    console.error('Impact history error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// GET /api/impact/equivalents
router.get('/equivalents', authenticate, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT total_carbon_saved, total_water_saved FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];
    const carbon = parseFloat(user.total_carbon_saved);
    const water = parseFloat(user.total_water_saved);

    res.json({
      success: true,
      data: {
        trees: Math.floor(carbon / EQUIVALENTS.kg_co2_per_tree * 10) / 10,
        km_not_driven: Math.round(carbon * EQUIVALENTS.km_per_kg_co2 * 10) / 10,
        bathtubs: Math.round(water / EQUIVALENTS.liters_per_bathtub * 10) / 10,
        half_tanks_gas: Math.floor(carbon / 10 * 10) / 10,
      },
    });
  } catch (err) {
    console.error('Impact equivalents error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

module.exports = router;
