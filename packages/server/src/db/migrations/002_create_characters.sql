-- ============================================================
-- Migration 002: Create characters table
-- ============================================================

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(20) UNIQUE NOT NULL,
  class VARCHAR(20) NOT NULL DEFAULT 'dark_knight',
  level INTEGER NOT NULL DEFAULT 1,
  experience BIGINT NOT NULL DEFAULT 0,
  strength INTEGER NOT NULL DEFAULT 10,
  agility INTEGER NOT NULL DEFAULT 10,
  energy INTEGER NOT NULL DEFAULT 10,
  vitality INTEGER NOT NULL DEFAULT 10,
  hp INTEGER NOT NULL DEFAULT 50,
  mp INTEGER NOT NULL DEFAULT 10,
  map_id VARCHAR(50) NOT NULL DEFAULT 'lorencia',
  pos_x INTEGER NOT NULL DEFAULT 25,
  pos_y INTEGER NOT NULL DEFAULT 20,
  gold BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_characters_account ON characters(account_id);
CREATE INDEX idx_characters_name ON characters(name);
