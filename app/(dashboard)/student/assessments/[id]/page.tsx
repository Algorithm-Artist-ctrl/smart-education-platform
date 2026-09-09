// app/(dashboard)/student/assessments/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Assessment, Question, Profile } from '@/types/database.types';
import { processAssessmentEvaluation } from '@/lib/learning-engine';
import { enqueueAction } from '@/lib/offline/db';
import Navbar from '@/components/shared/Navbar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  Timer, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Award, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  Zap,
  Coins,
  Bot,
  HelpCircle,
  Check
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
  const [timeLeft, setTimeLeft] = useState<number>(1800); // seconds
  const [startTime] = useState<string>(new Date().toISOString());
  const [results, setResults] = useState<any | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadAssessment() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setStudentId(user.id);

      const [profRes, assRes, qRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('assessments')
          .select('*, subject:subjects(*), topic:topics(*)')
          .eq('id', assessmentId)
          .single(),
        supabase
          .from('questions')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('order_index', { ascending: true }),
      ]);

      if (profRes.data) setProfile(profRes.data as Profile);
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
      time_spent_seconds: Math.round(((assessment?.duration_minutes || 30) * 60 - timeLeft) / (questions.length || 1)),
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
          xpEarned: 25,
          message: 'Saved offline. Your challenge quest will sync and reward XP once reconnected.',
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
      <div className="min-h-screen flex items-center justify-center bg-[#060913]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Challenge Quest...</p>
        </div>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white">
        <Navbar profile={profile} />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Challenge Not Found</h2>
          <p className="text-sm text-slate-400 mt-2">
            This quest arena has no active questions configured or has been archived.
          </p>
          <Link
            href="/student/map"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Learning Map
          </Link>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // COMPLETED RESULTS VIEW (Screen 5 End State)
  // -------------------------------------------------------------
  if (results) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-indigo-900/30 via-purple-900/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <Navbar profile={profile} />

        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 sm:py-16 pb-28 md:pb-12">
          <div className="cosmic-card rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Victory Badge */}
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-500/40 text-indigo-300 mb-4 shadow-xl shadow-indigo-900/40 animate-bounce">
              <Award className="w-12 h-12 text-amber-400" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              Quest Completed!
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Challenge Victory!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {assessment.title} • {assessment.subject?.name}
            </p>

            {results.isOffline ? (
              <div className="my-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs sm:text-sm text-amber-300">
                {results.message}
              </div>
            ) : (
              <div className="my-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
                {/* Score */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Score</div>
                  <div className="text-xl sm:text-3xl font-black text-white mt-1">
                    {results.totalScore}/{results.maxScore}
                  </div>
                </div>

                {/* Accuracy */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Accuracy</div>
                  <div className={`text-xl sm:text-3xl font-black mt-1 ${
                    results.percentage >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {results.percentage}%
                  </div>
                </div>

                {/* XP Earned */}
                <div className="p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                  <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-bold flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-400" /> XP Earned
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-indigo-300 mt-1">
                    +{results.xpEarned || 50}
                  </div>
                </div>
              </div>
            )}

            {/* Smart Adaptive Recommendation Alert */}
            {results.weakTopicIds && results.weakTopicIds.length > 0 && (
              <div className="my-6 p-4 sm:p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-left">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Nova Adaptive Recommendation</span>
                </div>
                <p className="text-xs text-rose-200/80 leading-relaxed">
                  Based on your missed questions, our adaptive engine flagged weak topics and scheduled targeted flashcard drills and practice in your Revision Arena.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
              <Link
                href="/student"
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/student/revision"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-white/10 transition flex items-center justify-center"
              >
                Practice Weak Areas
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE QUIZ INTERFACE (Screen 5)
  // -------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswers[currentQ?.id] !== undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-950/30 via-blue-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-5 pb-28 md:pb-12">
        {/* Top Header Bar matching Screen 5 */}
        <div className="cosmic-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/student/subjects/${assessment.subject_id}`}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition"
              title="Exit Quest"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider border border-indigo-500/30">
                  {assessment.subject?.name || 'Subject'} • Quest
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  +10 XP / Q
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white truncate mt-1">
                {assessment.title}
              </h1>
            </div>
          </div>

          {/* Timer & Rewards Pill */}
          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-white/10 font-mono text-xs sm:text-sm font-black text-white shadow-inner">
              <Timer className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className={timeLeft < 300 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Question Progress Dots Bar */}
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll-x pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {questions.map((q, idx) => {
            const answered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`min-w-[38px] h-[38px] rounded-xl font-black text-xs transition-all flex items-center justify-center shrink-0 active:scale-95 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400'
                    : answered
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Dual-Column Quiz Arena matching Screen 5 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 3D Nova Robot Companion with Speech Bubble (4 cols) */}
          <div className="lg:col-span-4 rounded-3xl bg-slate-900/80 border border-cyan-500/25 p-5 backdrop-blur-xl shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* 3D Nova Robot Image */}
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden mb-3 border-2 border-cyan-400/40 shadow-xl shadow-cyan-500/20 bg-slate-950">
              <Image
                src="/images/nova_robot.jpg"
                alt="Nova AI Mentor"
                fill
                className="object-cover"
              />
            </div>

            {/* Speech Bubble */}
            <div className="relative bg-cyan-950/40 border border-cyan-400/30 rounded-2xl p-3.5 text-xs text-slate-200 mb-4 shadow-md w-full">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-cyan-300 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>You're doing great!</span>
              </div>
              <p className="leading-relaxed">
                Think step by step. You can do it!
              </p>
            </div>

            {/* Your Progress */}
            <div className="w-full space-y-1.5 pt-2 border-t border-white/10 text-left">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Your Progress</span>
                <span className="font-mono text-cyan-400 font-bold">{currentIndex + 1}/{questions.length}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((currentIndex + 1) / Math.max(1, questions.length)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Main Question Card matching Screen 5 (8 cols) */}
          <div className="lg:col-span-8 cosmic-card rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-white/10">
              <span className="font-bold uppercase tracking-wider text-indigo-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-white/5 font-semibold text-slate-300">
                {currentQ?.marks || 1} XP Point(s)
              </span>
            </div>

            <h3 className="text-base sm:text-xl font-bold text-white leading-relaxed">
              {currentQ?.question_text}
            </h3>

            {/* Interactive Option Cards */}
            <div className="space-y-3 pt-1">
              {(currentQ?.options as string[])?.map((optionText, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => selectOption(currentQ.id, optIdx)}
                    className={`w-full min-h-[56px] p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 active:scale-[0.99] touch-manipulation group ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold ring-1 ring-indigo-500 shadow-xl shadow-indigo-950/60'
                        : 'border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/40'
                            : 'bg-slate-800 border border-white/10 text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="break-words">{optionText}</span>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500/30 border border-indigo-400 flex items-center justify-center text-indigo-300 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submit Controls */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-25 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/5 transition"
              >
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Grading Quest...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit & Claim XP</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Companion widget */}
      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
      />
    </div>
  );
}
