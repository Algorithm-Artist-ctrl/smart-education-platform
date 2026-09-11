// components/gamification/LearningInsightsReport.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  Award, 
  TrendingUp, 
  Target, 
  AlertCircle, 
  Brain, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Flame, 
  Zap, 
  HelpCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface LearningInsightsReportProps {
  className?: string;
  onOpenPartnerChat?: (prompt?: string) => void;
}

export default function LearningInsightsReport({
  className = '',
  onOpenPartnerChat,
}: LearningInsightsReportProps) {
  const { language } = useI18n();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/student/insights');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load learning insights');
      }
      setData(json.insights);
    } catch (err: any) {
      console.error('[LearningInsightsReport] Fetch error:', err);
      setError(err.message || 'Unable to load real insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleAskPartner = (customPrompt?: string) => {
    const partner = data?.partnerName || 'Nova';
    const prompt = customPrompt || `Can you summarize my current learning progress and tell me which topic I should focus on next?`;
    
    if (onOpenPartnerChat) {
      onOpenPartnerChat(prompt);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-nova-mentor', {
          detail: { prompt },
        })
      );
    }
  };

  if (loading) {
    return (
      <div className={`cosmic-card rounded-3xl p-8 border border-white/10 bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[300px] text-center space-y-3 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs text-slate-300 font-semibold">Aggregating authentic learning insights from your database...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`cosmic-card rounded-3xl p-6 border border-rose-500/20 bg-slate-900/80 backdrop-blur-xl space-y-4 ${className}`}>
        <div className="flex items-center gap-2 text-rose-300 text-sm font-bold">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>Unable to generate insights report</span>
        </div>
        <p className="text-xs text-slate-400">{error || 'Data could not be fetched.'}</p>
        <button
          type="button"
          onClick={fetchInsights}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const partnerName = data.partnerName || 'Nova';
  const overall = data.overall || {};
  const subjects: any[] = data.subjectPerformance || [];
  const topicMasteries: any[] = data.topicMasteryList || [];
  const strengths: string[] = data.strengths || [];
  const needsPractice: string[] = data.needsPractice || [];
  const commonMistakes: string[] = data.commonMistakes || [];
  const improvements: any[] = data.recentImprovement || [];
  const nextStep = data.recommendedNextStep;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-cyan-500/30 p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/25 overflow-hidden shrink-0">
            <div className="w-full h-full relative rounded-[14px] overflow-hidden bg-slate-950">
              <Image
                src="/images/nova_robot.jpg"
                alt="AI Partner"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-400">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Real Learning Analytics</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              My Learning Insights & Progress
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Curated by your AI partner <span className="font-bold text-cyan-300">{partnerName}</span> from authentic quiz and mastery data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInsights}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            title="Refresh Insights"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAskPartner()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask {partnerName} About My Progress</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Mastery XP</div>
          <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span>{overall.xp?.toLocaleString() || 0}</span>
          </div>
          <div className="text-[10px] text-cyan-400 mt-0.5 font-semibold">Level {overall.level || 1} Scholar</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Active Streak</div>
          <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            <span>{overall.streak || 0} Days</span>
          </div>
          <div className="text-[10px] text-orange-400 mt-0.5 font-semibold">Consistency index</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Quizzes Completed</div>
          <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>{overall.quizzesTaken || 0}</span>
          </div>
          <div className="text-[10px] text-indigo-300 mt-0.5 font-semibold">Evaluated attempts</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Topics Tracked</div>
          <div className="text-xl font-black text-white font-mono mt-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>{topicMasteries.length}</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">Curriculum coverage</div>
        </div>
      </div>

      {/* 3. Main Split: Subject Performance & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Subject Mastery Bars (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/80 border border-indigo-500/20 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Subject Performance & Mastery</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">True score averages</span>
          </div>

          <div className="space-y-4 pt-1">
            {subjects.length > 0 ? (
              subjects.map((sub) => {
                const mastery = sub.mastery !== null ? sub.mastery : 0;
                const isMeasured = sub.mastery !== null;
                return (
                  <div key={sub.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{sub.name}</span>
                      <span className="font-mono font-black text-cyan-300">
                        {isMeasured ? `${mastery}%` : 'Pending Diagnostic'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          mastery >= 75
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                            : mastery >= 50
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                              : 'bg-gradient-to-r from-amber-400 to-orange-500'
                        }`}
                        style={{ width: `${Math.max(5, mastery)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{sub.topicsTracked || 0} topic modules recorded</span>
                      <span className={mastery >= 75 ? 'text-emerald-400' : mastery >= 50 ? 'text-cyan-400' : 'text-amber-400'}>
                        {mastery >= 75 ? 'Strong Proficiency' : mastery >= 50 ? 'Developing Mastery' : 'Foundation Building'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic">No subject enrollments found.</p>
            )}
          </div>
        </div>

        {/* Right: Strengths & Growth Areas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Identified Strengths */}
          <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/20 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Proven Strengths</span>
            </h3>
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">Complete quizzes to unlock your verified strengths.</p>
            )}
          </div>

          {/* Focus / Needs Practice */}
          <div className="rounded-3xl bg-slate-900/80 border border-amber-500/20 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Areas for Revision</span>
            </h3>
            {needsPractice.length > 0 ? (
              <ul className="space-y-2">
                {needsPractice.map((np, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{np}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No active weak topics logged. Great work!</p>
            )}
          </div>

        </div>

      </div>

      {/* 4. Common Mistakes & Baseline Progress Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Common Mistakes Detected */}
        <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-300">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Common Conceptual Slips Detected</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {partnerName} monitors your quiz attempts to spot conceptual confusions so you don't repeat them.
          </p>
          {commonMistakes.length > 0 ? (
            <div className="space-y-2 pt-1">
              {commonMistakes.map((mistake, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 flex items-start gap-2.5">
                  <span className="text-cyan-400 font-mono font-bold mt-0.5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200">{mistake}</p>
                    <button
                      type="button"
                      onClick={() => handleAskPartner(`Can you explain why students make this mistake and how I can avoid it: "${mistake}"?`)}
                      className="text-[10px] text-cyan-400 hover:underline mt-1 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ask {partnerName} to clarify this slip</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic pt-2">
              No recurrent conceptual slips identified yet.
            </p>
          )}
        </div>

        {/* Baseline Growth / Recent Improvements */}
        <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-5 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-300">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Verified Learning Growth (Baseline vs Current)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Measuring authentic improvement from your initial diagnostic assessment.
          </p>
          {improvements.length > 0 ? (
            <div className="space-y-2 pt-1">
              {improvements.map((imp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">{imp.topic}</div>
                    <div className="text-[10px] text-slate-400">
                      Baseline: {imp.before}% → Current: {imp.now}%
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg ${
                    imp.change >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {imp.change >= 0 ? `+${imp.change}% Growth` : `${imp.change}%`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic pt-2">
              Complete diagnostic assessment and quizzes to measure your verified growth curve.
            </p>
          )}
        </div>

      </div>

      {/* 5. Next Best Action Recommendation Banner */}
      {nextStep && (
        <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{partnerName}'s Recommended Next Step</span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white">
              {nextStep.title}
            </h4>
            <p className="text-xs text-slate-300">
              {nextStep.description}
            </p>
            <p className="text-[11px] text-cyan-300/90 italic">
              🎯 Why: {nextStep.reason}
            </p>
          </div>

          <Link
            href={nextStep.targetUrl || '/student/map'}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Start Next Mission</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
