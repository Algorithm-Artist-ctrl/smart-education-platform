// app/(dashboard)/student/diagnostic/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Brain, 
  Award, 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  Compass, 
  Loader2,
  HelpCircle,
  Clock,
  RotateCcw,
  Check
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { updateTopicMastery, evaluatePositiveFailure } from '@/lib/learning-engine';

interface DiagnosticQuestion {
  id: string;
  subject_name: string;
  topic_name: string;
  topic_id?: string;
  subject_id?: string;
  difficulty: number;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  analogy: string;
}

const QUESTION_POOL: DiagnosticQuestion[] = [
  // Math - Foundational
  {
    id: 'diag-math-1',
    subject_name: 'Mathematics',
    topic_name: 'Quadratic Equations',
    difficulty: 1,
    question_text: 'What are the solutions to the equation x² - 9 = 0?',
    options: ['x = 3 and x = -3', 'x = 9 and x = -9', 'x = 3 only', 'x = 0'],
    correct_option_index: 0,
    explanation: 'Factoring x² - 9 gives (x - 3)(x + 3) = 0, so x = 3 or x = -3.',
    analogy: 'Think of square roots like finding the two sides of a square of area 9: both +3 and -3 square to 9.',
  },
  // Math - Intermediate
  {
    id: 'diag-math-2',
    subject_name: 'Mathematics',
    topic_name: 'Quadratic Equations',
    difficulty: 2,
    question_text: 'What are the roots of x² - 5x + 6 = 0?',
    options: ['x = 2 and x = 3', 'x = -2 and x = -3', 'x = 1 and x = 6', 'x = -1 and x = 5'],
    correct_option_index: 0,
    explanation: 'Factoring gives (x - 2)(x - 3) = 0, meaning roots are 2 and 3.',
    analogy: 'Look for two numbers that multiply to +6 and add up to -5: -2 and -3.',
  },
  // Math - Advanced
  {
    id: 'diag-math-3',
    subject_name: 'Mathematics',
    topic_name: 'Trigonometric Ratios',
    difficulty: 3,
    question_text: 'In any right triangle, what is the fundamental identity relating sin(θ) and cos(θ)?',
    options: ['sin²(θ) + cos²(θ) = 1', 'sin(θ) + cos(θ) = 1', 'tan²(θ) + 1 = cos²(θ)', 'sin(θ) × cos(θ) = 1'],
    correct_option_index: 0,
    explanation: 'Pythagoras theorem on a unit circle gives x² + y² = cos²(θ) + sin²(θ) = 1.',
    analogy: 'Hypotenuse² = Opposite² + Adjacent² mapped onto a unit circle.',
  },
  // Physics - Foundational
  {
    id: 'diag-phy-1',
    subject_name: 'Physics',
    topic_name: 'Laws of Motion',
    difficulty: 1,
    question_text: 'What happens to an object in motion if no net external force acts on it?',
    options: [
      'It continues moving at constant velocity',
      'It gradually comes to a complete stop',
      'It speeds up exponentially',
      'It instantly changes direction'
    ],
    correct_option_index: 0,
    explanation: "Newton's First Law (Inertia) states objects maintain constant motion without external force.",
    analogy: 'Like a hockey puck sliding on frictionless ice in deep space.',
  },
  // Physics - Intermediate
  {
    id: 'diag-phy-2',
    subject_name: 'Physics',
    topic_name: 'Light - Reflection & Refraction',
    difficulty: 2,
    question_text: 'When light passes from air into water, what happens to its speed and direction?',
    options: [
      'It slows down and bends toward the normal',
      'It speeds up and bends away from the normal',
      'Its speed remains identical',
      'It reflects backwards completely'
    ],
    correct_option_index: 0,
    explanation: 'Water is optically denser than air (n ≈ 1.33 vs 1.00), reducing velocity and refracting toward the normal.',
    analogy: 'Imagine a shopping cart wheels hitting mud on one side: the mud slows the cart and turns it.',
  },
  // Computer Science / Logic
  {
    id: 'diag-cs-1',
    subject_name: 'Computer Science',
    topic_name: 'Python Fundamentals',
    difficulty: 1,
    question_text: 'If `x = 10` and `y = 3`, what is the result of `x // y` (integer floor division) in Python?',
    options: ['3', '3.333', '1', '30'],
    correct_option_index: 0,
    explanation: '`//` calculates floor division, discarding any fractional remainder: 10 // 3 = 3.',
    analogy: 'Distributing 10 whole apples equally to 3 students gives 3 apples each.',
  },
  // Logic & Algorithms
  {
    id: 'diag-cs-2',
    subject_name: 'Computer Science',
    topic_name: 'Data Structures & Logic',
    difficulty: 2,
    question_text: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
    options: ['Queue', 'Stack', 'Tree', 'Binary Heap'],
    correct_option_index: 0,
    explanation: 'A Queue processes items in the exact order they arrive (FIFO), like a cinema line.',
    analogy: 'Standing in line at an ice cream shop: the first person in line gets served first.',
  }
];

export default function DiagnosticPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Diagnostic State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosticQuestion>(QUESTION_POOL[0]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [answersLog, setAnswersLog] = useState<Array<{
    question: DiagnosticQuestion;
    selectedOption: number;
    isCorrect: boolean;
    timeSpent: number;
  }>>([]);

  const [diagnosticFinished, setDiagnosticFinished] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);
  const [persisting, setPersisting] = useState(false);

  const supabase = createClient();
  const TOTAL_DIAGNOSTIC_STEPS = 5;

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/diagnostic');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(prof);
      setLoading(false);
      setQuestionStartTime(Date.now());
    }

    init();
  }, [router, supabase]);

  // Adaptive Question Selector
  const getNextAdaptiveQuestion = (wasCorrect: boolean, lastQuestion: DiagnosticQuestion): DiagnosticQuestion => {
    const answeredIds = new Set(answersLog.map((a) => a.question.id).concat(lastQuestion.id));
    const nextSubjectTarget = answersLog.length === 1 ? 'Physics' : answersLog.length === 2 ? 'Physics' : 'Computer Science';

    const targetDifficulty = wasCorrect ? Math.min(3, lastQuestion.difficulty + 1) : Math.max(1, lastQuestion.difficulty - 1);

    const candidates = QUESTION_POOL.filter(
      (q) => !answeredIds.has(q.id) && q.subject_name === nextSubjectTarget
    );

    if (candidates.length > 0) {
      // Find candidate closest to target difficulty
      candidates.sort((a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty));
      return candidates[0];
    }

    // Fallback to any unanswered question
    const remaining = QUESTION_POOL.filter((q) => !answeredIds.has(q.id));
    return remaining[0] || QUESTION_POOL[0];
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
    const evalResult = evaluatePositiveFailure(currentQuestion, selectedOption);

    setFeedback(evalResult);
    setIsAnswerSubmitted(true);

    const newAnswerItem = {
      question: currentQuestion,
      selectedOption,
      isCorrect: evalResult.isCorrect,
      timeSpent,
    };

    setAnswersLog((prev) => [...prev, newAnswerItem]);
  };

  const handleNextStep = async () => {
    if (currentStepIndex + 1 >= TOTAL_DIAGNOSTIC_STEPS) {
      // Finalize diagnostic
      await finishDiagnostic();
    } else {
      const nextQ = getNextAdaptiveQuestion(feedback?.isCorrect ?? false, currentQuestion);
      setCurrentQuestion(nextQ);
      setCurrentStepIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setFeedback(null);
      setQuestionStartTime(Date.now());
    }
  };

  const finishDiagnostic = async () => {
    setPersisting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate Subject Scores
    const subjectStats: Record<string, { total: number; correct: number }> = {};
    let correctCount = 0;

    for (const item of answersLog) {
      const sub = item.question.subject_name;
      if (!subjectStats[sub]) subjectStats[sub] = { total: 0, correct: 0 };
      subjectStats[sub].total += 1;
      if (item.isCorrect) {
        subjectStats[sub].correct += 1;
        correctCount += 1;
      }
    }

    const overallScore = Math.round((correctCount / Math.max(1, answersLog.length)) * 100);
    const subjectScores: Record<string, number> = {};
    for (const [sub, stats] of Object.entries(subjectStats)) {
      subjectScores[sub] = Math.round((stats.correct / stats.total) * 100);
    }

    // Determine Strengths and Support Signals
    const strengths: string[] = [];
    const supportSignals: string[] = [];

    if ((subjectScores['Mathematics'] ?? 0) >= 60) {
      strengths.push('Mathematical Logic & Deductions');
    } else {
      supportSignals.push('Visual Step-by-Step Algebra Scaffolding');
    }

    if ((subjectScores['Physics'] ?? 0) >= 60) {
      strengths.push('Physical Mechanics & Laws of Motion');
    } else {
      supportSignals.push('Kinematics Analogies & Experiment Lab');
    }

    if ((subjectScores['Computer Science'] ?? 0) >= 60) {
      strengths.push('Computational Thinking & Algorithms');
    } else {
      supportSignals.push('Syntax & Step-by-Step Execution');
    }

    const recommendedActions = [
      {
        title: 'Master Quadratic Equations',
        type: 'quest',
        description: 'First personalized quest unlocked in the Citadel of Numbers.',
      },
      {
        title: "Explore Newton's Laws in 3D",
        type: 'lesson',
        description: 'Visual animation breaking down action and reaction pairs.',
      },
    ];

    const recommendedPath = [
      { subject: 'Mathematics', topic: 'Quadratic Equations', reason: 'Foundation established' },
      { subject: 'Physics', topic: 'Laws of Motion', reason: 'Recommended based on diagnostic' },
      { subject: 'Computer Science', topic: 'Python Fundamentals', reason: 'Core computational pillar' },
    ];

    const resultPayload = {
      student_id: user.id,
      overall_score: overallScore,
      summary: overallScore >= 70
        ? 'Cadet demonstrates high foundational readiness with strong logical instincts.'
        : 'Good initial baseline. Nova has calibrated gentle pacing with visual analogies.',
      subject_scores: subjectScores,
      identified_strengths: strengths,
      identified_support_signals: supportSignals,
      recommended_actions: recommendedActions,
      recommended_path: recommendedPath,
    };

    // Save diagnostic results to DB
    try {
      await supabase.from('diagnostic_results').insert(resultPayload);
    } catch (e) {
      console.warn('diagnostic_results insert warning:', e);
    }

    // Seed verified topic mastery rows based on diagnostic performance
    try {
      const { data: dbTopics } = await supabase.from('topics').select('id, name, subject_id');
      if (dbTopics && dbTopics.length > 0) {
        for (const item of answersLog) {
          const matchedTopic = dbTopics.find(
            (t) => t.name.toLowerCase() === item.question.topic_name.toLowerCase() ||
                   item.question.topic_name.toLowerCase().includes(t.name.toLowerCase()) ||
                   t.name.toLowerCase().includes(item.question.topic_name.toLowerCase())
          );
          if (matchedTopic) {
            await updateTopicMastery(
              supabase,
              user.id,
              matchedTopic.id,
              matchedTopic.subject_id,
              item.isCorrect,
              item.timeSpent,
              0,
              item.question.difficulty || 1
            );
          }
        }
      }
    } catch (tmErr) {
      console.warn('diagnostic topic mastery seed warning:', tmErr);
    }

    // Mark onboarding completed and award +100 XP
    try {
      const { data: sp } = await supabase.from('student_profiles').select('total_points').eq('id', user.id).maybeSingle();
      const currentPts = sp?.total_points || 0;

      await supabase
        .from('student_profiles')
        .update({
          onboarding_completed: true,
          total_points: currentPts + 100,
          strengths: strengths,
          support_signals: supportSignals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
    } catch (spErr) {
      console.warn('student profile diagnostic update warning:', spErr);
    }

    await refreshProfile();
    setDiagnosticResult(resultPayload);
    setDiagnosticFinished(true);
    setPersisting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060913] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-950/30 via-indigo-950/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        {!diagnosticFinished ? (
          <div className="space-y-6">
            {/* Header & Step progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                  <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Adaptive Diagnostic Exploration</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Baseline Knowledge Calibration
                </h1>
              </div>

              {/* Step Pill */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">
                  Question {currentStepIndex + 1} of {TOTAL_DIAGNOSTIC_STEPS}
                </span>
                <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / TOTAL_DIAGNOSTIC_STEPS) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-6">
              {/* Question metadata badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {currentQuestion.subject_name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentQuestion.topic_name}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Difficulty: Level {currentQuestion.difficulty}</span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  let optionStyle = 'bg-slate-800/50 border-white/10 text-slate-200 hover:bg-slate-800 hover:border-white/20';

                  if (isAnswerSubmitted) {
                    if (idx === currentQuestion.correct_option_index) {
                      optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/40';
                    } else if (isSelected && !feedback?.isCorrect) {
                      optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-950/40';
                    } else {
                      optionStyle = 'bg-slate-900/40 border-white/5 text-slate-500 opacity-50';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/40';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 text-xs sm:text-sm font-medium cursor-pointer disabled:cursor-default ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold' : 'border-slate-600'
                      }`}>
                        {isAnswerSubmitted && idx === currentQuestion.correct_option_index ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isAnswerSubmitted && isSelected && !feedback?.isCorrect ? (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        ) : isSelected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">{String.fromCharCode(65 + idx)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Banner upon submission */}
              {isAnswerSubmitted && feedback && (
                <div className={`p-4 rounded-2xl border animate-in fade-in duration-300 space-y-2 ${
                  feedback.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{feedback.feedbackTitle}</span>
                    </h4>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      +{feedback.effortXpEarned} Effort XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {feedback.feedbackText}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    💡 Analogy: {currentQuestion.analogy}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleSubmitAnswer}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Check Answer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>{currentStepIndex + 1 >= TOTAL_DIAGNOSTIC_STEPS ? 'View Learning Profile' : 'Next Question'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Personal Learning Profile Summary Card */
          <div className="cosmic-card p-6 sm:p-10 rounded-3xl border border-cyan-500/30 bg-slate-900/90 backdrop-blur-xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/30">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Personal Learning Profile Generated!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                {diagnosticResult?.summary}
              </p>
            </div>

            {/* Subject Mastery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {Object.entries(diagnosticResult?.subject_scores || {}).map(([sub, score]: any) => (
                <div key={sub} className="p-4 rounded-2xl bg-slate-800/70 border border-white/10 text-center space-y-1">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{sub}</div>
                  <div className="text-2xl font-black text-cyan-400">{score}%</div>
                  <div className="text-[10px] text-slate-500">Baseline Mastery</div>
                </div>
              ))}
            </div>

            {/* Strengths & Support Signals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Identified Strengths</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-200">
                  {diagnosticResult?.identified_strengths?.map((s: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Support Signals (Pacing)</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-200">
                  {diagnosticResult?.identified_support_signals?.map((s: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Launch to Dashboard */}
            <div className="pt-4 border-t border-white/10 text-center space-y-3">
              <button
                type="button"
                onClick={() => router.push('/student')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-xl shadow-cyan-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Your Personalized Learning Universe (+100 XP)</span>
                <Zap className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>
        )}
      </main>

      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Cadet'}
        level={1}
      />
    </div>
  );
}
