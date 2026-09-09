// app/api/auth/register/route.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse, type NextRequest } from 'next/server';

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase configuration is missing in the hosting environment. Please add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY to your Render Dashboard Environment settings, then redeploy.',
          code: 'CONFIG_MISSING',
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    let createdUser = null;

    // 1. Primary Strategy: Use admin client to create pre-confirmed user
    // This avoids email rate limits (429) and email delivery delays
    try {
      const adminClient = createAdminClient();
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

      // Fallback Strategy: Standard signUp
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

    // 2. Insert into profiles & student_profiles if tables exist
    try {
      await supabase.from('profiles').upsert({
        id: createdUser.id,
        email: cleanEmail,
        full_name: cleanName,
        role: assignedRole,
      });

      if (assignedRole === 'student') {
        await supabase.from('student_profiles').upsert({
          id: createdUser.id,
          onboarding_completed: false,
        });
      }
    } catch {
      // Ignored if tables are not yet created in PostgreSQL
    }

    // 3. Automatically sign in to issue session cookie
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
    else redirectTo = '/onboarding';

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
