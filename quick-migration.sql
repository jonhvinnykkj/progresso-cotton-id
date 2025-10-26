-- Migração Rápida para Rastreamento de Usuários
-- Execute este SQL no console do Neon: https://console.neon.tech/

-- 1. Adicionar colunas na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Atualizar users existentes com display_name
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- 3. Adicionar colunas na tabela bales
ALTER TABLE bales ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE bales ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE bales ADD COLUMN IF NOT EXISTS transported_at TIMESTAMP;
ALTER TABLE bales ADD COLUMN IF NOT EXISTS transported_by TEXT;
ALTER TABLE bales ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE bales ADD COLUMN IF NOT EXISTS processed_by TEXT;

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_bales_created_by ON bales(created_by);
CREATE INDEX IF NOT EXISTS idx_bales_transported_by ON bales(transported_by);
CREATE INDEX IF NOT EXISTS idx_bales_processed_by ON bales(processed_by);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- 5. Criar usuário superadmin (se não existir)
INSERT INTO users (username, display_name, password, role) 
VALUES ('superadmin', 'Super Administrador', 'super123', 'superadmin') 
ON CONFLICT (username) DO UPDATE SET display_name = 'Super Administrador', role = 'superadmin';

-- 6. Atualizar usuários padrão com display_name
UPDATE users SET display_name = 'Administrador' WHERE username = 'admin' AND display_name IS NULL;
UPDATE users SET display_name = 'Operador de Campo' WHERE username = 'campo' AND display_name IS NULL;
UPDATE users SET display_name = 'Operador de Transporte' WHERE username = 'transporte' AND display_name IS NULL;
UPDATE users SET display_name = 'Operador de Algodoeira' WHERE username = 'algodoeira' AND display_name IS NULL;

-- 7. Verificar se tudo foi criado
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'bales' 
  AND column_name IN ('created_by', 'updated_by', 'transported_by', 'transported_at', 'processed_by', 'processed_at')
ORDER BY column_name;

SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('display_name', 'created_by')
ORDER BY column_name;

-- 8. Verificar usuário superadmin
SELECT id, username, display_name, role FROM users WHERE role = 'superadmin';
