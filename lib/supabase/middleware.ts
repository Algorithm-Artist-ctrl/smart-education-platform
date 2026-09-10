// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith('sb-'));

  // Protected route prefixes
  const protectedRoutes = ['/student', '/teacher', '/parent', '/admin', '/super-admin', '/onboarding'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Fast path 1: Public route visitor with no auth cookies needs zero Supabase roundtrips
  if (!hasAuthCookie && !isProtectedRoute && pathname !== '/login' && pathname !== '/register') {
    return supabaseResponse;
  }

  // Fast path 2: Unauthenticated user accessing protected route with no auth cookies
  if (!hasAuthCookie && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper to preserve cookies across Next.js redirects
  const createRedirect = (targetUrl: string | URL) => {
    const redirectResponse = NextResponse.redirect(
      typeof targetUrl === 'string' ? new URL(targetUrl, request.url) : targetUrl
    );
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // 1. Unauthenticated users cannot access protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return createRedirect(loginUrl);
  }

  // 2. Authenticated user access control
  if (user) {
    // Determine role from profiles table (source of truth), with fallback to metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role as string) || (user.user_metadata?.role as string) || 'student';

    // Check student onboarding status if applicable
    let onboardingCompleted = true;
    if (role === 'student') {
      const { data: studentProf } = await supabase
        .from('student_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      onboardingCompleted = Boolean(studentProf?.onboarding_completed);
    }

    // Determine target dashboard based on role and onboarding status
    const getDashboardPath = () => {
      if (role === 'student') {
        return onboardingCompleted ? '/student' : '/onboarding';
      }
      if (role === 'teacher') return '/teacher';
      if (role === 'parent') return '/parent';
      if (role === 'admin') return '/admin';
      if (role === 'super_admin') return '/super-admin';
      return '/student';
    };

    const targetDashboard = getDashboardPath();

    // Authenticated user accessing auth pages (/login or /register)
    if (pathname === '/login' || pathname === '/register') {
      return createRedirect(targetDashboard);
    }

    // Onboarding route access control
    if (pathname.startsWith('/onboarding')) {
      if (role !== 'student') {
        return createRedirect(targetDashboard);
      }
      if (onboardingCompleted) {
        return createRedirect('/student');
      }
      return supabaseResponse;
    }

    // Student routes access control
    if (pathname.startsWith('/student')) {
      if (role === 'student' && !onboardingCompleted) {
        return createRedirect('/onboarding');
      }
      // Allow student, admin, and super_admin
      if (role !== 'student' && role !== 'admin' && role !== 'super_admin') {
        return createRedirect(targetDashboard);
      }
    }

    // Teacher routes access control
    if (pathname.startsWith('/teacher')) {
      if (role !== 'teacher' && role !== 'admin' && role !== 'super_admin') {
        return createRedirect(targetDashboard);
      }
    }

    // Parent routes access control
    if (pathname.startsWith('/parent')) {
      if (role !== 'parent' && role !== 'admin' && role !== 'super_admin') {
        return createRedirect(targetDashboard);
      }
    }

    // Admin routes access control
    if (pathname.startsWith('/admin')) {
      if (role !== 'admin' && role !== 'super_admin') {
        return createRedirect(targetDashboard);
      }
    }

    // Super-Admin routes access control
    if (pathname.startsWith('/super-admin')) {
      if (role !== 'super_admin') {
        return createRedirect(targetDashboard);
      }
    }
  }

  return supabaseResponse;
}
