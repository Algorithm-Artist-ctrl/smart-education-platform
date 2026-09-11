import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const connectionConfig = {
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.rsktgmqhlhpnoosmfgvz',
  password: 'Tarun@759977',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

const migrationFiles = [
  '004_adaptive_companion_system.sql',
  '005_personal_ai_partner.sql',
  '006_learning_intelligence_overhaul.sql',
  '007_structured_curriculum_and_learning_path.sql'
];

async function run() {
  for (const file of migrationFiles) {
    const fullPath = path.join(process.cwd(), 'supabase', 'migrations', file);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${file}`);
      continue;
    }
    console.log(`\nExecuting migration: ${file}...`);
    const sql = fs.readFileSync(fullPath, 'utf8');

    const client = new Client(connectionConfig);
    try {
      await client.connect();
      await client.query(sql);
      console.log(`✅ Successfully executed ${file}`);
    } catch (err) {
      console.error(`❌ Error executing ${file}:`, err.message);
    } finally {
      await client.end();
    }
  }
}

run();
