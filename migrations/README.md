# Migrations

This folder contains SQL migrations for the project. The project is configured to use `drizzle-kit` (see `drizzle.config.ts`) and migrations are placed in this folder.

How to run the migration locally

1. Ensure `DATABASE_URL` is set to a postgres connection string pointing to the target database (development/staging). For PowerShell (set for the current session and run):

```powershell
$env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname'; npm run db:push
```

2. Recommended safety steps before running:
- Backup the database (pg_dump) or run on a copy/staging first.
- Inspect the SQL file `20251025_remove_gps_add_talhao_counters.sql` to confirm it matches what you expect.

3. Verification queries (run after migration):

```sql
-- Check new table exists
SELECT * FROM talhao_counters LIMIT 5;

-- Confirm GPS columns were removed (list columns of `bales`):
SELECT column_name FROM information_schema.columns WHERE table_name='bales';

-- Check padded numeros
SELECT id, numero FROM bales WHERE numero ~ '^0+' LIMIT 10;
```

Notes
- `drizzle.config.ts` requires `DATABASE_URL` and will throw if it's not set.
- If you need me to run the migration here, provide a connection string (not recommended in public channels) or run the `npm run db:push` command locally and paste the output.
