-- PlanetPoints MVP Database Schema
-- Run with IF NOT EXISTS guards for idempotent migrations

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================
-- USERS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    streak_current INTEGER DEFAULT 0,
    streak_best INTEGER DEFAULT 0,
    streak_last_log_date DATE,
    total_carbon_saved DECIMAL(12,4) DEFAULT 0,
    total_water_saved DECIMAL(12,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================
-- RECYCLING_LOGS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS recycling_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    material_type VARCHAR(20) NOT NULL,
    item_count INTEGER NOT NULL CHECK (item_count BETWEEN 1 AND 999),
    carbon_saved_kg DECIMAL(10,4) NOT NULL,
    water_saved_l DECIMAL(10,4) NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_material CHECK (material_type IN ('aluminum', 'plastic', 'glass', 'paper', 'steel', 'cardboard'))
);

CREATE INDEX IF NOT EXISTS idx_logs_user_date ON recycling_logs (user_id, logged_at DESC);

-- ===================
-- BADGES TABLE
-- ===================
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    criteria JSONB NOT NULL
);

-- ===================
-- USER_BADGES TABLE
-- ===================
CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- ===================
-- REFRESH_TOKENS TABLE
-- ===================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================
-- SEED BADGES
-- ===================
INSERT INTO badges (id, name, emoji, description, criteria) VALUES
    ('first_log',   'First Step',        '🐣', 'Logged your first item!',   '{"type":"total_logs","value":1}'),
    ('streak_3',    'On a Roll',         '🔥', '3-day streak!',             '{"type":"streak","value":3}'),
    ('streak_7',    'Week Warrior',      '⭐', '7-day streak!',             '{"type":"streak","value":7}'),
    ('streak_30',   'Eco Legend',        '🏆', '30-day streak!',            '{"type":"streak","value":30}'),
    ('items_50',    'Half Century',      '🌟', '50 items recycled!',        '{"type":"total_items","value":50}'),
    ('items_500',   'Recycling Machine', '♻️', '500 items recycled!',       '{"type":"total_items","value":500}'),
    ('carbon_10',   'Carbon Cutter',     '🌿', '10 kg CO₂ saved!',         '{"type":"carbon_saved","value":10}'),
    ('tree_grown',  'Tree Grower',       '🌳', '22 kg CO₂ = 1 tree/year!', '{"type":"carbon_saved","value":22}')
ON CONFLICT (id) DO NOTHING;
