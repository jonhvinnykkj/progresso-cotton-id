-- Script para corrigir IDs de usuários em fardos antigos
-- Este script atualiza os fardos que têm IDs numéricos para usar UUIDs

-- Se a tabela de mapeamento ainda existe, use-a para atualizar
-- Caso contrário, você precisará fazer manualmente

-- Verificar se a tabela de mapeamento existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_id_mapping') THEN
    -- Atualizar created_by
    UPDATE bales b
    SET created_by = m.new_id
    FROM user_id_mapping m
    WHERE b.created_by = m.old_id;

    -- Atualizar updated_by
    UPDATE bales b
    SET updated_by = m.new_id
    FROM user_id_mapping m
    WHERE b.updated_by = m.old_id;

    -- Atualizar transported_by
    UPDATE bales b
    SET transported_by = m.new_id
    FROM user_id_mapping m
    WHERE b.transported_by = m.old_id;

    -- Atualizar processed_by
    UPDATE bales b
    SET processed_by = m.new_id
    FROM user_id_mapping m
    WHERE b.processed_by = m.old_id;

    RAISE NOTICE 'Fardos atualizados com sucesso usando a tabela de mapeamento';
  ELSE
    RAISE NOTICE 'Tabela user_id_mapping não encontrada. Execute o script abaixo manualmente.';
  END IF;
END $$;

-- Se a tabela de mapeamento NÃO existe, você pode atualizar manualmente
-- Primeiro, veja quais usuários existem:
-- SELECT id, username, display_name FROM users;

-- Depois, atualize os fardos com os IDs corretos
-- Exemplo: Se o usuário "campo" tem ID 'abc-123-uuid'
-- UPDATE bales SET created_by = 'abc-123-uuid' WHERE created_by = '20';
-- UPDATE bales SET transported_by = 'abc-123-uuid' WHERE transported_by = '21';

-- Para ver quais IDs antigos ainda existem:
SELECT DISTINCT 
  created_by as old_id,
  'created_by' as field
FROM bales 
WHERE created_by IS NOT NULL 
  AND created_by NOT IN (SELECT id FROM users)
UNION
SELECT DISTINCT 
  updated_by as old_id,
  'updated_by' as field
FROM bales 
WHERE updated_by IS NOT NULL 
  AND updated_by NOT IN (SELECT id FROM users)
UNION
SELECT DISTINCT 
  transported_by as old_id,
  'transported_by' as field
FROM bales 
WHERE transported_by IS NOT NULL 
  AND transported_by NOT IN (SELECT id FROM users)
UNION
SELECT DISTINCT 
  processed_by as old_id,
  'processed_by' as field
FROM bales 
WHERE processed_by IS NOT NULL 
  AND processed_by NOT IN (SELECT id FROM users);

-- Contar quantos fardos serão afetados
SELECT 
  COUNT(*) FILTER (WHERE created_by NOT IN (SELECT id FROM users)) as created_by_invalid,
  COUNT(*) FILTER (WHERE updated_by IS NOT NULL AND updated_by NOT IN (SELECT id FROM users)) as updated_by_invalid,
  COUNT(*) FILTER (WHERE transported_by IS NOT NULL AND transported_by NOT IN (SELECT id FROM users)) as transported_by_invalid,
  COUNT(*) FILTER (WHERE processed_by IS NOT NULL AND processed_by NOT IN (SELECT id FROM users)) as processed_by_invalid
FROM bales;
