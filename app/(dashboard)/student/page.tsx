// app/(dashboard)/student/page.tsx
// Screen 2: Student Dashboard (Home) — Full-Stack Gamified 3D Experience
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Coins, 
  Trophy, 
  Zap, 
  BookOpen, 
  Target, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Bot
} from 'lucide-react';
import { Profile, StudentProfile, Subject, Quest, WeakTopic, StudyPlan } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/student');
  }

  // 1. Fetch user profile and verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || (user.user_metadata?.role as string) || 'student';
  if (role !== 'student') {
    if (role === 'teacher') redirect('/teacher');
    if (role === 'parent') redirect('/parent');
    if (role === 'admin') redirect('/admin');
    if (role === 'super_admin') redirect('/super-admin');
  }

  // 2. Fetch student profile details
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('*, class:classes(*), section:sections(*)')
    .eq('id', user.id)
    .maybeSingle();

  // If onboarding hasn't been completed, redirect to onboarding
  if (studentProfile && !studentProfile.onboarding_completed) {
    redirect('/onboarding');
  }

  const userProfile: Profile = profile || {
    id: user.id,
    email: user.email || '',
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Aarav Sharma',
    role: 'student',
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  const studentName = userProfile.full_name?.split(' ')[0] || 'Learner';
  const level = studentProfile?.level || 1;
  const totalXp = studentProfile?.total_points || 0;
  const streak = studentProfile?.current_streak || 0;
  const coins = studentProfile?.coins ?? 100;

  // 3. Parallel fetch real data: Quests, Subjects, Weak Topics, Study Plans
  const todayStr = new Date().toISOString().split('T')[0];
  const [questsRes, subjectsRes, weakTopicsRes, studyPlansRes] = await Promise.all([
    supabase
      .from('quests')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true }),
    supabase
      .from('weak_topics')
      .select('*, topic:topics(*)')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .limit(2),
    supabase
      .from('study_plans')
      .select('*, subject:subjects(*), topic:topics(*)')
      .eq('student_id', user.id)
      .eq('plan_date', todayStr)
      .order('created_at', { ascending: true })
      .limit(3),
  ]);

  const quests: Quest[] = questsRes.data || [];
  const subjects: Subject[] = subjectsRes.data || [];
  const weakTopics: WeakTopic[] = weakTopicsRes.data || [];
  const todayPlans: StudyPlan[] = studyPlansRes.data || [];

  // Identify today's primary quest
  const primaryQuest: Quest = quests[0] || {
    id: 'default-quest',
    student_id: user.id,
    title: 'Master Quadratic Equations',
    subject_name: 'Mathematics',
    duration_minutes: 20,
    xp_reward: 150,
    coins_reward: 20,
    progress_percent: 80,
    status: 'in_progress',
    quest_type: 'topic',
    created_at: new Date().toISOString(),
  };

  const primaryWeakTopic = weakTopics[0]?.topic?.name || 'Quadratic Equations';

  return (
    <div className="min-h-screen flex flex-col bg-cosmic-950 text-slate-100 pb-20 md:pb-12 selection:bg-indigo-500 selection:text-white">
      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Top Gamification Bar (Level, Streak, Coins, Rank) */}
        <GamificationBar
          level={level}
          totalXp={totalXp}
          streak={streak}
          coins={coins}
          rankText="Top 5%"
        />

        {/* Hero Section: Welcome & Nova AI Prompt (Matching Screen 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Welcome Card (8 Cols) */}
          <div className="lg:col-span-8 glass-card rounded-3xl p-6 sm:p-8 border border-indigo-500/20 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-950/40">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-indigo-500/15 via-cyan-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Adventure Mode Active</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">{studentName}!</span>
              </h1>
              <p className="text-sm text-slate-300 mt-1 italic font-medium">
                "Small steps everyday lead to big results."
              </p>
            </div>

            {/* Today's Main Quest Widget inside Hero (Reference Screen 2) */}
            <div className="relative z-10 mt-6 pt-5 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400">
                    Today's Quest
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {primaryQuest.title}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {primaryQuest.subject_name || 'Curriculum'} · {primaryQuest.duration_minutes} min
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                    +{primaryQuest.xp_reward} XP
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    +{primaryQuest.coins_reward} Coins
                  </span>
                </div>
              </div>

              {/* Quest Progress Bar */}
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Mission Progress</span>
                  <span className="text-white font-bold">{primaryQuest.progress_percent}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 p-0.5 border border-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700 shadow-sm shadow-cyan-400"
                    style={{ width: `${primaryQuest.progress_percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Link
                  href="/student/revision"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>Continue Quest</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Nova AI Companion Card (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <NovaAICompanion
              weakTopicName={primaryWeakTopic}
              studentName={studentName}
              recommendedSubject="Mathematics"
              className="flex-1"
            />

            {/* Quick Challenge CTA Card */}
            <div className="glass-card rounded-2xl p-4 border border-purple-500/20 shadow-xl shadow-purple-950/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-black text-purple-400">Daily Challenge</span>
                <h4 className="text-xs font-bold text-white">Diagnostic Quiz</h4>
                <p className="text-[11px] text-slate-400">Earn +100 XP & unlock badges</p>
              </div>
              <Link
                href="/student/revision"
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all shrink-0"
              >
                Play Now
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive Subject Worlds Quick Strip */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Your Subject Worlds
            </h2>
            <Link
              href="/student/map"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>View Full Learning Map</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {subjects.map((sub, idx) => (
              <Link
                key={sub.id}
                href={`/student/subjects/${sub.id}`}
                className="glass-card-hover rounded-2xl p-4 border border-white/10 block group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-lg font-bold">
                    {idx === 0 ? '🏰' : idx === 1 ? '⚛' : '💻'}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    Level {idx + 1} / 10
                  </span>
                </div>
                <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {sub.description || 'Explore levels, quizzes & challenges'}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Mission Control Today's Schedule Preview */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl shadow-slate-950/40">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-black text-white">Today's Missions</h3>
            </div>
            <Link
              href="/student/study-plan"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Manage Planner</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {todayPlans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{plan.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {plan.subject?.name || 'Academic'} · {plan.duration_minutes} min
                    </div>
                  </div>
                  <Link
                    href="/student/revision"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all"
                  >
                    Start
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-400">No scheduled tasks for today.</p>
              <Link
                href="/student/study-plan"
                className="inline-block mt-2 text-xs font-bold text-cyan-400 hover:underline"
              >
                + Add your first study mission
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
