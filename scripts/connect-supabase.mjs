// scripts/connect-supabase.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('--- Checking Supabase Connection ---');

if (!url || !key || url.includes('placeholder')) {
  console.error('ERROR: Supabase URL and Key are not set or contain placeholders.');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function verify() {
  try {
    console.log(`Pinging Supabase at: ${url}`);
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      console.log(`Database reachable, query status: ${error.message}`);
    } else {
      console.log('✓ Successfully connected to Supabase Database!');
    }
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

verify();
