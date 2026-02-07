const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');

const router = express.Router();

// GET /api/badges
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.name, b.emoji, b.description,
              ub.earned_at IS NOT NULL as earned,
              ub.earned_at
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
       ORDER BY ub.earned_at ASC NULLS LAST, b.id`,
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        badges: result.rows.map((b) => ({
          ...b,
          earned: !!b.earned,
          earned_at: b.earned_at || null,
        })),
      },
    });
  } catch (err) {
    console.error('Badges error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

module.exports = router;
