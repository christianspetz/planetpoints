-- Stripe monetization: premium subscriptions + animal purchases

-- Add Stripe/premium columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);

-- Update animal prices to new tiers:
-- Rare ($3.99): Snow Leopard, Narwhal, Tiger, Lion, Rhinoceros
UPDATE animals SET unlock_price_cents = 399 WHERE id IN (7, 8, 9, 10, 11);

-- Regular ($1.99): Bald Eagle, Sea Lion, Elephant, Red Fox, Monarch Butterfly
UPDATE animals SET unlock_price_cents = 199 WHERE id IN (12, 13, 14, 15, 16);
