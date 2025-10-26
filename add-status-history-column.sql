-- Script para adicionar coluna status_history na tabela bales
-- Execute este SQL diretamente no console do Neon Database

-- Adiciona a coluna status_history se ela não existir
ALTER TABLE bales ADD COLUMN IF NOT EXISTS status_history TEXT;

-- Verifica se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bales' 
ORDER BY ordinal_position;
