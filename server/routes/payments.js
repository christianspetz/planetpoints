const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');

// NOTE: Swap to live keys in production by changing STRIPE_SECRET_KEY in .env
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const router = express.Router();

function requireStripe(req, res, next) {
  if (!stripe) return res.status(503).json({ success: false, error: 'Payments not configured.' });
  next();
}
router.use(requireStripe);

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Helper: get or create Stripe customer for a user
async function getOrCreateCustomer(userId) {
  const userResult = await pool.query(
    'SELECT id, email, display_name, stripe_customer_id FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.display_name,
    metadata: { planetpoints_user_id: user.id },
  });

  await pool.query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, userId]
  );

  return customer.id;
}

// POST /api/payments/unlock-animal — create checkout session for one-time animal purchase
router.post('/unlock-animal', authenticate, async (req, res) => {
  try {
    const { animal_id } = req.body;
    if (!animal_id) {
      return res.status(400).json({ success: false, error: 'animal_id is required.' });
    }

    const animal = await pool.query('SELECT * FROM animals WHERE id = $1', [animal_id]);
    if (animal.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Animal not found.' });
    }

    const a = animal.rows[0];
    if (!a.is_premium) {
      return res.status(400).json({ success: false, error: 'This animal is free — just select it!' });
    }

    const owned = await pool.query(
      'SELECT 1 FROM user_animals WHERE user_id = $1 AND animal_id = $2',
      [req.userId, animal_id]
    );
    if (owned.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'You already own this animal.' });
    }

    const customerId = await getOrCreateCustomer(req.userId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${a.emoji} ${a.name}`,
            description: `Unlock the ${a.name} (${a.species}) — ${a.conservation_status}`,
          },
          unit_amount: a.unlock_price_cents,
        },
        quantity: 1,
      }],
      metadata: {
        user_id: req.userId,
        animal_id: String(animal_id),
        type: 'animal_unlock',
      },
      success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/payment/cancel`,
    });

    res.json({ success: true, data: { checkout_url: session.url } });
  } catch (err) {
    console.error('Payment checkout error:', err);
    res.status(500).json({ success: false, error: 'Failed to create checkout session.' });
  }
});

// POST /api/subscribe/planet-pass — create checkout session for subscription
router.post('/planet-pass', authenticate, async (req, res) => {
  try {
    const customerId = await getOrCreateCustomer(req.userId);

    const priceId = process.env.STRIPE_PRICE_PLANET_PASS;
    if (!priceId) {
      return res.status(500).json({ success: false, error: 'Subscription pricing not configured.' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: req.userId,
          type: 'planet_pass',
        },
      },
      metadata: {
        user_id: req.userId,
        type: 'planet_pass',
      },
      success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/payment/cancel`,
    });

    res.json({ success: true, data: { checkout_url: session.url } });
  } catch (err) {
    console.error('Subscription checkout error:', err);
    res.status(500).json({ success: false, error: 'Failed to create subscription checkout.' });
  }
});

// POST /api/payments/portal — Stripe billing portal for managing subscription
router.post('/portal', authenticate, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );

    const customerId = userResult.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ success: false, error: 'No billing account found.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/profile`,
    });

    res.json({ success: true, data: { portal_url: portalSession.url } });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ success: false, error: 'Failed to open billing portal.' });
  }
});

// GET /api/payments/session/:sessionId — verify checkout session for success page
router.get('/session/:sessionId', authenticate, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    if (session.metadata.user_id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Session does not belong to you.' });
    }

    const result = { type: session.metadata.type };

    if (session.metadata.type === 'animal_unlock' && session.metadata.animal_id) {
      const animal = await pool.query('SELECT * FROM animals WHERE id = $1', [session.metadata.animal_id]);
      if (animal.rows.length > 0) {
        result.animal = animal.rows[0];
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Session verify error:', err);
    res.status(500).json({ success: false, error: 'Failed to verify session.' });
  }
});

module.exports = router;
