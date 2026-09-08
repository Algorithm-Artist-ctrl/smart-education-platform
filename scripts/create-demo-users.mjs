// scripts/create-demo-users.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const accounts = [
  {
    email: 'student@smartedu.com',
    password: 'Student@12345',
    full_name: 'Aarav Sharma (Student)',
    role: 'student'
  },
  {
    email: 'teacher@smartedu.com',
    password: 'Teacher@12345',
    full_name: 'Dr. Priya Verma (Teacher)',
    role: 'teacher'
  },
  {
    email: 'parent@smartedu.com',
    password: 'Parent@12345',
    full_name: 'Rajesh Sharma (Parent)',
    role: 'parent'
  },
  {
    email: 'admin@smartedu.com',
    password: 'Admin@12345',
    full_name: 'Vikram Malhotra (School Admin)',
    role: 'admin'
  },
  {
    email: 'superadmin@smartedu.com',
    password: 'SuperAdmin@12345',
    full_name: 'System Super Admin',
    role: 'super_admin'
  }
];

async function seedUsers() {
  console.log('Seeding authentication accounts in Supabase...');

  for (const acc of accounts) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          full_name: acc.full_name,
          role: acc.role
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`- ${acc.role.toUpperCase()}: ${acc.email} (Already exists in Supabase Auth)`);
        } else {
          console.error(`- ${acc.role.toUpperCase()} Error:`, error.message);
        }
      } else {
        console.log(`✓ ${acc.role.toUpperCase()}: Created user ID ${data.user.id} (${acc.email})`);
      }
    } catch (err) {
      console.error(`Failed for ${acc.email}:`, err);
    }
  }
}

seedUsers();
