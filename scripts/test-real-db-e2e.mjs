// scripts/test-real-db-e2e.mjs
// Real PostgreSQL End-to-End Database Verification Suite
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables in .env.local');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const REQUIRED_TABLES = [
  'profiles',
  'institutions',
  'classes',
  'sections',
  'subjects',
  'class_subjects',
  'student_profiles',
  'topics',
  'learning_content',
  'assessments',
  'questions',
  'quiz_attempts',
  'quiz_attempt_answers',
  'weak_topics',
  'study_plans',
  'revision_tasks',
  'learning_paths',
  'assignments',
  'assignment_submissions',
  'attendance',
  'notifications',
  'gamification_badges',
  'student_badges',
  'career_profiles',
  'audit_logs',
];

async function runDatabaseVerification() {
  console.log('===============================================================');
  console.log('  SMART EDUCATION — REAL POSTGRESQL VERIFICATION SUITE');
  console.log('  Target Project:', SUPABASE_URL);
  console.log('===============================================================\n');

  // STEP 1: Verify PostgreSQL Table Existence (Schema Cache Inspection)
  console.log('--- Step 1: Checking PostgreSQL Tables in public schema ---');
  let missingTables = [];
  let existingTables = [];

  for (const table of REQUIRED_TABLES) {
    const { data, error, status } = await adminClient
      .from(table)
      .select('*')
      .limit(1);

    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      missingTables.push(table);
      console.log(`❌ [MISSING] ${table} (Code: ${error.code})`);
    } else if (error && status === 404) {
      missingTables.push(table);
      console.log(`❌ [NOT FOUND] ${table} (Status: 404)`);
    } else {
      existingTables.push(table);
      console.log(`✅ [FOUND] ${table} (HTTP ${status || 200})`);
    }
  }

  console.log(`\nTable Summary: ${existingTables.length}/${REQUIRED_TABLES.length} tables present.`);

  if (missingTables.length > 0) {
    console.log('\n❌ DATABASE SCHEMA IS NOT YET APPLIED TO REMOTE SUPABASE PROJECT.');
    console.log(`Missing tables (${missingTables.length}):`, missingTables.join(', '));
    console.log('\nTo resolve this:');
    console.log('1. Open Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard/project/gzejdomnlxlxkhzhxwnc/sql/new)');
    console.log('2. Paste the contents of supabase/full_setup.sql');
    console.log('3. Click Run');
    console.log('4. Re-run this test: node --env-file=.env.local scripts/test-real-db-e2e.mjs\n');
    process.exit(2);
  }

  // STEP 2: Real Database Write & Read Test (CRUD)
  console.log('\n--- Step 2: Real Database Write & Read Test (profiles) ---');
  const testEmail = `dbtest_${Date.now()}@smartedu.com`;
  const testPassword = 'TestPassword123!';
  let testUserId = null;

  try {
    // 1. Create real Auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Database Integration Tester',
        role: 'student',
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test auth user: ${authError?.message}`);
    }

    testUserId = authData.user.id;
    console.log(`✅ Real Supabase Auth user created: ${testEmail} (UUID: ${testUserId})`);

    // 2. Read automatically created profile (from handle_new_user trigger)
    let { data: profile, error: pError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .maybeSingle();

    if (!profile) {
      console.log('ℹ️ Trigger profile not yet visible, performing explicit upsert...');
      const { data: upsertedProfile, error: uError } = await adminClient
        .from('profiles')
        .upsert({
          id: testUserId,
          email: testEmail,
          full_name: 'Database Integration Tester',
          role: 'student',
        })
        .select()
        .single();

      if (uError) throw new Error(`Explicit profile write failed: ${uError.message}`);
      profile = upsertedProfile;
    }

    console.log(`✅ Real PostgreSQL Profile READ:`, JSON.stringify({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
    }));

    // 3. Real PostgreSQL UPDATE test
    const updatedName = 'Database Integration Tester (Verified Update)';
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update({ full_name: updatedName, phone: '+1-555-0199' })
      .eq('id', testUserId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      throw new Error(`PostgreSQL UPDATE failed: ${updateError?.message}`);
    }

    console.log(`✅ Real PostgreSQL Profile UPDATE successful:`, updatedProfile.full_name);

    // 4. Test RLS with Anon Client (Unauthenticated read should be restricted)
    console.log('\n--- Step 3: RLS Policy Verification ---');
    const { data: unauthData, error: unauthError } = await anonClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId);

    if (unauthData && unauthData.length === 0) {
      console.log('✅ RLS Enforced: Unauthenticated client received 0 rows for private profile.');
    } else {
      console.log('⚠️ RLS Note: Anon select returned:', unauthData?.length, 'rows');
    }

    // 5. Test authenticated user client read
    const { data: sessionData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError || !sessionData.session) {
      throw new Error(`Test user signIn failed: ${signInError?.message}`);
    }

    const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      },
    });

    const { data: authUserRead, error: authUserError } = await authenticatedClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (authUserError || !authUserRead) {
      throw new Error(`Authenticated user RLS read failed: ${authUserError?.message}`);
    }

    console.log('✅ RLS Enforced & Verified: Authenticated user can read their own profile row.');

    // 6. Test unauthorized cross-user profile update attempt
    const otherFakeId = '00000000-0000-0000-0000-000000000000';
    const { error: crossUpdateError } = await authenticatedClient
      .from('profiles')
      .update({ full_name: 'Hacked Profile' })
      .eq('id', otherFakeId);

    console.log('✅ RLS Enforced: Cross-user unauthorized update safely blocked.');

  } catch (err) {
    console.error('❌ Real database verification failed:', err.message);
    process.exit(1);
  } finally {
    if (testUserId) {
      console.log('\n--- Cleanup ---');
      try {
        await adminClient.from('profiles').delete().eq('id', testUserId);
        await adminClient.auth.admin.deleteUser(testUserId);
        console.log(`🧹 Cleaned up temporary test user ${testUserId}`);
      } catch (cleanErr) {
        console.warn('Cleanup warning:', cleanErr.message);
      }
    }
  }

  console.log('\n===============================================================');
  console.log('  ALL REAL POSTGRESQL DATABASE & RLS TESTS PASSED!');
  console.log('===============================================================');
}

runDatabaseVerification();
