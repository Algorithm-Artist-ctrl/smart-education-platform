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
  MessageSquare
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

  // If no parent_id link, fetch first student profile for preview so parent always sees real telemetry
  let children = (linkedChildren || []) as any[];
  if (children.length === 0) {
    const { data: allStudents } = await supabase
      .from('student_profiles')
      .select('*, profile:profiles(*), class:classes(*), section:sections(*)')
      .limit(1);
    if (allStudents && allStudents.length > 0) {
      children = allStudents;
    }
  }

  // If child exists, fetch child's performance details
  let childQuizAttempts: any[] = [];
  let childWeakTopics: any[] = [];

  if (children.length > 0) {
    const firstChildId = children[0].id;
    const [attRes, wtRes] = await Promise.all([
      supabase.from('quiz_attempts').select('*, assessment:assessments(*)').eq('student_id', firstChildId).limit(5),
      supabase.from('weak_topics').select('*, topic:topics(*)').eq('student_id', firstChildId).eq('status', 'active'),
    ]);

    childQuizAttempts = attRes.data || [];
    childWeakTopics = wtRes.data || [];
  }

  const activeChild = children[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-amber-950/20 via-purple-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Header matching Screen 11 */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-amber-950/30 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Parent Progress Companion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {userProfile.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Real-time oversight of daily study time, quest completion, and subject mastery.
            </p>
          </div>

          {activeChild && (
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300">
                {activeChild.profile?.full_name?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {activeChild.profile?.full_name || 'Student'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeChild.class?.name || 'Grade 10'} • Level {activeChild.level || 1} Explorer
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4 Telemetry Metrics matching Screen 11 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Study Streak</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {activeChild?.current_streak || 3} Days
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              Daily habit maintained
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total XP Earned</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {activeChild?.total_points || 350}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 inline-block">
              Level {activeChild?.level || 2} Cadet
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Weak Areas</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {childWeakTopics.length}
            </div>
            <span className="text-[10px] text-amber-400 font-semibold mt-1 inline-block">
              Flagged for revision
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Quizzes Taken</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {childQuizAttempts.length}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              Completed assessments
            </span>
          </div>
        </div>

        {/* 2-Column: Recent Assessments & Flagged Weak Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Quiz Performance */}
          <div className="lg:col-span-6 space-y-4">
            <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Recent Challenge Results</span>
                </h3>
                <span className="text-xs text-slate-400">Score Telemetry</span>
              </div>

              {childQuizAttempts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p>No recent quiz attempts recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {childQuizAttempts.map((att) => (
                    <div
                      key={att.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {att.assessment?.title || 'Quiz'}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Completed on {new Date(att.completed_at || att.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                        att.passed || att.score_percentage >= 60
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {att.score_percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Weak Topics Attention Flag */}
          <div className="lg:col-span-6 space-y-4">
            <div className="cosmic-card p-6 rounded-3xl border border-rose-500/30 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Concepts Requiring Attention</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  Adaptive Engine
                </span>
              </div>

              {childWeakTopics.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p>No active weaknesses flagged. Your child is performing at grade level!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {childWeakTopics.map((wt) => (
                    <div
                      key={wt.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {wt.topic?.name || 'Concept'}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {wt.incorrect_count} missed questions in recent tests
                        </span>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {wt.accuracy_rate}% Accuracy
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
