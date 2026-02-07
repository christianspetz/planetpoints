const express = require('express');
const pool = require('../db/pool');

// NOTE: Swap to live keys in production by changing STRIPE_SECRET_KEY in .env
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const router = express.Router();

router.use((req, res, next) => {
  if (!stripe) return res.status(503).json({ success: false, error: 'Payments not configured.' });
  next();
});

// POST /api/webhooks/stripe
// This route receives raw body (not JSON-parsed) for signature verification.
// It is registered BEFORE express.json() in server/index.js.
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { user_id, animal_id, type } = session.metadata;

        if (type === 'animal_unlock' && animal_id) {
          // Unlock the purchased animal
          await pool.query(
            'INSERT INTO user_animals (user_id, animal_id, current_stage) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING',
            [user_id, parseInt(animal_id)]
          );
          console.log(`Animal ${animal_id} unlocked for user ${user_id}`);
        }

        if (type === 'planet_pass') {
          // Activate premium and unlock ALL premium animals
          await pool.query(
            "UPDATE users SET is_premium = true, subscription_status = 'active' WHERE id = $1",
            [user_id]
          );

          const premiumAnimals = await pool.query('SELECT id FROM animals WHERE is_premium = true');
          for (const animal of premiumAnimals.rows) {
            await pool.query(
              'INSERT INTO user_animals (user_id, animal_id, current_stage) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING',
              [user_id, animal.id]
            );
          }
          console.log(`Planet Pass activated for user ${user_id}, all premium animals unlocked`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;
        if (!userId) break;

        const status = subscription.status; // active, past_due, canceled, etc.

        if (status === 'active') {
          await pool.query(
            "UPDATE users SET is_premium = true, subscription_status = 'active' WHERE id = $1",
            [userId]
          );
        } else {
          // past_due, canceled, unpaid, etc. — revoke premium perks but keep animals
          await pool.query(
            'UPDATE users SET is_premium = false, subscription_status = $1 WHERE id = $2',
            [status, userId]
          );
        }
        console.log(`Subscription updated for user ${userId}: ${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;
        if (!userId) break;

        // Subscription fully canceled — keep unlocked animals but remove premium
        await pool.query(
          "UPDATE users SET is_premium = false, subscription_status = 'canceled' WHERE id = $1",
          [userId]
        );
        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Webhook handler error');
  }

  res.json({ received: true });
});

module.exports = router;
