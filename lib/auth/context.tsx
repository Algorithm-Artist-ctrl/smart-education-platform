// lib/auth/context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile, StudentProfile, UserRole } from '@/types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  studentProfile: StudentProfile | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  studentProfile: null,
  role: null,
  onboardingCompleted: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  const syncSessionFromServer = useCallback(async () => {
    // Optimization: Skip network fetch if no auth cookie exists in browser
    if (typeof document !== 'undefined') {
      const hasAuthCookie = document.cookie.split(';').some((c) => c.trim().startsWith('sb-'));
      if (!hasAuthCookie) {
        setUser(null);
        setProfile(null);
        setRole(null);
        setStudentProfile(null);
        setOnboardingCompleted(false);
        setLoading(false);
        return false;
      }
    }

    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();

      if (data.authenticated && data.user) {
        setUser(data.user as User);
        setProfile(data.profile as Profile);
        setRole(data.role as UserRole);
        setOnboardingCompleted(Boolean(data.onboardingCompleted));
        return true;
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setStudentProfile(null);
        setOnboardingCompleted(false);
        return false;
      }
    } catch (err) {
      console.warn('Session check error, falling back to local client:', err);

      // Client-side fallback if server route is unavailable
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const authUser = sessionData.session.user;
          setUser(authUser);
          const fallbackRole = (authUser.user_metadata?.role as UserRole) || 'student';
          setRole(fallbackRole);
          setProfile({
            id: authUser.id,
            email: authUser.email || '',
            full_name: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'User',
            role: fallbackRole,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at || authUser.created_at,
          });
          setOnboardingCompleted(fallbackRole !== 'student');
          return true;
        }
      } catch (clientErr) {
        console.warn('Client session check fallback failed:', clientErr);
      }

      setUser(null);
      setProfile(null);
      setRole(null);
      setStudentProfile(null);
      setOnboardingCompleted(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    await syncSessionFromServer();
  }, [syncSessionFromServer]);

  useEffect(() => {
    let isMounted = true;

    // Initial check via same-origin server session
    syncSessionFromServer();

    // Listen to real-time auth changes from Supabase client
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await syncSessionFromServer();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
          setStudentProfile(null);
          setOnboardingCompleted(false);
          setLoading(false);
        }
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    } catch {
      // Ignore client listener setup errors
      return () => {
        isMounted = false;
      };
    }
  }, [supabase, syncSessionFromServer]);

  const signOut = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore server logout error
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore client signout error
    }

    setUser(null);
    setProfile(null);
    setRole(null);
    setStudentProfile(null);
    setOnboardingCompleted(false);
    setLoading(false);

    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        studentProfile,
        role,
        onboardingCompleted,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
