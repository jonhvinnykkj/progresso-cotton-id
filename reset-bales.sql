-- Script SIMPLES: Deletar todos os fardos e resetar contadores
-- Use este script se você quiser começar do zero

-- Deletar todos os fardos
DELETE FROM bales;

-- Resetar contadores de talhões
DELETE FROM talhao_counters;

-- Verificar
SELECT COUNT(*) as total_fardos FROM bales;
SELECT COUNT(*) as total_contadores FROM talhao_counters;

-- Pronto! Agora você pode criar novos fardos que usarão os UUIDs corretos.
