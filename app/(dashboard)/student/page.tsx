// app/(dashboard)/student/page.tsx
// Screen 2: Student Dashboard (Home) — Full-Stack Gamified 3D Experience matching Reference Screen 2
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import SidebarRail from '@/components/design-system/SidebarRail';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { calculateLevel } from '@/lib/gamification-engine';
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
  ChevronRight,
  Award,
  Plus
} from 'lucide-react';
import { Profile, Quest, Subject, WeakTopic, StudyPlan } from '@/types/database.types';

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

  if (studentProfile && !studentProfile.onboarding_completed) {
    redirect('/onboarding');
  }

  const userProfile: Profile = profile || {
    id: user.id,
    email: user.email || '',
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Cadet',
    role: 'student',
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  const studentName = userProfile.full_name?.split(' ')[0] || 'Cadet';
  const totalXp = studentProfile?.total_points || 0;
  const streak = studentProfile?.current_streak || 0;
  const coins = studentProfile?.coins || 0;

  // Real calculations via central gamification engine
  const levelInfo = calculateLevel(totalXp);

  // Calculate real rank from database
  const { count: higherRankCount } = await supabase
    .from('student_profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_points', totalXp);

  const { count: totalStudentsCount } = await supabase
    .from('student_profiles')
    .select('*', { count: 'exact', head: true });

  const currentRank = (higherRankCount || 0) + 1;
  const totalStudents = Math.max(1, totalStudentsCount || 1);
  const rankPercentile = Math.max(1, Math.round((currentRank / totalStudents) * 100));
  const rankText = totalStudents > 1 && rankPercentile <= 50 
    ? `Top ${rankPercentile}% In Class` 
    : `#${currentRank} In Class`;

  // 3. Parallel fetch real data: Quests, Subjects, Weak Topics, Study Plans, Assessments, Attempts
  const todayStr = new Date().toISOString().split('T')[0];
  const [questsRes, subjectsRes, weakTopicsRes, studyPlansRes, assessmentsRes, attemptsRes] = await Promise.all([
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
    supabase
      .from('assessments')
      .select('id, title, duration_minutes, total_marks, subject_id')
      .order('created_at', { ascending: true })
      .limit(5),
    supabase
      .from('quiz_attempts')
      .select('score, percentage, passed, assessment_id, assessment:assessments(subject_id)')
      .eq('student_id', user.id),
  ]);

  const quests: Quest[] = questsRes.data || [];
  const subjects: Subject[] = subjectsRes.data || [];
  const weakTopics: WeakTopic[] = weakTopicsRes.data || [];
  const todayPlans: StudyPlan[] = studyPlansRes.data || [];
  const defaultAssessments = assessmentsRes.data || [];
  const userAttempts = attemptsRes.data || [];

  const primaryQuest: Quest | null = quests[0] || null;
  const primaryWeakTopic = weakTopics[0]?.topic?.name || null;
  const firstAssessment = defaultAssessments[0] || null;

  const questTargetUrl = primaryQuest?.target_id 
    ? `/student/assessments/${primaryQuest.target_id}` 
    : primaryQuest?.id 
      ? `/student/assessments/${primaryQuest.id}`
      : firstAssessment?.id
        ? `/student/assessments/${firstAssessment.id}`
        : '/student/map';

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 pb-20 md:pb-12 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar profile={userProfile} />

      {/* Main Responsive Grid with Left Sidebar Rail */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex gap-6">
        
        {/* Left Slim Icon Rail (Visible on Desktop, matching Screen 2) */}
        <SidebarRail />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Top Hero Section: Welcome + Level Card & Telemetry Badges (Exact Screen 2 Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Left Welcome Box (7 Cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/40 border border-indigo-500/25 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-950/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-cyan-300 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cadet Learning Matrix</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Welcome back, <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                    {studentName}!
                  </span>
                </h1>

                <p className="text-sm text-slate-300 mt-2 italic font-medium">
                  "Small steps everyday lead to big results."
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                <Link
                  href="/student/map"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Learning Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/student/revision"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Revision Arena</span>
                </Link>
              </div>
            </div>

            {/* Right Level Card & Stats Badges (5 Cols, Exact Screen 2) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              
              {/* Big Level Card */}
              <div className="rounded-3xl bg-slate-900/80 border border-indigo-500/30 p-5 backdrop-blur-xl shadow-xl shadow-indigo-950/20 relative overflow-hidden flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/20 flex items-center justify-center text-cyan-300 shadow-md shadow-indigo-600/30">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400">
                        Rank Status
                      </span>
                      <h3 className="text-xl font-black text-white leading-none">
                        Level {levelInfo.level}
                      </h3>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-slate-300">
                    {levelInfo.currentLevelXP.toLocaleString()} / {levelInfo.nextLevelXP.toLocaleString()} XP
                  </span>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700 shadow-sm shadow-cyan-400"
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Progress to Level {levelInfo.level + 1}</span>
                    <span className="font-mono text-cyan-400">{levelInfo.progressPercent}%</span>
                  </div>
                </div>
              </div>

              {/* 3 Telemetry Cards Row: Streak, Coins, Rank */}
              <div className="grid grid-cols-3 gap-2.5">
                
                {/* Streak */}
                <div className="rounded-2xl bg-slate-900/70 border border-orange-500/25 p-3 text-center backdrop-blur-xl shadow-md">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-1 text-orange-400">
                    <Flame className="w-4 h-4 fill-orange-400/80 animate-pulse" />
                  </div>
                  <div className="text-base font-black text-white font-mono leading-none">
                    {streak}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Day Streak
                  </div>
                </div>

                {/* Coins */}
                <div className="rounded-2xl bg-slate-900/70 border border-amber-500/25 p-3 text-center backdrop-blur-xl shadow-md">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-1 text-amber-400">
                    <Coins className="w-4 h-4 fill-amber-400/80" />
                  </div>
                  <div className="text-base font-black text-white font-mono leading-none">
                    {coins}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Coins
                  </div>
                </div>

                {/* Class Rank */}
                <div className="rounded-2xl bg-slate-900/70 border border-emerald-500/25 p-3 text-center backdrop-blur-xl shadow-md">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-1 text-emerald-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-white truncate leading-none">
                    {rankText}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Class Rank
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Middle Row: 3D Character Illustration + Today's Quest + Nova AI Widget (Exact Screen 2) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            
            {/* 3D Cadet Character Card (4 cols on md/lg) */}
            <div className="md:col-span-4 rounded-3xl bg-slate-900/70 border border-white/10 relative overflow-hidden flex flex-col justify-end p-5 min-h-[220px] shadow-xl group">
              <Image
                src="/images/hero_student.jpg"
                alt="Student Cadet Adventure"
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Cadet Profile
                </span>
                <h3 className="text-lg font-black text-white">
                  {userProfile.full_name}
                </h3>
                <p className="text-xs text-slate-300">
                  Ready for today's learning voyage.
                </p>
              </div>
            </div>

            {/* Today's Quest Card (4 cols on md/lg) */}
            <div className="md:col-span-4 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/75 to-indigo-950/40 border border-indigo-500/30 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400">
                    <Target className="w-4 h-4" />
                    <span>Today's Quest</span>
                  </div>
                  {primaryQuest && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {primaryQuest.duration_minutes || 15} min
                    </span>
                  )}
                </div>

                {/* Quest Content matching Screen 2 */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-white truncate">
                        {primaryQuest?.title || (firstAssessment ? `Diagnostic: ${firstAssessment.title}` : 'Curriculum Diagnostic Voyage')}
                      </h4>
                      <div className="text-[11px] text-indigo-300/80 font-medium">
                        {primaryQuest?.subject_name || 'Mathematics'} • {primaryQuest?.duration_minutes || firstAssessment?.duration_minutes || 15} min
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span className="text-[11px] text-slate-400">Progress</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {primaryQuest ? (primaryQuest.progress_percent || (primaryQuest.status === 'completed' ? 100 : 0)) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full"
                        style={{ width: `${primaryQuest ? (primaryQuest.progress_percent || (primaryQuest.status === 'completed' ? 100 : 0)) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                    +{primaryQuest?.xp_reward || 150} XP
                  </span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400 fill-amber-400" />
                    +{primaryQuest?.coin_reward || primaryQuest?.coins_reward || 20} Coins
                  </span>
                </div>

                <Link
                  href={questTargetUrl}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Nova AI Companion Card (4 cols on md/lg, matching Screen 2) */}
            <div className="md:col-span-4 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/75 to-indigo-950/30 border border-indigo-500/30 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-cyan-400/40 shrink-0 bg-slate-950">
                      <Image
                        src="/images/nova_robot.jpg"
                        alt="Nova AI Mentor"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white leading-none">
                        Nova AI
                      </h4>
                      <span className="text-[10px] text-cyan-400 font-semibold">
                        Adaptive Companion
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">×</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-200 leading-relaxed mb-3">
                  Hi <span className="font-bold text-white">{studentName}</span>! 👋 Want to practice questions on {primaryWeakTopic || 'your current subjects'}?
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/student/revision"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Start Practice</span>
                </Link>
              </div>
            </div>

          </div>

          {/* Lower Section: Subject Worlds Strip */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  Your Subject Worlds
                </h2>
                <p className="text-xs text-slate-400">
                  Explore academic sectors and unlock chapters along your learning journey
                </p>
              </div>

              <Link
                href="/student/map"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>View Full Learning Map</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjects.map((sub, idx) => {
                const subAttempts = userAttempts.filter((a: any) => a.assessment?.subject_id === sub.id);
                const passedAttempts = subAttempts.filter((a: any) => a.passed || (a.percentage && a.percentage >= 60));
                const completedLevels = passedAttempts.length;
                const totalLevels = Math.max(10, completedLevels + 4);
                const mastery = Math.min(100, Math.round((completedLevels / totalLevels) * 100));

                return (
                  <Link
                    key={sub.id}
                    href={`/student/subjects/${sub.id}`}
                    className="group rounded-2xl bg-slate-900/70 hover:bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 shadow-lg block"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center text-cyan-400 text-sm font-bold group-hover:scale-105 transition-transform">
                        {idx === 0 ? 'π' : idx === 1 ? '⚛' : idx === 2 ? '💻' : '📖'}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        {completedLevels}/{totalLevels} Levels
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                      {sub.description || 'Curriculum world'}
                    </p>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Mastery</span>
                        <span className="text-cyan-400 font-mono">{mastery}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${mastery}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Today's Missions / Schedule Strip */}
          <div className="rounded-3xl bg-slate-900/70 border border-white/10 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Today's Missions</h3>
              </div>
              <Link
                href="/student/study-plan"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Mission Control</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {todayPlans.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{plan.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {plan.subject?.name || 'Academic'} · {plan.duration_minutes || 20} min
                      </div>
                    </div>
                    <Link
                      href="/student/revision"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all shrink-0"
                    >
                      Start
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">No missions scheduled for today yet.</p>
                <Link
                  href="/student/study-plan"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-cyan-400 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add your first study mission</span>
                </Link>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Floating Nova AI Companion (Persistent across student portal) */}
      <NovaAICompanion
        weakTopicName={primaryWeakTopic}
        studentName={studentName}
        level={levelInfo.level}
        mode="floating"
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
