-- Create bales table (WITHOUT qr_code column)
CREATE TABLE IF NOT EXISTS bales (
  id TEXT PRIMARY KEY,
  numero INTEGER NOT NULL,
  talhao TEXT NOT NULL,
  safra TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'campo',
  status_history TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add status_history column if it doesn't exist (migration)
ALTER TABLE bales ADD COLUMN IF NOT EXISTS status_history TEXT;

-- Create talhao_counters table
CREATE TABLE IF NOT EXISTS talhao_counters (
  id SERIAL PRIMARY KEY,
  safra TEXT NOT NULL,
  talhao TEXT NOT NULL DEFAULT '',
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(safra, talhao)
);

-- Create users table (PLAIN TEXT PASSWORDS)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default users with PLAIN TEXT passwords
INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin') ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, role) VALUES ('campo', 'campo123', 'campo') ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, role) VALUES ('transporte', 'trans123', 'transporte') ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, role) VALUES ('algodoeira', 'algo123', 'algodoeira') ON CONFLICT (username) DO NOTHING;

-- Insert default safra setting
INSERT INTO settings (key, value) VALUES ('default-safra', '25/26') ON CONFLICT (key) DO UPDATE SET value = '25/26';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bales_talhao ON bales(talhao);

CREATE INDEX IF NOT EXISTS idx_bales_safra ON bales(safra);

CREATE INDEX IF NOT EXISTS idx_bales_status ON bales(status);

CREATE INDEX IF NOT EXISTS idx_talhao_counters_safra ON talhao_counters(safra);
