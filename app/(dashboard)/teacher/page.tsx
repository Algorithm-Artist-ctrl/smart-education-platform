// app/(dashboard)/teacher/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import TeacherActions from '@/components/teacher/TeacherActions';
import { 
  Users, 
  BookOpen, 
  FileCheck, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus
} from 'lucide-react';
import { 
  AcademicClass, 
  Assignment, 
  AssignmentSubmission, 
  Subject, 
  Profile, 
  WeakTopic 
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Teacher Command Center
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
              Welcome, {userProfile.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage classroom assignments, curriculum materials, and track struggling students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-100">
              {classes.length} Assigned Classes
            </span>
          </div>
        </div>

        {/* Real Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Students</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{students.length}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Pending Reviews</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{pendingSubmissions.length}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Active Assignments</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{assignments.length}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Flagged Topics</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{activeWeakTopics.length}</div>
            </div>
          </div>
        </div>

        {/* Interactive Teacher Tools (Client Component for Real CRUD) */}
        <TeacherActions 
          classes={classes} 
          subjects={subjects} 
          teacherId={user.id} 
        />

        {/* Grid: Submissions to Grade & Students Needing Intervention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submissions Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent Student Submissions</h3>
              <span className="text-xs text-slate-500">{submissions.length} Total</span>
            </div>

            {submissions.length === 0 ? (
              <EmptyState
                title="No Submissions Yet"
                description="When students complete and submit assignments, their work will appear here for grading."
              />
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {sub.assignment?.title || 'Assignment'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        By: <span className="font-medium text-slate-700">{sub.student?.full_name || 'Student'}</span> • {new Date(sub.submitted_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          sub.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                      {sub.grade !== null && sub.grade !== undefined && (
                        <div className="text-xs font-bold text-slate-800 mt-1">
                          {sub.grade} pts
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Students Needing Academic Support */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Students Needing Support</h3>
              <span className="text-xs text-rose-600 font-semibold">Adaptive Alerts</span>
            </div>

            {activeWeakTopics.length === 0 ? (
              <EmptyState
                title="No Critical Weak Topics"
                description="All students in your assigned classes are meeting passing thresholds on quizzes."
                icon={<CheckCircle2 className="w-8 h-8 text-emerald-500 stroke-[1.5]" />}
              />
            ) : (
              <div className="space-y-3">
                {activeWeakTopics.map((wt) => (
                  <div
                    key={wt.id}
                    className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {wt.student?.full_name || 'Student'}
                      </div>
                      <div className="text-[11px] text-rose-700 mt-0.5">
                        Struggling in: <span className="font-semibold">{wt.topic?.name}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-rose-700">
                        {wt.accuracy_rate}% accuracy
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {wt.incorrect_count} missed questions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
