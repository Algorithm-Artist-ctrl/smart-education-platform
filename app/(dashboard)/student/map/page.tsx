// app/(dashboard)/student/map/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import LearningMapWorld from '@/components/gamification/LearningMapWorld';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import { Subject, Profile, StudentProfile } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function LearningMapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/student/map');
  }

  // Fetch student profile, subjects, topics, and completed quizzes
  const [profileRes, studentProfileRes, subjectsRes, topicsRes, attemptsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_profiles').select('*').eq('id', user.id).single(),
    supabase.from('subjects').select('*').order('created_at', { ascending: true }),
    supabase.from('topics').select('id, subject_id'),
    supabase.from('quiz_attempts').select('topic_id, passed, score_percentage').eq('student_id', user.id),
  ]);

  const profile = profileRes.data as Profile | null;
  const studentProfile = studentProfileRes.data as StudentProfile | null;
  const subjects = (subjectsRes.data || []) as Subject[];
  const topics = topicsRes.data || [];
  const attempts = attemptsRes.data || [];

  // Calculate subject level progress
  const subjectProgress: Record<string, { completedLevels: number; totalLevels: number }> = {};

  subjects.forEach((sub) => {
    const subTopics = topics.filter((t: any) => t.subject_id === sub.id);
    const completedCount = subTopics.filter((t: any) => 
      attempts.some((a: any) => a.topic_id === t.id && (a.passed || a.score_percentage >= 60))
    ).length;

    subjectProgress[sub.id] = {
      completedLevels: completedCount,
      totalLevels: Math.max(subTopics.length, 1),
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-900/20 via-blue-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 pb-28 md:pb-12">
        <SidebarRail />

        <main className="flex-1 min-w-0 space-y-6">
          {/* Gamification status bar */}
          <GamificationBar
            level={studentProfile?.level || 1}
            currentXp={studentProfile?.xp || 0}
            streakDays={studentProfile?.streak_days || studentProfile?.current_streak || 0}
            coins={studentProfile?.coins || 0}
            totalPoints={studentProfile?.total_points || 0}
          />

          {/* 3D Celestial Archipelago */}
          <div className="cosmic-card p-4 sm:p-6 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <LearningMapWorld
              subjects={subjects}
              subjectProgress={subjectProgress}
            />
          </div>
        </main>
      </div>

      {/* Nova AI Companion */}
      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />

      <MobileBottomNav />
    </div>
  );
}
