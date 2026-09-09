// app/api/auth/session/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Profile, UserRole } from '@/types/database.types';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        profile: null,
        role: null,
        onboardingCompleted: false,
      });
    }

    let role: UserRole = (user.user_metadata?.role as UserRole) || 'student';
    let profile: Profile | null = null;
    let onboardingCompleted = role !== 'student';

    // 1. Attempt to fetch profile from database
    try {
      const { data: dbProfile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (dbProfile && !profError) {
        profile = dbProfile as Profile;
        if (dbProfile.role) {
          role = dbProfile.role as UserRole;
        }
      }
    } catch {
      // Database table not yet created; fallback to metadata
    }

    // Fallback profile if database table does not exist or row missing
    if (!profile) {
      profile = {
        id: user.id,
        email: user.email || '',
        full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'User',
        role,
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };
    }

    // 2. If student, check onboarding status
    if (role === 'student') {
      try {
        const { data: studentProf } = await supabase
          .from('student_profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (studentProf) {
          onboardingCompleted = Boolean(studentProf.onboarding_completed);
        } else {
          // If profile table doesn't exist, assume completed if metadata says so
          onboardingCompleted = Boolean(user.user_metadata?.onboarding_completed ?? true);
        }
      } catch {
        onboardingCompleted = true;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
      profile,
      role,
      onboardingCompleted,
    });
  } catch (err: any) {
    console.error('Session API error:', err);
    return NextResponse.json(
      { authenticated: false, error: err.message },
      { status: 500 }
    );
  }
}
