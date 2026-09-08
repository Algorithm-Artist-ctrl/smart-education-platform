// app/(dashboard)/student/subjects/[id]/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  BookOpen, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  PlayCircle, 
  Award, 
  ArrowRight 
} from 'lucide-react';
import { Subject, Topic, LearningContent, Assessment } from '@/types/database.types';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch subject, topics, lessons, assessments
  const [subRes, topicsRes, assessmentsRes] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', subjectId).single(),
    supabase.from('topics').select('*, content:learning_content(*)').eq('subject_id', subjectId).order('order_index', { ascending: true }),
    supabase.from('assessments').select('*').eq('subject_id', subjectId).eq('is_published', true),
  ]);

  const subject = subRes.data as Subject | null;
  const topics = (topicsRes.data || []) as any[];
  const assessments = (assessmentsRes.data || []) as Assessment[];

  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar profile={profile} />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-900">Subject Not Found</h2>
          <p className="text-xs text-slate-500 mt-2">The requested subject does not exist or has been removed.</p>
          <Link href="/student" className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">
                {subject.code}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{subject.name}</h1>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                {subject.description || 'Curriculum units, lessons, and practice assessments.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-medium">
                {topics.length} Chapters
              </span>
              <span className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium">
                {assessments.length} Quizzes
              </span>
            </div>
          </div>
        </div>

        {/* Topics & Lessons Accordion List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Curriculum Units & Lessons</h3>

          {topics.length === 0 ? (
            <EmptyState
              title="No Topics Available"
              description="Your teacher has not structured topics for this subject yet."
            />
          ) : (
            topics.map((topic, idx) => {
              const topicLessons = topic.content || [];
              const topicQuiz = assessments.find((a) => a.topic_id === topic.id);

              return (
                <div
                  key={topic.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{topic.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-8">{topic.description}</p>
                    </div>

                    {topicQuiz && (
                      <Link
                        href={`/student/assessments/${topicQuiz.id}`}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Take Quiz</span>
                      </Link>
                    )}
                  </div>

                  {/* Lessons inside this topic */}
                  {topicLessons.length > 0 && (
                    <div className="ml-8 pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Study Notes & Lessons
                      </div>
                      {topicLessons.map((item: LearningContent) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                          </div>
                          <Link
                            href={`/student/revision?topic=${topic.id}`}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <span>Read Lesson</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
