// app/(dashboard)/student/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Flame, 
  Award, 
  Target, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  BookOpen, 
  FileText, 
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  Profile, 
  StudentProfile, 
  StudyPlan, 
  WeakTopic, 
  RevisionTask, 
  Assessment, 
  QuizAttempt, 
  Assignment,
  StudentBadge,
  Subject
} from '@/types/database.types';

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
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Student',
    role: 'student',
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 3. Parallel fetch all real student data
  const [
    studyPlansRes,
    weakTopicsRes,
    revisionTasksRes,
    assessmentsRes,
    quizAttemptsRes,
    assignmentsRes,
    badgesRes,
    subjectsRes
  ] = await Promise.all([
    supabase
      .from('study_plans')
      .select('*, subject:subjects(*), topic:topics(*)')
      .eq('student_id', user.id)
      .eq('plan_date', todayStr)
      .order('created_at', { ascending: true }),
    supabase
      .from('weak_topics')
      .select('*, topic:topics(*, subject:subjects(*))')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .order('accuracy_rate', { ascending: true }),
    supabase
      .from('revision_tasks')
      .select('*, topic:topics(*), recommended_content:learning_content(*)')
      .eq('student_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('assessments')
      .select('*, subject:subjects(*), topic:topics(*)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('quiz_attempts')
      .select('*, assessment:assessments(*)')
      .eq('student_id', user.id)
      .order('start_time', { ascending: false })
      .limit(5),
    supabase
      .from('assignments')
      .select('*, subject:subjects(*)')
      .order('due_date', { ascending: true })
      .limit(4),
    supabase
      .from('student_badges')
      .select('*, badge:gamification_badges(*)')
      .eq('student_id', user.id),
    supabase
      .from('subjects')
      .select('*')
      .limit(6),
  ]);

  const studyPlans = (studyPlansRes.data || []) as StudyPlan[];
  const weakTopics = (weakTopicsRes.data || []) as WeakTopic[];
  const revisionTasks = (revisionTasksRes.data || []) as RevisionTask[];
  const assessments = (assessmentsRes.data || []) as Assessment[];
  const quizAttempts = (quizAttemptsRes.data || []) as QuizAttempt[];
  const assignments = (assignmentsRes.data || []) as Assignment[];
  const studentBadges = (badgesRes.data || []) as StudentBadge[];
  const subjects = (subjectsRes.data || []) as Subject[];

  const streak = studentProfile?.current_streak || 0;
  const xp = studentProfile?.total_points || 0;
  const level = studentProfile?.level || 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-28 md:pb-8">
        {/* Welcome & Gamification Header */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Learning Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
              Welcome back, {userProfile.full_name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {studentProfile?.class ? `${studentProfile.class.name} • ` : ''}
              {studentProfile?.section ? `${studentProfile.section.name} • ` : ''}
              Keep your momentum going.
            </p>
          </div>

          {/* Gamification Counters (Responsive 3-Column Grid) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 bg-amber-50/80 border border-amber-200/70 p-2 sm:px-3.5 sm:py-2.5 rounded-xl">
              <div className="p-1.5 sm:p-2 bg-amber-500 text-white rounded-lg flex-shrink-0">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] sm:text-xs text-amber-800 font-medium truncate">Streak</div>
                <div className="text-xs sm:text-base font-bold text-amber-950">{streak} {streak === 1 ? 'Day' : 'Days'}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 bg-indigo-50/80 border border-indigo-200/70 p-2 sm:px-3.5 sm:py-2.5 rounded-xl">
              <div className="p-1.5 sm:p-2 bg-indigo-600 text-white rounded-lg flex-shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] sm:text-xs text-indigo-800 font-medium truncate">XP Points</div>
                <div className="text-xs sm:text-base font-bold text-indigo-950">{xp} XP</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 bg-emerald-50/80 border border-emerald-200/70 p-2 sm:px-3.5 sm:py-2.5 rounded-xl">
              <div className="p-1.5 sm:p-2 bg-emerald-600 text-white rounded-lg flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] sm:text-xs text-emerald-800 font-medium truncate">Rank</div>
                <div className="text-xs sm:text-base font-bold text-emerald-950">Lvl {level}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Focus Alerts: Weak Topics & Revision Recommendations */}
        {weakTopics.length > 0 && (
          <section className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500 text-white rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-rose-950">
                    Weak Topics Identified ({weakTopics.length})
                  </h3>
                  <p className="text-xs text-rose-700">
                    Our diagnostic engine noticed you struggled on these concepts in recent quizzes.
                  </p>
                </div>
              </div>
              <Link
                href="/student/revision"
                className="text-xs font-semibold px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition whitespace-nowrap min-h-[44px] flex items-center justify-center self-start sm:self-auto"
              >
                Start Revision
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {weakTopics.map((wt) => (
                <div
                  key={wt.id}
                  className="bg-white p-4 rounded-xl border border-rose-200 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-rose-600">
                        {wt.topic?.subject?.name || 'General'}
                      </span>
                      <span className="font-bold text-rose-700">{wt.accuracy_rate}% accuracy</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{wt.topic?.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {wt.topic?.description || 'Needs conceptual review.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {wt.incorrect_count} missed answers
                    </span>
                    <Link
                      href={`/student/revision?topic=${wt.topic_id}`}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 min-h-[40px]"
                    >
                      <span>Revise</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Two-Column Grid: Study Plan & Quick Subjects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left 2 Cols: Today's Smart Study Plan */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Today&apos;s Smart Study Plan</h3>
                    <p className="text-xs text-slate-500">Tailored to your weaknesses and upcoming tasks</p>
                  </div>
                </div>
                <Link
                  href="/student/study-plan"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Manage Plan
                </Link>
              </div>

              {studyPlans.length === 0 ? (
                <EmptyState
                  title="No Study Tasks for Today"
                  description="Your schedule is open today! Take a quick quiz or practice weak areas to keep your streak."
                  action={
                    <Link
                      href="/student/study-plan"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Study Session</span>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {studyPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-xl border transition flex items-center justify-between ${
                        plan.status === 'completed'
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {plan.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-semibold ${
                                plan.status === 'completed'
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-900'
                              }`}
                            >
                              {plan.title}
                            </h4>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                plan.priority === 'high' || plan.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {plan.priority}
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                          )}
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                            <span>{plan.duration_minutes} mins</span>
                            {plan.subject?.name && <span>• {plan.subject.name}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={plan.topic_id ? `/student/revision?topic=${plan.topic_id}` : `/student/study-plan`}
                          className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold text-xs rounded-lg transition inline-flex items-center justify-center self-start sm:self-auto"
                        >
                          Start Session
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Practice Quizzes & Diagnostic Assessments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Available Practice & Assessments</h3>
                    <p className="text-xs text-slate-500">Test your comprehension to update your learning path</p>
                  </div>
                </div>
              </div>

              {assessments.length === 0 ? (
                <EmptyState
                  title="No Assessments Available"
                  description="Your teacher hasn't posted any assessments yet."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assessments.map((ass) => (
                    <div
                      key={ass.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-semibold text-indigo-600">
                            {ass.subject?.name || 'Academic'}
                          </span>
                          <span className="capitalize text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-medium">
                            {ass.assessment_type.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{ass.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {ass.description || 'Test your knowledge on this subject.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          {ass.duration_minutes}m • {ass.total_marks} marks
                        </span>
                        <Link
                          href={`/student/assessments/${ass.id}`}
                          className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition inline-flex items-center justify-center"
                        >
                          Start Test
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Subjects, Badges & Recent History */}
          <div className="space-y-6">
            {/* My Subjects */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3">Enrolled Subjects</h3>
              {subjects.length === 0 ? (
                <EmptyState
                  title="No Subjects Enrolled"
                  description="Complete onboarding or contact your administrator."
                />
              ) : (
                <div className="space-y-2.5">
                  {subjects.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/student/subjects/${sub.id}`}
                      className="min-h-[48px] p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                          {sub.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{sub.code}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Badges & Achievements */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">Badges Earned</h3>
                <span className="text-xs text-indigo-600 font-semibold">{studentBadges.length} Total</span>
              </div>
              {studentBadges.length === 0 ? (
                <EmptyState
                  title="No Badges Yet"
                  description="Complete assessments and keep daily streaks to earn achievements!"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {studentBadges.map((sb) => (
                    <div
                      key={sb.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2.5"
                    >
                      <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {sb.badge?.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {sb.badge?.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Quiz Attempts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3">Recent Performance</h3>
              {quizAttempts.length === 0 ? (
                <EmptyState
                  title="No Learning Activity Yet"
                  description="Your quiz scores and attempt history will appear here once you take a test."
                />
              ) : (
                <div className="space-y-3">
                  {quizAttempts.map((qa) => (
                    <div
                      key={qa.id}
                      className="min-h-[48px] p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {qa.assessment?.title || 'Assessment'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(qa.start_time).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-bold ${
                            qa.percentage >= 80
                              ? 'text-emerald-600'
                              : qa.percentage >= 60
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
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
      </main>
    </div>
  );
}
