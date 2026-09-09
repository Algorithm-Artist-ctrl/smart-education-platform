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

  const fetchProfileData = useCallback(async (authUser: User) => {
    try {
      // 1. Fetch user profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (prof) {
        setProfile(prof as Profile);
        setRole(prof.role as UserRole);

        // 2. If student, fetch student_profile for onboarding status
        if (prof.role === 'student') {
          const { data: stdProf } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (stdProf) {
            setStudentProfile(stdProf as StudentProfile);
            setOnboardingCompleted(Boolean(stdProf.onboarding_completed));
          } else {
            setStudentProfile(null);
            setOnboardingCompleted(false);
          }
        } else {
          setStudentProfile(null);
          setOnboardingCompleted(true);
        }
      } else {
        // Fallback to auth metadata if database row is initializing
        const fallbackRole = (authUser.user_metadata?.role as UserRole) || 'student';
        setRole(fallbackRole);
        setProfile(null);
        setStudentProfile(null);
        setOnboardingCompleted(fallbackRole !== 'student');
      }
    } catch (err) {
      console.error('Error fetching user profile in AuthProvider:', err);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfileData(user);
  }, [user, fetchProfileData]);

  useEffect(() => {
    let isMounted = true;

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchProfileData(session.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setStudentProfile(null);
        setOnboardingCompleted(false);
        setLoading(false);
      }
    });

    // Listen to real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        await fetchProfileData(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setStudentProfile(null);
        setOnboardingCompleted(false);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfileData]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setStudentProfile(null);
    setOnboardingCompleted(false);
    setLoading(false);
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
