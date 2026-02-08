require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const pool = require('./db/pool');
const runMigrations = require('./db/migrate');

const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/log');
const dashboardRoutes = require('./routes/dashboard');
const badgeRoutes = require('./routes/badges');
const impactRoutes = require('./routes/impact');
const leaderboardRoutes = require('./routes/leaderboard');
const profileRoutes = require('./routes/profile');
const animalRoutes = require('./routes/animals');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.APP_URL || 'https://planetpoints.app'
    : true,
}));

// Stripe webhook needs raw body BEFORE JSON parsing
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json({ limit: '10kb' }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Whoa, slow down! You're recycling faster than we can count. Try again in a few minutes." },
});

const logLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Whoa, slow down! You're recycling faster than we can count. Try again in a few minutes." },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again in a few minutes.' },
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again in a moment.' },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', refreshLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/beta', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/log', logLimiter, logRoutes);
app.use('/api/dashboard', readLimiter, dashboardRoutes);
app.use('/api/impact', readLimiter, impactRoutes);
app.use('/api/badges', readLimiter, badgeRoutes);
app.use('/api/leaderboard', readLimiter, leaderboardRoutes);
app.use('/api/profile', readLimiter, profileRoutes);
app.use('/api/animals', readLimiter, animalRoutes);
app.use('/api/payments', readLimiter, paymentRoutes);
app.use('/api/subscribe', readLimiter, paymentRoutes);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Start server
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`PlanetPoints server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
