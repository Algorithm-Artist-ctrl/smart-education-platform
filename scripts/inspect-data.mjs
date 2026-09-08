// scripts/inspect-data.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function inspect() {
  const { data, error, count } = await supabase.from('subjects').select('*');
  console.log('subjects count/data:', { error, length: data?.length });
  if (data && data.length > 0) {
    console.log('Sample subject:', data[0]);
  }
}

inspect();
