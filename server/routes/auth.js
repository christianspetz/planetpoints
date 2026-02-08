const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { sendPasswordResetEmail } = require('../config/email');

const router = express.Router();

function generateAccessToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name`,
      [email, password_hash, display_name]
    );

    const user = result.rows[0];
    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken();

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, hashToken(refresh_token)]
    );

    res.status(201).json({
      success: true,
      data: { user: { id: user.id, email: user.email, display_name: user.display_name }, access_token, refresh_token },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password, remember_me } = req.body;

    const result = await pool.query('SELECT id, email, password_hash, display_name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: "That didn't match our records. Double-check your email and password." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "That didn't match our records. Double-check your email and password." });
    }

    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken();
    const refreshDays = remember_me ? 30 : 7;

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + make_interval(days => $3))`,
      [user.id, hashToken(refresh_token), refreshDays]
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, display_name: user.display_name },
        access_token,
        refresh_token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const tokenHash = hashToken(refresh_token);
    const result = await pool.query(
      `DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      // Possible token reuse — revoke all tokens for security
      // We can't know the user, so just return 401
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = result.rows[0].user_id;
    const user = await pool.query('SELECT id, email, display_name FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const access_token = generateAccessToken(user.rows[0]);
    const new_refresh_token = generateRefreshToken();

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [userId, hashToken(new_refresh_token)]
    );

    res.json({
      success: true,
      data: { access_token, refresh_token: new_refresh_token },
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.userId]);
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(422).json({ success: false, error: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success to avoid revealing whether email exists
    const successMsg = { success: true, data: { message: 'If an account with that email exists, we sent a reset link.' } };

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userResult.rows.length === 0) {
      return res.json(successMsg);
    }

    const userId = userResult.rows[0].id;

    // Rate limit: max 3 reset requests per email per hour
    const recentCount = await pool.query(
      `SELECT COUNT(*) FROM password_reset_tokens
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );
    if (parseInt(recentCount.rows[0].count) >= 3) {
      return res.json(successMsg);
    }

    // Generate token
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Store hashed token with 1-hour expiry
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, tokenHash]
    );

    // Send email (don't await — respond immediately)
    sendPasswordResetEmail(normalizedEmail, rawToken).catch((err) => {
      console.error('Failed to send reset email:', err.message);
    });

    res.json(successMsg);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(422).json({ success: false, error: 'Token and new password are required.' });
    }

    if (password.length < 8 || !/\d/.test(password)) {
      return res.status(422).json({
        success: false,
        error: 'Password must be at least 8 characters with at least 1 number.',
      });
    }

    const tokenHash = hashToken(token);

    // Find and delete the token in one query
    const result = await pool.query(
      `DELETE FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const userId = result.rows[0].user_id;

    // Hash new password and update
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);

    // Clean up: delete all reset tokens and refresh tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

    res.json({ success: true, data: { message: 'Password reset successfully. Please log in with your new password.' } });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong on our end. Give it another try in a moment.' });
  }
});

// POST /api/auth/beta — verify beta access password
router.post('/beta', (req, res) => {
  const { password } = req.body;
  const betaPassword = process.env.BETA_PASSWORD;

  if (!betaPassword) {
    // No beta gate configured — allow through
    return res.json({ success: true, data: { granted: true } });
  }

  if (!password) {
    return res.status(422).json({ success: false, error: 'Password is required.' });
  }

  try {
    const a = Buffer.from(password);
    const b = Buffer.from(betaPassword);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return res.json({ success: true, data: { granted: true } });
    }
  } catch {
    // length mismatch or encoding error — fall through to rejection
  }

  res.status(401).json({ success: false, error: 'Incorrect beta password.' });
});

module.exports = router;
