// app/(dashboard)/parent/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import { 
  Users, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  CalendarCheck, 
  CheckCircle2, 
  Clock,
  Heart,
  Flame,
  Zap,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';
import { Profile } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/parent');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || (user.user_metadata?.role as string) || 'parent';

  if (role !== 'parent' && role !== 'admin' && role !== 'super_admin') {
    redirect('/student');
  }

  const userProfile: Profile = profile || {
    id: user.id,
    email: user.email || '',
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Parent',
    role: role as any,
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  // Fetch authorized linked children through RLS
  const { data: linkedChildren } = await supabase
    .from('student_profiles')
    .select('*, profile:profiles(*), class:classes(*), section:sections(*)')
    .eq('parent_id', user.id);

  const children = (linkedChildren || []) as any[];

  if (children.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
        <Navbar profile={userProfile} />
        <main className="flex-1 max-w-xl mx-auto px-4 py-24 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-5 shadow-xl shadow-amber-950/30">
            <Heart className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-2xl font-black text-white">No Student Linked Yet</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Your parent portal is secure and only displays verified student accounts. Please provide your registered email to your institution administrator or student to link their profile.
          </p>
        </main>
      </div>
    );
  }

  // Fetch verified child's performance, masteries, and life missions
  const firstChildId = children[0].id;
  const [attRes, wtRes, masteryRes, missionsRes] = await Promise.all([
    supabase.from('quiz_attempts').select('*, assessment:assessments(*)').eq('student_id', firstChildId).order('created_at', { ascending: false }).limit(5),
    supabase.from('weak_topics').select('*, topic:topics(*)').eq('student_id', firstChildId).eq('status', 'active').limit(2),
    supabase.from('topic_mastery').select('*, topic:topics(*)').eq('student_id', firstChildId).order('mastery_score', { ascending: false }).limit(3),
    supabase.from('mission_submissions').select('*').eq('student_id', firstChildId).eq('status', 'completed'),
  ]);

  const childQuizAttempts = attRes.data || [];
  const childWeakTopics = wtRes.data || [];
  const childMasteries = (masteryRes.data || []) as any[];
  const childMissions = (missionsRes.data || []) as any[];
  const activeChild = children[0];
  const childAvgScore = childQuizAttempts.length > 0
    ? Math.round(childQuizAttempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / childQuizAttempts.length)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-amber-950/20 via-purple-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Header with Philosophy */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-amber-950/30 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Support, Not Pressure</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeChild?.profile?.full_name ? `${activeChild.profile.full_name}'s Learning Journey` : 'Family Learning Companion'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Nurture curiosity over test anxiety. Consistency, hands-on discovery, and persistence build lifelong thinkers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Habit Consistency</span>
            <span className="text-xl font-black text-amber-400 flex items-center justify-end gap-1">
              <Flame className="w-5 h-5 text-orange-400" />
              {activeChild?.streak_days || activeChild?.current_streak || 0} Day Streak
            </span>
          </div>
        </div>

        {/* Strict Child Privacy Guarantee */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-center gap-3 text-indigo-200">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>
            <strong>Psychological Safety Shield:</strong> Smart Edu never ranks children against classmates or displays stressful comparative percentiles. Private tutoring chats with Nova AI remain confidential between the student and AI companion to encourage authentic questions without fear of judgment.
          </span>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Study Streak</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {activeChild?.streak_days || activeChild?.current_streak || 0} Days
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              Daily habit maintained
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Cadet Level</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              Level {activeChild?.level || 1}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 inline-block">
              {activeChild?.total_points || activeChild?.xp || 0} XP Earned
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Life Missions</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {childMissions.length}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              Real-world activities
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Core Fluency</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {childAvgScore !== null ? `${childAvgScore}%` : '--'}
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold mt-1 inline-block">
              {childAvgScore !== null ? 'Understanding index' : 'First assessment pending'}
            </span>
          </div>
        </div>

        {/* At-Home Conversation Starters Card */}
        <div className="cosmic-card p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-amber-950/20 to-slate-900/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Tonight’s Conversation Starters (Encouragement Tips)
              </h3>
            </div>
            <span className="text-xs text-amber-300 font-semibold">At Dinner or During Commute</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>💬</span> Connect Science to Real Life
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                "Ask your child: 'Can you show me how friction works when sliding things across our kitchen floor?' Let them be the teacher and explain it to you!"
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <span>🌱</span> Praise Persistence, Not Scores
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                "Say: 'I noticed you kept trying on that tricky math topic even when it felt tough. That determination is what builds real genius.'"
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column: Demonstrated Strengths & Concepts Ready for Encouragement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Demonstrated Strengths Spotlight */}
          <div className="lg:col-span-6 space-y-4">
            <div className="cosmic-card p-6 rounded-3xl border border-emerald-500/30 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Demonstrated Strengths</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono font-bold">Celebrating Growth</span>
              </div>

              {childMasteries.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p>As your child completes quests, their top conceptual strengths will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {childMasteries.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-emerald-500/20 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {m.topic?.name || 'Concept Fluency'}
                        </h4>
                        <span className="text-[11px] text-emerald-300">
                          Mastery Achieved ({m.mastery_score}%)
                        </span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Strong
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Concepts Ready for Gentle Encouragement */}
          <div className="lg:col-span-6 space-y-4">
            <div className="cosmic-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Concepts Ready for Encouragement</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Positive Support
                </span>
              </div>

              {childWeakTopics.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p>No concepts currently flagged. Your child is progressing smoothly!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {childWeakTopics.map((wt) => (
                    <div
                      key={wt.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-amber-500/20 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {wt.topic?.name || 'Concept'}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Nova AI is providing visual analogies and guided practice
                        </span>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        In Progress
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
