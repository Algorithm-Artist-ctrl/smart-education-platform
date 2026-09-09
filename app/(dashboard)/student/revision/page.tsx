// app/(dashboard)/student/revision/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WeakTopic, LearningContent, Assessment } from '@/types/database.types';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import Link from 'next/link';

import { Suspense } from 'react';

function RevisionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicFilter = searchParams.get('topic');

  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<WeakTopic | null>(null);
  const [contentList, setContentList] = useState<LearningContent[]>([]);
  const [topicAssessments, setTopicAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch all weak topics for student
      const { data: wtData } = await supabase
        .from('weak_topics')
        .select('*, topic:topics(*, subject:subjects(*))')
        .eq('student_id', user.id)
        .order('accuracy_rate', { ascending: true });

      if (wtData && wtData.length > 0) {
        setWeakTopics(wtData as WeakTopic[]);
        // Find matching topic or first one
        const current = topicFilter
          ? wtData.find((w: any) => w.topic_id === topicFilter) || wtData[0]
          : wtData[0];
        setSelectedTopic(current as WeakTopic);
      }
      setLoading(false);
    }

    loadData();
  }, [topicFilter, router, supabase]);

  // Load content & assessments for selected topic
  useEffect(() => {
    if (!selectedTopic) return;
    const currentTopicId = selectedTopic.topic_id;

    async function loadTopicDetails() {
      const [contentRes, assRes] = await Promise.all([
        supabase
          .from('learning_content')
          .select('*')
          .eq('topic_id', currentTopicId),
        supabase
          .from('assessments')
          .select('*')
          .eq('topic_id', currentTopicId)
          .eq('is_published', true),
      ]);

      if (contentRes.data) setContentList(contentRes.data as LearningContent[]);
      if (assRes.data) setTopicAssessments(assRes.data as Assessment[]);
    }

    loadTopicDetails();
  }, [selectedTopic, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-8">
        {/* Header */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Targeted Concept Reinforcement</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Revision Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review targeted notes, master key equations, and retake mini-quizzes to turn weaknesses into strengths.
          </p>
        </div>

        {weakTopics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <EmptyState
              title="No Weak Topics Detected!"
              description="Great job! You have either resolved all previous weak topics or maintained high accuracy on all your quizzes."
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-500 stroke-[1.5]" />}
              action={
                <Link
                  href="/student"
                  className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
                >
                  Return to Dashboard
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mobile/Tablet Horizontal Selector */}
            <div className="lg:hidden space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Select Weak Topic ({weakTopics.length})
              </h3>
              <div className="flex items-center gap-2 overflow-x-auto touch-scroll-x pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {weakTopics.map((wt) => {
                  const isSelected = selectedTopic?.id === wt.id;
                  return (
                    <button
                      key={wt.id}
                      onClick={() => setSelectedTopic(wt)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-left font-medium text-xs transition shrink-0 flex items-center gap-2.5 active:scale-95 touch-manipulation ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold">{wt.topic?.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {wt.accuracy_rate}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Desktop Left Column: Weak Topics List */}
              <div className="hidden lg:block space-y-3">
                <h3 className="text-sm font-bold text-slate-900 px-1">
                  Identified Weak Topics ({weakTopics.length})
                </h3>

                {weakTopics.map((wt) => {
                  const isSelected = selectedTopic?.id === wt.id;
                  return (
                    <button
                      key={wt.id}
                      onClick={() => setSelectedTopic(wt)}
                      className={`w-full min-h-[52px] p-4 rounded-xl border text-left transition flex items-start justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-white ring-2 ring-indigo-100 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">
                          {wt.topic?.subject?.name || 'Subject'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5 truncate">{wt.topic?.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {wt.incorrect_count} missed answers • {wt.accuracy_rate}% accuracy
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          wt.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {wt.status}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Revision Material & Reassessment */}
              <div className="lg:col-span-2 space-y-6">
                {selectedTopic && (
                  <>
                    {/* Topic Diagnostic Header */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-semibold text-rose-600">
                            {selectedTopic.topic?.subject?.name}
                          </span>
                          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                            {selectedTopic.topic?.name}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedTopic.topic?.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                            <div className="text-[10px] text-rose-600 font-bold uppercase">Accuracy</div>
                            <div className="text-lg font-black text-rose-800">
                              {selectedTopic.accuracy_rate}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Revision Notes / Content */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-slate-900">Core Revision Lesson</h3>
                      </div>

                      {contentList.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          No specific markdown lesson uploaded yet for this topic. Review your standard textbook or take the practice quiz below.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {contentList.map((item) => (
                            <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="break-words">{item.title}</span>
                              </h4>
                              {item.body_markdown && (
                                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans break-words">
                                  {item.body_markdown}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reassessment Quiz */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-indigo-950">
                          Ready to Test Your Improvement?
                        </h3>
                        <p className="text-xs text-indigo-700 mt-0.5">
                          Score 80% or higher to graduate this topic from your weak list!
                        </p>
                      </div>

                      {topicAssessments.length > 0 ? (
                        <Link
                          href={`/student/assessments/${topicAssessments[0].id}`}
                          className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Take Reassessment Quiz</span>
                        </Link>
                      ) : (
                        <Link
                          href="/student"
                          className="min-h-[44px] w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition inline-flex items-center justify-center"
                        >
                          Find Subject Quiz
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RevisionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <RevisionContent />
    </Suspense>
  );
}
