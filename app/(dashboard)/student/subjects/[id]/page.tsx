// app/(dashboard)/student/subjects/[id]/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import SkillTreePath from '@/components/gamification/SkillTreePath';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  BookOpen, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  PlayCircle, 
  Award, 
  ArrowRight,
  Flame,
  Zap,
  Clock,
  Layers
} from 'lucide-react';
import { Subject, Topic, Assessment, Profile, StudentProfile } from '@/types/database.types';

import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';

export const dynamic = 'force-dynamic';

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const subjectId = resolvedParams.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/student/subjects/${subjectId}`);
  }

  // Fetch profile, student profile, subject, topics, assessments, student attempts, and topic mastery
  const [profileRes, studentProfileRes, subRes, topicsRes, assessmentsRes, attemptsRes, masteryRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_profiles').select('*').eq('id', user.id).single(),
    supabase.from('subjects').select('*').eq('id', subjectId).single(),
    supabase.from('topics').select('*, content:learning_content(*)').eq('subject_id', subjectId).order('order_index', { ascending: true }),
    supabase.from('assessments').select('*').eq('subject_id', subjectId).eq('is_published', true),
    supabase.from('quiz_attempts').select('*').eq('student_id', user.id),
    supabase.from('topic_mastery').select('*').eq('student_id', user.id).eq('subject_id', subjectId),
  ]);

  const profile = profileRes.data as Profile | null;
  const studentProfile = studentProfileRes.data as StudentProfile | null;
  const subject = subRes.data as Subject | null;
  const topics = (topicsRes.data || []) as any[];
  const assessments = (assessmentsRes.data || []) as Assessment[];
  const attempts = attemptsRes.data || [];
  const masteries = (masteryRes.data || []) as any[];

  const topicMasteries: Record<string, any> = {};
  masteries.forEach((m) => {
    topicMasteries[m.topic_id] = m;
  });

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white">
        <Navbar profile={profile} />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Subject World Not Found</h2>
          <p className="text-sm text-slate-400 mt-2">The requested learning realm does not exist or has moved into another sector.</p>
          <Link 
            href="/student/map" 
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Celestial Map
          </Link>
        </main>
      </div>
    );
  }

  // Calculate completed topics based on passed quizzes or high scores
  const completedTopicIds = new Set(
    attempts
      .filter((a: any) => a.passed || a.score_percentage >= 60)
      .map((a: any) => a.topic_id)
  );

  const completedCount = topics.filter((t: any) => completedTopicIds.has(t.id)).length;
  const activeTopicIndex = Math.min(completedCount, Math.max(0, topics.length - 1));
  const masteryPercentage = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-indigo-950/40 via-blue-900/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 pb-28 md:pb-12">
        {/* Left Sidebar Rail */}
        <SidebarRail />

        <main className="flex-1 min-w-0 space-y-6">
          {/* Gamification Bar */}
          <GamificationBar
            level={studentProfile?.level || 1}
            currentXp={studentProfile?.xp || 0}
            streakDays={studentProfile?.streak_days || studentProfile?.current_streak || 0}
            coins={studentProfile?.coins || 0}
            totalPoints={studentProfile?.total_points || 0}
          />

          {/* Sub-Navigation Tabs matching Screen 4 */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-white/10 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Link
                href="/student/map"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition mr-2 pr-3 border-r border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Map</span>
              </Link>
              {['Overview', 'Lessons', 'Quizzes', 'Assignments', 'Notes'].map((tab, idx) => (
                <button
                  key={tab}
                  type="button"
                  className={`px-3 py-1.5 rounded-xl transition ${
                    idx === 0
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

        {/* Subject World Hero Banner matching Screen 4 */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left 3D Island Graphic & Title */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/20 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-indigo-600/40 shrink-0 animate-float-slow">
                <span>π</span>
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-bold tracking-wider uppercase">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Sector {subject.code || 'MATH'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {subject.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Numbers build your thinking.
                </p>
              </div>
            </div>

            {/* Right Progress Ring / Levels Completed Card matching Screen 4 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center gap-5 min-w-[240px] shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 shrink-0">
                <span>🏛️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                  <span>{completedCount}/{topics.length} Levels</span>
                  <span className="text-cyan-400 font-mono">{masteryPercentage}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${masteryPercentage}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Levels Completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Tree Roadmap with Prerequisite Locks & Teaching Mode Selector */}
        <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-2xl">
          <SkillTreePath
            topics={topics}
            subjectName={subject.name}
            activeTopicIndex={activeTopicIndex}
            topicMasteries={topicMasteries}
          />
        </div>

        {/* Sector Challenges & Revision Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Sector Assessments & Quizzes
            </h3>
            {assessments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-white/5">
                <p>No published quizzes for this sector yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assessments.map((a) => {
                  const studentAttempt = attempts.find((at: any) => at.assessment_id === a.id);
                  return (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 hover:border-indigo-500/40 transition flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                            {a.assessment_type || 'Challenge'}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                            {a.title}
                          </h4>
                        </div>
                        {studentAttempt && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            studentAttempt.passed || studentAttempt.score_percentage >= 60
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {studentAttempt.score_percentage}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {a.duration_minutes || 20}m
                        </span>
                        <span className="flex items-center gap-1 text-indigo-400 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          +{a.total_marks || 50} XP
                        </span>
                      </div>

                      <Link
                        href={`/student/assessments/${a.id}`}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{studentAttempt ? 'Retake Challenge' : 'Start Challenge'}</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Revision Callout */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-3 self-start">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Revision Assistant</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Want to review past mistakes or generate custom flashcards for {subject.name}?
            </p>
            <Link
              href={`/student/revision?subject=${subject.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
            >
              <span>Go to Revision Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
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
