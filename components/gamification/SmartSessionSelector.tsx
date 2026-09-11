// components/gamification/SmartSessionSelector.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Zap,
  Target,
  Rocket,
  Compass,
  Crown,
  Play,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Flame,
  Award,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { SmartSessionPlan, SmartSessionTask } from '@/lib/learning-engine';
import Link from 'next/link';

interface SmartSessionSelectorProps {
  initialDuration?: 5 | 10 | 15 | 20 | 30;
  onSessionStarted?: (sessionId: string, plan: SmartSessionPlan) => void;
}

const DURATION_OPTIONS = [
  {
    minutes: 5 as const,
    label: '5 Min',
    badge: 'Quick Burst',
    hiBadge: 'क्विक बर्स्ट',
    xp: 30,
    icon: Zap,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    activeBg: 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-amber-500/20',
  },
  {
    minutes: 10 as const,
    label: '10 Min',
    badge: 'Target Drill',
    hiBadge: 'टारगेट ड्रिल',
    xp: 55,
    icon: Target,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    activeBg: 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-emerald-500/20',
  },
  {
    minutes: 15 as const,
    label: '15 Min',
    badge: 'Focused Sprint',
    hiBadge: 'फोकस्ड स्प्रिंट',
    xp: 80,
    icon: Rocket,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    activeBg: 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-cyan-500/20',
    recommended: true,
  },
  {
    minutes: 20 as const,
    label: '20 Min',
    badge: 'Deep Dive',
    hiBadge: 'डीप डाइव',
    xp: 110,
    icon: Compass,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    activeBg: 'bg-purple-500/15 border-purple-400 text-purple-300 shadow-purple-500/20',
  },
  {
    minutes: 30 as const,
    label: '30 Min',
    badge: 'Mastery Quest',
    hiBadge: 'मास्टरी क्वेस्ट',
    xp: 165,
    icon: Crown,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    activeBg: 'bg-yellow-500/15 border-yellow-400 text-yellow-300 shadow-yellow-500/20',
  },
];

export default function SmartSessionSelector({
  initialDuration = 15,
  onSessionStarted,
}: SmartSessionSelectorProps) {
  const { language } = useI18n();
  const isHi = language === 'hi';

  const [selectedDuration, setSelectedDuration] = useState<5 | 10 | 15 | 20 | 30>(initialDuration);
  const [plan, setPlan] = useState<SmartSessionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [starting, setStarting] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchPlan() {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/sessions?duration=${selectedDuration}`);
        if (!res.ok) throw new Error('Failed to fetch plan');
        const data = await res.json();
        if (isMounted && data.plan) {
          setPlan(data.plan);
        }
      } catch (err) {
        console.warn('Could not load smart session plan:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, [selectedDuration]);

  const handleStartSession = async () => {
    if (!plan) return;
    setStarting(true);
    try {
      const res = await fetch('/api/student/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: selectedDuration, plan }),
      });
      const data = await res.json();
      if (data.session?.id) {
        setActiveSessionId(data.session.id);
        if (onSessionStarted) {
          onSessionStarted(data.session.id, plan);
        }
      }
    } catch (err) {
      console.warn('Failed to register active session:', err);
      setActiveSessionId(`active-${Date.now()}`);
    } finally {
      setStarting(false);
    }
  };

  const toggleTask = (index: number) => {
    setCompletedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const allCompleted =
    plan && plan.tasks.length > 0 && plan.tasks.every((_, i) => completedTasks[i]);

  const handleFinishSession = async () => {
    if (!activeSessionId || !plan) return;
    try {
      await fetch('/api/student/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          xpEarned: plan.totalXpReward,
          status: 'completed',
        }),
      });
      alert(isHi ? `बधाई हो! आपने ${plan.totalXpReward} XP अर्जित किए!` : `Cosmic Victory! You earned +${plan.totalXpReward} XP!`);
      setActiveSessionId(null);
      setCompletedTasks({});
    } catch (err) {
      console.warn('Failed to complete session:', err);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              {isHi ? 'स्मार्ट अध्ययन योजनाकार' : 'Adaptive Session Architect'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="h-3.5 w-3.5" />
              {isHi ? 'समय के अनुसार अनुकूलित' : 'Time-Calibrated'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {isHi ? 'सत्र की अवधि चुनें' : 'Calibrated Study Sprint'}
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            {isHi
              ? 'जितना समय आपके पास हो, चुनें। नोवा आपकी वर्तमान विषय पकड़ के आधार पर वास्तविक कार्य निर्धारित करता है।'
              : 'Choose your available focus window. Nova auto-balances recap, deliberate practice, and conceptual checks.'}
          </p>
        </div>

        {plan && (
          <div className="flex items-center gap-3 self-start md:self-auto bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3">
            <Award className="h-8 w-8 text-amber-400" />
            <div>
              <div className="text-xs text-slate-400 font-medium">{isHi ? 'संभावित पुरस्कार' : 'Completion Bounty'}</div>
              <div className="text-lg font-bold text-amber-300">+{plan.totalXpReward} XP</div>
            </div>
          </div>
        )}
      </div>

      {/* Duration Selector Buttons */}
      <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {DURATION_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedDuration === opt.minutes;
          return (
            <button
              key={opt.minutes}
              onClick={() => setSelectedDuration(opt.minutes)}
              disabled={Boolean(activeSessionId)}
              className={`relative flex flex-col items-start p-4 rounded-2xl border transition-all text-left group ${
                isSelected
                  ? opt.activeBg + ' shadow-lg scale-[1.02]'
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/[0.04]'
              } ${activeSessionId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.recommended && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 shadow-md">
                  {isHi ? 'सुझावित' : 'OPTIMAL'}
                </span>
              )}
              <div className="flex items-center justify-between w-full mb-2">
                <Icon className={`h-5 w-5 ${isSelected ? opt.color : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="text-xs font-bold text-amber-400/90">+{opt.xp} XP</span>
              </div>
              <span className="text-base font-bold text-white">{opt.label}</span>
              <span className="text-xs text-slate-400 mt-0.5 truncate">
                {isHi ? opt.hiBadge : opt.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Plan Content */}
      <div className="relative z-10 mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span>{isHi ? 'सत्र योजना तैयार की जा रही है...' : 'Synthesizing calibrated learning path...'}</span>
          </div>
        ) : plan ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
              <div>
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                  {plan.subjectName || 'Core Syllabus'} • {plan.durationMinutes} Minutes Focus
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">{plan.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
              </div>

              {!activeSessionId ? (
                <button
                  onClick={handleStartSession}
                  disabled={starting}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
                >
                  {starting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-slate-950" />
                  )}
                  <span>{isHi ? 'सत्र शुरू करें' : 'Launch Session'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    {isHi ? 'सत्र सक्रिय है' : 'Session Active'}
                  </span>
                  {allCompleted && (
                    <button
                      onClick={handleFinishSession}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                    >
                      {isHi ? 'XP क्लेम करें' : 'Claim XP & Finish'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Task Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {plan.tasks.map((task: SmartSessionTask, idx: number) => {
                const isDone = Boolean(completedTasks[idx]);
                return (
                  <div
                    key={idx}
                    onClick={() => activeSessionId && toggleTask(idx)}
                    className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    } ${activeSessionId ? 'cursor-pointer' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300">
                          Step {idx + 1} • {task.duration_minutes}m
                        </span>
                        <span className="text-xs font-semibold text-amber-400">+{task.xp} XP</span>
                      </div>
                      <h4 className={`text-sm font-bold ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                      <Link
                        href={task.targetUrl}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{isHi ? 'अभ्यास करें' : 'Open Exercise'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>

                      {activeSessionId && (
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-white/30 hover:border-cyan-400'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
