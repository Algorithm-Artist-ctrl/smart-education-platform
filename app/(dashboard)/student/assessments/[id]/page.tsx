// app/(dashboard)/student/assessments/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Assessment, Question } from '@/types/database.types';
import { processAssessmentEvaluation } from '@/lib/learning-engine';
import { enqueueAction } from '@/lib/offline/db';
import Navbar from '@/components/shared/Navbar';
import { 
  Timer, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Award, 
  AlertTriangle, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function AssessmentTakePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 mins in seconds
  const [startTime] = useState<string>(new Date().toISOString());
  const [results, setResults] = useState<any | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadAssessment() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setStudentId(user.id);

      const [assRes, qRes] = await Promise.all([
        supabase
          .from('assessments')
          .select('*, subject:subjects(*), topic:topics(*)')
          .eq('id', assessmentId)
          .single(),
        supabase
          .from('questions')
          .select('*')
          .eq('assessment_id', assessmentId),
      ]);

      if (assRes.data) {
        setAssessment(assRes.data as Assessment);
        setTimeLeft((assRes.data.duration_minutes || 30) * 60);
      }
      if (qRes.data) {
        setQuestions(qRes.data as Question[]);
      }
      setLoading(false);
    }

    loadAssessment();
  }, [assessmentId, router, supabase]);

  // Countdown timer
  useEffect(() => {
    if (loading || results || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, results, timeLeft]);

  const selectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!studentId || submitting || results) return;
    setSubmitting(true);

    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      topic_id: q.topic_id,
      selected_option_index: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      time_spent_seconds: Math.round(((assessment?.duration_minutes || 30) * 60 - timeLeft) / questions.length),
    }));

    try {
      if (navigator.onLine) {
        // Direct evaluation on real Supabase backend
        const evaluation = await processAssessmentEvaluation(supabase, {
          assessment_id: assessmentId,
          student_id: studentId,
          start_time: startTime,
          answers: formattedAnswers,
        });
        setResults(evaluation);
      } else {
        // Offline queue
        await enqueueAction({
          type: 'SUBMIT_QUIZ_ANSWER',
          payload: {
            assessment_id: assessmentId,
            student_id: studentId,
            start_time: startTime,
            answers: formattedAnswers,
          },
        });
        setResults({
          isOffline: true,
          totalScore: 0,
          percentage: 0,
          message: 'Saved offline. Your assessment will be graded and synchronized when internet returns.',
        });
      }
    } catch (err: any) {
      console.error('Failed to submit assessment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-slate-800">Assessment Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">
            This assessment may not exist or does not have questions configured yet.
          </p>
          <Link
            href="/student"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  // Completed / Results View
  if (results) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="max-w-3xl w-full mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="inline-flex p-4 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <Award className="w-12 h-12" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Assessment Completed!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {assessment.title} • {assessment.subject?.name}
            </p>

            {results.isOffline ? (
              <div className="my-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                {results.message}
              </div>
            ) : (
              <div className="my-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Score</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {results.totalScore}/{results.maxScore}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Accuracy</div>
                  <div className={`text-2xl font-black mt-1 ${
                    results.percentage >= 80 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {results.percentage}%
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">XP Earned</div>
                  <div className="text-2xl font-black text-indigo-600 mt-1">
                    +{results.xpEarned}
                  </div>
                </div>
              </div>
            )}

            {/* Smart Adaptive Feedback */}
            {results.weakTopicIds && results.weakTopicIds.length > 0 && (
              <div className="my-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-left">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Personalized Recommendation</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Based on your missed questions, our adaptive engine flagged weak topics and automatically scheduled revision sessions and practice tasks into your Daily Study Plan.
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/student"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/student/study-plan"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
              >
                View Study Plan
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswers[currentQ.id] !== undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Assessment Top Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              {assessment.subject?.name || 'Subject Test'}
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">{assessment.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 rounded-xl font-mono text-sm font-bold text-slate-700">
              <Timer className="w-4 h-4 text-slate-500" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Question Progress Tracker */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {questions.map((q, idx) => {
            const answered = selectedAnswers[q.id] !== undefined;
            const current = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl font-semibold text-xs transition flex items-center justify-center flex-shrink-0 ${
                  current
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                    : answered
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>{currentQ.marks || 1} mark(s)</span>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
            {currentQ.question_text}
          </h3>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {(currentQ.options as string[]).map((optionText, optIdx) => {
              const selected = selectedAnswers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => selectOption(currentQ.id, optIdx)}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition flex items-center justify-between ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        selected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{optionText}</span>
                  </div>

                  {selected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </button>
              );
            })}
          </div>

          {/* Navigation & Submit Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg"
            >
              Previous Question
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Grading & Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Finish</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
