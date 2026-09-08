// app/(dashboard)/parent/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Users, 
  BookOpen, 
  Award, 
  AlertTriangle, 
  CalendarCheck, 
  CheckCircle2, 
  Clock,
  Heart
} from 'lucide-react';
import { Profile, StudentProfile } from '@/types/database.types';

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
    .single();

  if (profile?.role !== 'parent' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/student');
  }

  // Fetch authorized linked children through RLS
  const { data: linkedChildren } = await supabase
    .from('student_profiles')
    .select('*, profile:profiles(*), class:classes(*), section:sections(*)')
    .eq('parent_id', user.id);

  const children = (linkedChildren || []) as any[];

  // If child exists, fetch child's performance details
  let childQuizAttempts: any[] = [];
  let childWeakTopics: any[] = [];
  let childAttendance: any[] = [];

  if (children.length > 0) {
    const firstChildId = children[0].id;
    const [attRes, wtRes, atdRes] = await Promise.all([
      supabase.from('quiz_attempts').select('*, assessment:assessments(*)').eq('student_id', firstChildId).limit(5),
      supabase.from('weak_topics').select('*, topic:topics(*)').eq('student_id', firstChildId).eq('status', 'active'),
      supabase.from('attendance').select('*').eq('student_id', firstChildId).limit(10),
    ]);

    childQuizAttempts = attRes.data || [];
    childWeakTopics = wtRes.data || [];
    childAttendance = atdRes.data || [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Parent Portal • Verified RLS Isolation</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {profile?.full_name || 'Parent'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your child&apos;s academic performance, weak concept alerts, and attendance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 bg-amber-50 text-amber-800 font-semibold rounded-xl border border-amber-100">
              {children.length} Linked Child{children.length === 1 ? '' : 'ren'}
            </span>
          </div>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <EmptyState
              title="No Linked Student Profile"
              description="Your account is not linked to any student profile yet. Please provide your email address to the school administration or student profile settings to view their academic records."
              icon={<Users className="w-8 h-8 text-slate-400 stroke-[1.5]" />}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Child Profile Banner */}
            {children.map((child) => (
              <div key={child.id} className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                      {child.profile?.full_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{child.profile?.full_name}</h2>
                      <p className="text-xs text-slate-500">
                        {child.class?.name} • {child.section?.name} • Roll No: {child.roll_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="px-3 py-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-100">
                      Streak: {child.current_streak} Days
                    </div>
                    <div className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                      Points: {child.total_points} XP
                    </div>
                  </div>
                </div>

                {/* Grid: Weak Areas & Recent Quiz Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Weak Areas Identified */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <h3 className="text-base font-bold text-slate-900">Areas Needing Attention</h3>
                      </div>
                      <span className="text-xs text-rose-600 font-semibold">{childWeakTopics.length} Topics</span>
                    </div>

                    {childWeakTopics.length === 0 ? (
                      <EmptyState
                        title="Excellent Performance"
                        description="No weak topics currently flagged for your child."
                        icon={<CheckCircle2 className="w-8 h-8 text-emerald-500 stroke-[1.5]" />}
                      />
                    ) : (
                      <div className="space-y-3">
                        {childWeakTopics.map((wt) => (
                          <div
                            key={wt.id}
                            className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900">{wt.topic?.name}</div>
                              <div className="text-[11px] text-rose-600 mt-0.5">
                                Missed {wt.incorrect_count} questions in recent quizzes
                              </div>
                            </div>
                            <div className="text-xs font-black text-rose-700">
                              {wt.accuracy_rate}% accuracy
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quiz Performance */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900">Recent Quiz Performance</h3>
                      </div>
                    </div>

                    {childQuizAttempts.length === 0 ? (
                      <EmptyState
                        title="No Test Scores Yet"
                        description="Test attempts and grades will appear here as your child completes assessments."
                      />
                    ) : (
                      <div className="space-y-3">
                        {childQuizAttempts.map((qa) => (
                          <div
                            key={qa.id}
                            className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900">
                                {qa.assessment?.title || 'Subject Quiz'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(qa.start_time).toLocaleDateString()}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className={`text-sm font-bold ${
                                qa.percentage >= 80 ? 'text-emerald-600' : 'text-amber-600'
                              }`}>
                                {qa.percentage}%
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {qa.total_score}/{qa.max_score} pts
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
