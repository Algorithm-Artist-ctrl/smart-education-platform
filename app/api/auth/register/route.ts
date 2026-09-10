// app/api/auth/register/route.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const assignedRole = role || 'student';

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    let createdUser = null;

    // 1. Primary Strategy: Use admin client to create pre-confirmed user
    // This ensures new users can immediately log in without unconfigured SMTP email bottlenecks
    try {
      const { data: adminData, error: adminError } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          role: assignedRole,
        },
      });

      if (adminError) {
        if (adminError.message.toLowerCase().includes('already registered')) {
          return NextResponse.json(
            { success: false, error: 'An account with this email already exists. Please sign in.' },
            { status: 400 }
          );
        }
        throw adminError;
      }

      if (adminData?.user) {
        createdUser = adminData.user;
      }
    } catch (adminErr: any) {
      console.warn('Admin user creation fallback to standard signUp:', adminErr.message);

      const supabase = await createClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: assignedRole,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          return NextResponse.json(
            { success: false, error: 'An account with this email already exists. Please sign in.' },
            { status: 400 }
          );
        }
        return NextResponse.json({ success: false, error: signUpError.message }, { status: 400 });
      }

      if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists. Please sign in instead.' },
          { status: 400 }
        );
      }

      createdUser = signUpData.user;
    }

    if (!createdUser) {
      return NextResponse.json(
        { success: false, error: 'Registration failed. Please try again.' },
        { status: 400 }
      );
    }

    // 2. Guarantee profile and initial data creation using adminClient (bypassing initial anon RLS)
    try {
      await adminClient.from('profiles').upsert({
        id: createdUser.id,
        email: cleanEmail,
        full_name: cleanName,
        role: assignedRole,
        updated_at: new Date().toISOString(),
      });

      if (assignedRole === 'student') {
        // Create base student_profile
        await adminClient.from('student_profiles').upsert({
          id: createdUser.id,
          onboarding_completed: true,
          total_points: 0,
          coins: 50,
          level: 1,
          current_streak: 0,
          learning_goals: [
            'Master Foundations in Mathematics',
            'Learn Logic and Problem Solving',
            'Daily Active Study Routine',
          ],
          updated_at: new Date().toISOString(),
        });

        // Initialize starter diagnostic quest pointing to real assessment
        await adminClient.from('quests').insert({
          student_id: createdUser.id,
          title: 'Master Quadratic Equations',
          subject_name: 'Mathematics',
          duration_minutes: 20,
          xp_reward: 150,
          coins_reward: 20,
          progress_percent: 0,
          status: 'in_progress',
          quest_type: 'assessment',
          target_id: 'd0000000-0000-0000-0000-000000000001',
          created_at: new Date().toISOString(),
        });
      }
    } catch (dbErr: any) {
      console.warn('PostgreSQL initial profile provisioning warning:', dbErr.message);
    }

    // 3. Automatically sign in on server to issue valid session cookies
    const supabase = await createClient();
    let hasSession = false;
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!signInError && signInData.session) {
        hasSession = true;
      }
    } catch (signInErr) {
      console.warn('Post-signup automatic sign-in warning:', signInErr);
    }

    let redirectTo = '/student';
    if (assignedRole === 'teacher') redirectTo = '/teacher';
    else if (assignedRole === 'parent') redirectTo = '/parent';
    else if (assignedRole === 'admin') redirectTo = '/admin';
    else if (assignedRole === 'super_admin') redirectTo = '/super-admin';
    else redirectTo = '/student';

    return NextResponse.json({
      success: true,
      hasSession,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        role: assignedRole,
      },
      redirectTo,
    });
  } catch (err: any) {
    console.error('Server register error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to connect to the authentication service. Please try again.',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
