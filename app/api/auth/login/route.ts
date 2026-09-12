// app/api/auth/login/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase configuration is missing in the hosting environment. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Render Dashboard Environment settings, then redeploy.',
          code: 'CONFIG_MISSING',
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      let userFriendlyError = error.message;

      if (msg.includes('invalid login credentials')) {
        userFriendlyError = 'Invalid email or password. Please check your credentials and try again.';
      } else if (msg.includes('email not confirmed')) {
        userFriendlyError = 'Your email is not verified yet. Please check your inbox for the verification email.';
      }

      return NextResponse.json(
        { success: false, error: userFriendlyError, code: error.code || 'AUTH_ERROR' },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed. Please try again.' },
        { status: 401 }
      );
    }

    // Determine role from profiles table (source of truth), with fallback to metadata
    let role = (data.user.user_metadata?.role as string) || 'student';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role;
      }
    } catch {
      // Fallback remains user_metadata.role
    }

    // Determine target redirection path
    let redirectTo = '/student';
    if (role === 'teacher') {
      redirectTo = '/teacher';
    } else if (role === 'parent') {
      redirectTo = '/parent';
    } else if (role === 'admin') {
      redirectTo = '/admin';
    } else if (role === 'super_admin') {
      redirectTo = '/super-admin';
    } else {
      // Student onboarding check
      try {
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('onboarding_completed')
          .eq('id', data.user.id)
          .maybeSingle();

        if (sp && sp.onboarding_completed) {
          redirectTo = '/student';
        } else {
          redirectTo = '/onboarding';
        }
      } catch {
        redirectTo = '/onboarding';
      }
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      role,
      redirectTo,
    });

    response.cookies.set('smartedu_role', role, { path: '/', maxAge: 60 * 60 * 24 * 7 });
    response.cookies.set('smartedu_onboarded', redirectTo === '/student' ? 'true' : 'false', { path: '/', maxAge: 60 * 60 * 24 * 7 });

    return response;
  } catch (err: any) {
    console.error('Server login error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to connect to the authentication service. Please check your network and try again.',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
