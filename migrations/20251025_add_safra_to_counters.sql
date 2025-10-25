-- Migration: Add safra to talhao_counters and update structure
-- Created: 2025-10-25
-- Purpose: Allow counter reset per safra (numeração zera a cada safra)

BEGIN;

-- 1. Drop the old unique constraint on talhao
ALTER TABLE talhao_counters DROP CONSTRAINT IF EXISTS talhao_counters_talhao_unique;

-- 2. Add safra column (temporarily nullable)
ALTER TABLE talhao_counters ADD COLUMN IF NOT EXISTS safra TEXT;

-- 3. Update existing rows with a default safra (você pode alterar para a safra atual)
UPDATE talhao_counters SET safra = '2526' WHERE safra IS NULL;

-- 4. Make safra NOT NULL
ALTER TABLE talhao_counters ALTER COLUMN safra SET NOT NULL;

-- 5. Create new unique constraint on safra + talhao
CREATE UNIQUE INDEX IF NOT EXISTS idx_talhao_counters_safra_talhao ON talhao_counters(safra, talhao);

COMMIT;
