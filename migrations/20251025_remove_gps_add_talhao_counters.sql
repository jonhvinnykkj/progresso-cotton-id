-- Migration: Remove GPS fields and add talhao_counters
-- Created: 2025-10-25

BEGIN;

-- 1. Create talhao_counters table
CREATE TABLE IF NOT EXISTS talhao_counters (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao TEXT NOT NULL UNIQUE,
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Remove GPS columns from bales table
ALTER TABLE bales DROP COLUMN IF EXISTS latitude;
ALTER TABLE bales DROP COLUMN IF EXISTS longitude;
ALTER TABLE bales DROP COLUMN IF EXISTS campo_latitude;
ALTER TABLE bales DROP COLUMN IF EXISTS campo_longitude;
ALTER TABLE bales DROP COLUMN IF EXISTS patio_latitude;
ALTER TABLE bales DROP COLUMN IF EXISTS patio_longitude;
ALTER TABLE bales DROP COLUMN IF EXISTS beneficiado_latitude;
ALTER TABLE bales DROP COLUMN IF EXISTS beneficiado_longitude;

-- 3. Update existing bales to have proper numero format if needed
-- This will pad existing numbers to 5 digits only for numeric values
UPDATE bales 
SET numero = LPAD(numero, 5, '0')
WHERE LENGTH(numero) < 5 AND numero ~ '^\\d+$';

-- 4. Initialize counters for existing talhoes
INSERT INTO talhao_counters (talhao, last_number, updated_at)
SELECT 
  talhao,
  COALESCE(MAX(CAST(numero AS INTEGER)), 0) as last_number,
  NOW() as updated_at
FROM bales
WHERE talhao IS NOT NULL
  AND numero ~ '^\\d+$'
GROUP BY talhao
ON CONFLICT (talhao) DO NOTHING;

-- 5. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bales_talhao ON bales(talhao);
CREATE INDEX IF NOT EXISTS idx_bales_status ON bales(status);
CREATE INDEX IF NOT EXISTS idx_talhao_counters_talhao ON talhao_counters(talhao);

COMMIT;
