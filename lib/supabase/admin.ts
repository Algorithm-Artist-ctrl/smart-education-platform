// lib/supabase/admin.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const FALLBACK_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJza3RnbXFobGhwbm9vc21mZ3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk2MTI2MiwiZXhwIjoyMTA0NTM3MjYyfQ.CDfh7AQnAwaE5CAl3s8IxlcDw_aN5FHa9IXPFaPNEGQ';

const FALLBACK_SUPABASE_URL = 'https://rsktgmqhlhpnoosmfgvz.supabase.co';

// Strictly server-side client with service_role key to manage role permissions and admin tasks
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
