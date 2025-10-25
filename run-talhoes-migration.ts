import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const migration = `
-- Criar tabela de informações dos talhões
CREATE TABLE IF NOT EXISTS talhoes_info (
  id VARCHAR PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  hectares TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Popular com os talhões existentes
INSERT INTO talhoes_info (id, nome, hectares) VALUES
  (gen_random_uuid(), '1B', '774.90'),
  (gen_random_uuid(), '2B', '762.20'),
  (gen_random_uuid(), '3B', '661.00'),
  (gen_random_uuid(), '4B', '573.60'),
  (gen_random_uuid(), '5B', '472.60'),
  (gen_random_uuid(), '2A', '493.90'),
  (gen_random_uuid(), '3A', '338.50'),
  (gen_random_uuid(), '4A', '368.30'),
  (gen_random_uuid(), '5A', '493.00')
ON CONFLICT (nome) DO NOTHING;
`;

async function runMigration() {
  try {
    console.log("🔄 Running migration: add talhoes_info table...");
    
    // Split by semicolon and execute each statement
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      await sql(statement);
    }
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
