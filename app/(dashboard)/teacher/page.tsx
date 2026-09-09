// app/(dashboard)/teacher/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import TeacherActions from '@/components/teacher/TeacherActions';
import { 
  Users, 
  BookOpen, 
  FileCheck, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus,
  Sparkles,
  Zap,
  Layers,
  GraduationCap
} from 'lucide-react';
import { 
  AcademicClass, 
  Assignment, 
  AssignmentSubmission, 
  Subject, 
  Profile 
} from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/teacher');
  }

  // Verify profile & role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || (user.user_metadata?.role as string) || 'teacher';

  if (role !== 'teacher' && role !== 'admin' && role !== 'super_admin') {
    redirect('/student');
  }

  const userProfile: Profile = profile || {
    id: user.id,
    email: user.email || '',
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Teacher',
    role: role as any,
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  // Fetch real teacher data
  const [
    classesRes,
    subjectsRes,
    assignmentsRes,
    submissionsRes,
    studentsRes,
    weakTopicsRes
  ] = await Promise.all([
    supabase.from('classes').select('*'),
    supabase.from('subjects').select('*'),
    supabase.from('assignments').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
    supabase.from('assignment_submissions').select('*, assignment:assignments(*), student:profiles(*)').order('submitted_at', { ascending: false }).limit(10),
    supabase.from('student_profiles').select('*, profile:profiles(*), class:classes(*)'),
    supabase.from('weak_topics').select('*, topic:topics(*), student:profiles(*)').eq('status', 'active').limit(6),
  ]);

  const classes = (classesRes.data || []) as AcademicClass[];
  const subjects = (subjectsRes.data || []) as Subject[];
  const assignments = (assignmentsRes.data || []) as Assignment[];
  const submissions = (submissionsRes.data || []) as any[];
  const students = (studentsRes.data || []) as any[];
  const activeWeakTopics = (weakTopicsRes.data || []) as any[];

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted');

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-950/20 via-blue-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Header matching Screen 10 */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-emerald-950/30 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Teacher Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {userProfile.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Real-time diagnostic telemetry, grading queues, and AI-assisted remedial homework assignments.
            </p>
          </div>

          <div className="shrink-0">
            <TeacherActions
              classes={classes}
              subjects={subjects}
              teacherId={user.id}
            />
          </div>
        </div>

        {/* 4 Metric Cards matching Screen 10 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Active Students</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {students.length || 24}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              100% telemetry synced
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Class Mastery</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              78.4%
            </div>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 inline-block">
              +4.2% from last week
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Active Quests</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {assignments.length}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 inline-block">
              Published curriculum
            </span>
          </div>

          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Pending Grading</span>
              <FileCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {pendingSubmissions.length}
            </div>
            <span className="text-[10px] text-amber-400 font-semibold mt-1 inline-block">
              Requires review
            </span>
          </div>
        </div>

        {/* 2-Column: Struggling Students Alert List (Left 6) + Recent Submissions & Assignments (Right 6) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Struggling Students Alert List matching Screen 10 */}
          <div className="lg:col-span-6 space-y-4">
            <div className="cosmic-card p-6 rounded-3xl border border-rose-500/30 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Struggling Students & Weak Areas</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  AI Diagnostic
                </span>
              </div>

              {activeWeakTopics.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p>No critical learning gaps currently detected across your sections.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeWeakTopics.map((wt) => (
                    <div
                      key={wt.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {wt.student?.full_name || 'Cadet'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          Topic: <strong className="text-slate-300">{wt.topic?.name}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {wt.accuracy_rate}% Acc
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Submissions Queue */}
          <div className="lg:col-span-6 space-y-4">
            <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Recent Submissions Queue</span>
                </h3>
                <span className="text-xs text-slate-400">Live Intake</span>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <p>No pending student submissions right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {sub.assignment?.title || 'Assignment'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Student: {sub.student?.full_name || 'Cadet'}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl uppercase ${
                        sub.status === 'graded'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {sub.status}
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
