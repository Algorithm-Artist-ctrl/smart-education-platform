// scripts/apply-migrations-direct.mjs
// Direct PostgreSQL migration runner using pg client over Supabase Pooler
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPassword = process.env.DB_PASSWORD || process.argv[2] || 'Tarun@759977';
const projectRef = 'rsktgmqhlhpnoosmfgvz';
const poolerHost = process.env.SUPABASE_DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com';
const poolerPort = 5432; // Session mode for DDL execution

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
  connectionTimeoutMillis: 15000,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected successfully to PostgreSQL database!');

    const sqlPath = path.join(__dirname, '..', 'supabase', 'full_setup.sql');
    console.log(`Reading SQL file: ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing full schema & seed migration (this may take 5-15 seconds)...');
    const startTime = Date.now();
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n🎉 ALL MIGRATIONS, TABLES, RLS POLICIES, TRIGGERS & SEED DATA APPLIED in ${duration}s!`);

    // Verify tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`\nVerified: ${tableRes.rows.length} tables now present in public schema:`);
    tableRes.rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.table_name}`));

    // Verify row counts of key tables
    const countRes = await client.query(`
      SELECT 
        (SELECT count(*) FROM public.subjects) as subjects_count,
        (SELECT count(*) FROM public.topics) as topics_count,
        (SELECT count(*) FROM public.assessments) as assessments_count,
        (SELECT count(*) FROM public.questions) as questions_count,
        (SELECT count(*) FROM public.gamification_badges) as badges_count;
    `);
    console.log('\nSeed Data Verification:');
    console.log(countRes.rows[0]);

  } catch (err) {
    console.error('❌ Migration execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
