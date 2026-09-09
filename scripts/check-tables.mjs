// scripts/check-tables.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function check() {
  const tables = [
    'profiles',
    'institutions',
    'classes',
    'sections',
    'subjects',
    'topics',
    'learning_content',
    'assessments',
    'questions',
    'quiz_attempts',
    'weak_topics',
    'study_plans',
    'revision_tasks',
    'assignments',
    'assignment_submissions',
    'attendance',
    'notifications',
    'gamification_badges',
    'student_badges',
    'career_profiles',
  ];

  console.log('Checking database tables:');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`- ${table}: MISSING (${error.code || error.message})`);
    } else {
      console.log(`- ${table}: EXISTS`);
    }
  }
}

check();
