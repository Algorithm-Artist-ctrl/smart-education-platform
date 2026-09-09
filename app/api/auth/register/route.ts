// app/api/auth/register/route.ts
import { createClient } from '@/lib/supabase/server';
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

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: role || 'student',
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists. Please sign in.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    const hasSession = Boolean(data.session);

    let redirectTo = '/student';
    if (role === 'teacher') redirectTo = '/teacher';
    else if (role === 'parent') redirectTo = '/parent';
    else if (role === 'admin') redirectTo = '/admin';
    else if (role === 'super_admin') redirectTo = '/super-admin';
    else redirectTo = '/onboarding';

    return NextResponse.json({
      success: true,
      hasSession,
      user: data.user,
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
