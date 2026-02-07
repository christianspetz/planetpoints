const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard?period=weekly
router.get('/', authenticate, async (req, res) => {
  try {
    // Weekly leaderboard: aggregate from start of current ISO week (Monday)
    const leaderboardResult = await pool.query(
      `SELECT
         u.id,
         u.display_name,
         COALESCE(SUM(rl.carbon_saved_kg), 0) as total_carbon_saved,
         COALESCE(SUM(rl.item_count), 0) as total_items
       FROM users u
       LEFT JOIN recycling_logs rl ON u.id = rl.user_id
         AND rl.logged_at >= date_trunc('week', CURRENT_DATE)
       GROUP BY u.id, u.display_name
       HAVING COALESCE(SUM(rl.item_count), 0) > 0
       ORDER BY total_carbon_saved DESC
       LIMIT 50`
    );

    const leaderboard = leaderboardResult.rows.map((row, idx) => ({
      rank: idx + 1,
      display_name: row.display_name,
      total_carbon_saved: parseFloat(row.total_carbon_saved),
      total_items: parseInt(row.total_items),
      is_current_user: row.id === req.userId,
    }));

    // Find current user's rank
    let userRank = leaderboard.findIndex((r) => r.is_current_user) + 1;

    // If user not in top 50, find their rank
    if (userRank === 0) {
      const rankResult = await pool.query(
        `SELECT COUNT(*) + 1 as rank FROM (
           SELECT u.id, COALESCE(SUM(rl.carbon_saved_kg), 0) as total
           FROM users u
           LEFT JOIN recycling_logs rl ON u.id = rl.user_id
             AND rl.logged_at >= date_trunc('week', CURRENT_DATE)
           GROUP BY u.id
           HAVING COALESCE(SUM(rl.item_count), 0) > 0
         ) ranked
         WHERE total > (
           SELECT COALESCE(SUM(carbon_saved_kg), 0)
           FROM recycling_logs
           WHERE user_id = $1
             AND logged_at >= date_trunc('week', CURRENT_DATE)
         )`,
        [req.userId]
      );
      userRank = parseInt(rankResult.rows[0].rank);
    }

    res.json({
      success: true,
      data: { leaderboard, user_rank: userRank },
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

module.exports = router;
