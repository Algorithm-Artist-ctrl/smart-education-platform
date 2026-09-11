'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Star, 
  Check, 
  Play, 
  Clock, 
  Zap, 
  Award,
  Layers,
  Brain,
  Sliders
} from 'lucide-react';
import { Topic, Question, TopicMastery } from '@/types/database.types';

interface TopicStudioClientProps {
  topic: Topic;
  subject: { id: string; name: string };
  moduleItem: { id: string; title: string };
  chapter: { id: string; title: string };
  questions: Question[];
  initialMastery: TopicMastery | null;
  initialTab?: string;
  partnerName?: string;
}

export default function TopicStudioClient({
  topic,
  subject,
  moduleItem,
  chapter,
  questions = [],
  initialMastery,
  initialTab = 'learn',
  partnerName = 'Nova',
}: TopicStudioClientProps) {
  const [activeTab, setActiveTab] = useState<'learn' | 'visualize' | 'practice' | 'quiz' | 'revise'>(
    (initialTab as any) || 'learn'
  );

  // Practice State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<{
    isCorrect: boolean;
    correctOptionIndex: number;
    explanation: string;
    mistakeCategory: string | null;
    xpEarned: number;
  } | null>(null);
  const [currentMastery, setCurrentMastery] = useState(initialMastery);
  const [hintsRevealed, setHintsRevealed] = useState(false);

  // Parabola Interactive Simulator State (for visualization tab)
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(-4);
  const [paramC, setParamC] = useState(3);

  // Save learning position on access
  useEffect(() => {
    fetch('/api/student/learning-position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id: subject.id,
        module_id: moduleItem.id,
        chapter_id: chapter.id,
        topic_id: topic.id,
        lesson_title: topic.name,
        step_number: activeTab === 'learn' ? 1 : activeTab === 'visualize' ? 2 : activeTab === 'practice' ? 3 : 4,
        total_steps: 4,
        status: 'in_progress',
      }),
    }).catch((err) => console.warn('Position save background warning:', err));
  }, [topic.id, subject.id, moduleItem.id, chapter.id, activeTab]);

  const currentQuestion = questions[currentQIndex] || null;

  // Submit Practice Attempt
  const handleOptionSubmit = async (optionIndex: number) => {
    if (!currentQuestion || isSubmitting || attemptResult) return;
    setSelectedOption(optionIndex);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/student/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: topic.id,
          question_id: currentQuestion.id,
          selected_option_index: optionIndex,
          hints_used: hintsRevealed ? 1 : 0,
          time_spent_seconds: 20,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setAttemptResult({
          isCorrect: data.result.isCorrect,
          correctOptionIndex: data.result.correctOptionIndex,
          explanation: data.result.explanation,
          mistakeCategory: data.result.mistakeCategory,
          xpEarned: data.result.xpEarned,
        });

        if (data.result.updatedMastery) {
          setCurrentMastery((prev: any) => ({
            ...prev,
            mastery_score: data.result.updatedMastery.mastery_score,
            status: data.result.updatedMastery.status,
          }));
        }
      }
    } catch (err) {
      console.error('Practice attempt submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setAttemptResult(null);
    setHintsRevealed(false);
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setCurrentQIndex(0);
    }
  };

  // Parabola calculations
  const discriminant = paramB * paramB - 4 * paramA * paramC;
  const vertexX = paramA !== 0 ? (-paramB / (2 * paramA)).toFixed(2) : '0';
  const vertexY = paramA !== 0 ? (paramA * Math.pow(Number(vertexX), 2) + paramB * Number(vertexX) + paramC).toFixed(2) : '0';

  return (
    <div className="space-y-6 pb-16">
      {/* Studio Navigation & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <Link href="/student/learning" className="hover:text-slate-200">My Learning</Link>
            <span>/</span>
            <Link href={`/student/learning/${subject.id}`} className="hover:text-slate-200">{subject.name}</Link>
            <span>/</span>
            <Link href={`/student/learning/${subject.id}/${moduleItem.id}`} className="hover:text-slate-200">{moduleItem.title}</Link>
            <span>/</span>
            <Link href={`/student/learning/${subject.id}/${moduleItem.id}/${chapter.id}`} className="hover:text-slate-200">{chapter.title}</Link>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">
            {topic.name}
          </h1>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Mastery:</span>
            <span className="font-bold text-emerald-400">
              {currentMastery?.mastery_score ? `${Math.round(currentMastery.mastery_score)}%` : 'New Topic'}
            </span>
          </div>
          <Link
            href={`/student/learning/${subject.id}/${moduleItem.id}/${chapter.id}`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to Chapter"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Mode Studio Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('learn')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'learn'
              ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>📖 Learn</span>
        </button>

        <button
          onClick={() => setActiveTab('visualize')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'visualize'
              ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>🧩 Visualize</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'practice'
              ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>📝 Practice ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'quiz'
              ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>🎯 Mastery Check</span>
        </button>

        <button
          onClick={() => setActiveTab('revise')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'revise'
              ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>🔄 Quick Revision</span>
        </button>
      </div>

      {/* 1. LEARN TAB */}
      {activeTab === 'learn' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
              <h2 className="text-xl font-black text-white">Concept Overview</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {topic.description || `In this unit, you explore key principles, formula derivations, and standard problem structures for ${topic.name}.`}
              </p>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Core Formula Anchor:
                </span>
                <div className="text-lg font-mono text-emerald-300 font-bold bg-slate-900 p-3 rounded-lg border border-slate-800">
                  x = (-b ± √(b² - 4ac)) / (2a)
                </div>
                <p className="text-xs text-slate-400">
                  Discriminant Δ = b² - 4ac determines root nature: Δ &gt; 0 (two distinct real roots), Δ = 0 (one real double root), Δ &lt; 0 (no real roots).
                </p>
              </div>

              {/* Learning Objectives */}
              {topic.learning_objectives && topic.learning_objectives.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-bold text-white">What You Will Master:</h3>
                  <div className="space-y-1.5">
                    {topic.learning_objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Real World Applications */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/20 p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Why Am I Learning This?
              </div>
              <h3 className="text-base font-black text-white">
                Real-World Applications in Engineering & Aerospace
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every parabolic projectile trajectory — whether calculating rocket thruster cutoffs, satellite dishes focusing signals, or physics engines in video games — relies directly on quadratic equations.
              </p>
            </div>
          </div>

          {/* Right Column: Prerequisites & Nova Direct Ask */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Prerequisites</span>
              </h3>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Basic Linear Equations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Algebraic Expansion & Factorization</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Square Roots & Sign Operations</span>
                </div>
              </div>
            </div>

            {/* Partner Quick Inquiries */}
            <div className="rounded-2xl bg-indigo-950/30 border border-indigo-500/30 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Ask {partnerName}</h3>
              </div>
              <p className="text-xs text-slate-400">
                Click any inquiry below to consult your AI partner:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => alert(`Asking ${partnerName}: "Explain ${topic.name} in simple everyday words"`)}
                  className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-indigo-300 font-medium border border-slate-800 transition-colors"
                >
                  💬 Explain this in simple words
                </button>
                <button
                  onClick={() => alert(`Asking ${partnerName}: "Give me an intuitive real-world analogy for ${topic.name}"`)}
                  className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-indigo-300 font-medium border border-slate-800 transition-colors"
                >
                  💡 Give me an intuitive analogy
                </button>
                <button
                  onClick={() => alert(`Asking ${partnerName}: "What is the most common mistake students make in ${topic.name}?"`)}
                  className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-indigo-300 font-medium border border-slate-800 transition-colors"
                >
                  ⚠️ What is the common mistake here?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VISUALIZE TAB */}
      {activeTab === 'visualize' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  <span>Interactive Parabola Model Explorer</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust coefficients a, b, and c to see how the vertex, axis of symmetry, and discriminant Δ react in real time.
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm font-bold text-emerald-400">
                y = {paramA}x² {paramB >= 0 ? `+ ${paramB}` : `- ${Math.abs(paramB)}`}x {paramC >= 0 ? `+ ${paramC}` : `- ${Math.abs(paramC)}`}
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Coefficient a (Curvature):</span>
                  <span className="text-indigo-400 font-mono">{paramA}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="1"
                  value={paramA}
                  onChange={(e) => setParamA(Number(e.target.value) || 1)}
                  className="w-full accent-indigo-500"
                />
                <span className="text-[10px] text-slate-500">a &gt; 0 opens upward, a &lt; 0 opens downward</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Coefficient b (Shift):</span>
                  <span className="text-indigo-400 font-mono">{paramB}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={paramB}
                  onChange={(e) => setParamB(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <span className="text-[10px] text-slate-500">Shifts axis of symmetry</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Coefficient c (Y-intercept):</span>
                  <span className="text-indigo-400 font-mono">{paramC}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={paramC}
                  onChange={(e) => setParamC(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <span className="text-[10px] text-slate-500">Point where curve intersects Y-axis</span>
              </div>
            </div>

            {/* Computed Diagnostic Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Discriminant Δ = b² - 4ac</span>
                <div className="text-xl font-black text-amber-400">{discriminant}</div>
                <p className="text-[11px] text-slate-400">
                  {discriminant > 0 ? '2 distinct real roots (intersects X-axis twice)' : discriminant === 0 ? '1 real double root (touches X-axis)' : '0 real roots (no X-intercepts)'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Vertex Coordinates (h, k)</span>
                <div className="text-xl font-black text-emerald-400">({vertexX}, {vertexY})</div>
                <p className="text-[11px] text-slate-400">
                  Peak or valley turning point of the curve
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Axis of Symmetry</span>
                <div className="text-xl font-black text-indigo-400">x = {vertexX}</div>
                <p className="text-[11px] text-slate-400">
                  Vertical line dividing the parabola into mirror halves
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRACTICE TAB */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          {!currentQuestion ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-10 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-lg font-black text-white">No Practice Questions Available</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Questions for this topic are being compiled. You can review the concepts or consult {partnerName}.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 lg:p-8 space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: currentQuestion.difficulty || 2 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Hint Button */}
                {!hintsRevealed && !attemptResult && (
                  <button
                    onClick={() => setHintsRevealed(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Get Hint</span>
                  </button>
                )}
              </div>

              {/* Question Prompt */}
              <div className="space-y-4">
                <h3 className="text-lg lg:text-xl font-bold text-white leading-snug">
                  {currentQuestion.question_text}
                </h3>

                {hintsRevealed && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Guiding Hint: </span>
                      Recall the standard form ax² + bx + c = 0. Identify values for a, b, and c first before applying the formula.
                    </div>
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {currentQuestion.options.map((optionText, optIdx) => {
                  let optStyle = 'bg-slate-950/80 border-slate-800 hover:border-indigo-500/60 text-slate-200';
                  
                  if (attemptResult) {
                    if (optIdx === attemptResult.correctOptionIndex) {
                      optStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                    } else if (selectedOption === optIdx && !attemptResult.isCorrect) {
                      optStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                    } else {
                      optStyle = 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-60';
                    }
                  } else if (selectedOption === optIdx) {
                    optStyle = 'bg-indigo-950/60 border-indigo-500 text-white font-semibold';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSubmitting || attemptResult !== null}
                      onClick={() => handleOptionSubmit(optIdx)}
                      className={`p-4 rounded-xl border text-left text-sm transition-all flex items-center justify-between gap-3 ${optStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{optionText}</span>
                      </div>

                      {attemptResult && optIdx === attemptResult.correctOptionIndex && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {attemptResult && selectedOption === optIdx && !attemptResult.isCorrect && (
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Explanation Box */}
              {attemptResult && (
                <div className={`p-5 rounded-xl border space-y-3 ${
                  attemptResult.isCorrect 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100' 
                    : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm">
                      {attemptResult.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300">Spot on! Excellent analytical deduction.</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span className="text-indigo-300">Great effort! Let&apos;s understand the step logic.</span>
                        </>
                      )}
                    </div>

                    <span className="text-xs font-bold text-amber-400">
                      +{attemptResult.xpEarned} XP
                    </span>
                  </div>

                  {attemptResult.mistakeCategory && (
                    <div className="text-xs text-slate-300">
                      <span className="font-semibold text-slate-200">Focus Area: </span>
                      {attemptResult.mistakeCategory}
                    </div>
                  )}

                  <div className="text-xs leading-relaxed text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="font-bold text-white block mb-1">Step-by-Step Solution:</span>
                    {attemptResult.explanation}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <span>Next Practice Challenge</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. QUIZ / MASTERY CHECK TAB */}
      {activeTab === 'quiz' && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Topic Mastery Checkpoint</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Score 80% or higher to advance this topic to Verified Mastered status and earn bonus XP.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setActiveTab('practice')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Begin Checkpoint</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. REVISE TAB */}
      {activeTab === 'revise' && (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-400" />
              <span>Quick Revision Card: {topic.name}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">3-minute cheat sheet with essential steps and trap avoidance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-emerald-400">Key Formulas & Facts</h3>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                <li>Standard form is always ax² + bx + c = 0.</li>
                <li>Quadratic formula: x = (-b ± √(b² - 4ac)) / (2a).</li>
                <li>Discriminant Δ = b² - 4ac determines root characteristics.</li>
                <li>Vertex occurs at x = -b / (2a).</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-rose-400">Common Traps to Avoid</h3>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                <li>Watch negative signs when calculating -b (e.g. if b = -4, then -b = +4).</li>
                <li>Ensure the right side is 0 before identifying a, b, and c!</li>
                <li>Remember that (-4)² is +16, never negative.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
