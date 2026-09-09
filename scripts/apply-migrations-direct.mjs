// scripts/apply-migrations-direct.mjs
// Direct PostgreSQL migration runner using pg client over Supabase Pooler
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPassword = process.env.DB_PASSWORD || process.argv[2];

if (!dbPassword) {
  console.error('Usage: node scripts/apply-migrations-direct.mjs <db_password>');
  console.error('Or set DB_PASSWORD environment variable.');
  process.exit(1);
}

const projectRef = 'gzejdomnlxlxkhzhxwnc';
const poolerHost = 'aws-0-ap-southeast-1.pooler.supabase.com';
const poolerPort = 5432; // Session mode for DDL statements

console.log('===============================================================');
console.log('  SMART EDUCATION — DIRECT POSTGRESQL MIGRATION RUNNER');
console.log(`  Connecting to: ${poolerHost}:${poolerPort}`);
console.log(`  User: postgres.${projectRef}`);
console.log('===============================================================\n');

const client = new Client({
  user: `postgres.${projectRef}`,
  password: dbPassword,
  host: poolerHost,
  port: poolerPort,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected successfully to PostgreSQL database!');

    const sqlPath = path.join(__dirname, '..', 'supabase', 'full_setup.sql');
    console.log(`Reading SQL file: ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing migration script (this may take 5-10 seconds)...');
    const startTime = Date.now();
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ All migrations, schema, RLS, triggers & seed data applied successfully in ${duration}s!`);

    // Verify table count
    const tableRes = await client.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    console.log(`\nVerified: ${tableRes.rows[0].count} tables now active in public schema!`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
