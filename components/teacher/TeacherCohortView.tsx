// components/teacher/TeacherCohortView.tsx
'use client';

import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Brain, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Lightbulb, 
  BookOpen, 
  Eye, 
  Flame,
  Award
} from 'lucide-react';
import { StudentProfile, Profile } from '@/types/database.types';

interface StudentWithDetails {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string | null;
  level: number;
  xp: number;
  streak_days: number;
  learning_preferences?: string[];
  support_signals?: string[];
  learning_pace?: string;
  strengths?: string[];
  weak_topics?: { id: string; topic_name: string; accuracy: number }[];
  cohortStatus: 'on_track' | 'needs_attention' | 'needs_support';
  avgScore: number;
}

interface TeacherCohortViewProps {
  students: StudentWithDetails[];
}

export default function TeacherCohortView({ students }: TeacherCohortViewProps) {
  const [selectedCohort, setSelectedCohort] = useState<'all' | 'on_track' | 'needs_attention' | 'needs_support'>('all');
  const [activeStudent, setActiveStudent] = useState<StudentWithDetails | null>(null);

  const onTrackCount = students.filter((s) => s.cohortStatus === 'on_track').length;
  const attentionCount = students.filter((s) => s.cohortStatus === 'needs_attention').length;
  const supportCount = students.filter((s) => s.cohortStatus === 'needs_support').length;

  const filteredStudents = students.filter((s) => {
    if (selectedCohort === 'all') return true;
    return s.cohortStatus === selectedCohort;
  });

  const getPedagogicalIntervention = (student: StudentWithDetails) => {
    const tips: string[] = [];
    if (student.learning_preferences?.some((p) => p.toLowerCase().includes('visual'))) {
      tips.push('Use visual diagrams and physical analogies before introducing algebraic symbols.');
    }
    if (student.learning_preferences?.some((p) => p.toLowerCase().includes('practice'))) {
      tips.push('Provide hands-on micro-drills with step-by-step scaffolds rather than long lectures.');
    }
    if (student.learning_pace === 'thorough' || student.support_signals?.some((s) => s.toLowerCase().includes('extra time'))) {
      tips.push('Allow unhurried conceptual exploration; this learner prefers deep mastery over quick completion.');
    }
    if (student.weak_topics && student.weak_topics.length > 0) {
      tips.push(`Targeted reinforcement recommended for: ${student.weak_topics.map((t) => t.topic_name).join(', ')}.`);
    }
    if (tips.length === 0) {
      tips.push('Encourage continued exploration and offer advanced boss challenge quests.');
    }
    return tips;
  };

  return (
    <div className="space-y-5">
      {/* 3-Group Cohort Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. On Track */}
        <button
          type="button"
          onClick={() => setSelectedCohort(selectedCohort === 'on_track' ? 'all' : 'on_track')}
          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            selectedCohort === 'on_track'
              ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-950/40'
              : 'glass-card border-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> On Track
            </span>
            <span className="text-2xl font-black text-white">{onTrackCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Mastery &gt;= 75%, steady streak, demonstrating independent progress.
          </p>
        </button>

        {/* 2. Needs Attention */}
        <button
          type="button"
          onClick={() => setSelectedCohort(selectedCohort === 'needs_attention' ? 'all' : 'needs_attention')}
          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            selectedCohort === 'needs_attention'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-xl shadow-amber-950/40'
              : 'glass-card border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Needs Attention
            </span>
            <span className="text-2xl font-black text-white">{attentionCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Mastery 50-74%, or 1 specific concept gap needing targeted guidance.
          </p>
        </button>

        {/* 3. Needs Support */}
        <button
          type="button"
          onClick={() => setSelectedCohort(selectedCohort === 'needs_support' ? 'all' : 'needs_support')}
          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
            selectedCohort === 'needs_support'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/50 shadow-xl shadow-rose-950/40'
              : 'glass-card border-rose-500/20 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Needs Support
            </span>
            <span className="text-2xl font-black text-white">{supportCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Mastery &lt; 50%, multiple gaps, or overwhelmed learning signal.
          </p>
        </button>
      </div>

      {/* Cohort Student List Table / Grid */}
      <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-black text-white">
              Cadet Roster ({filteredStudents.length})
            </h3>
            {selectedCohort !== 'all' && (
              <button
                onClick={() => setSelectedCohort('all')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold ml-2"
              >
                Clear filter
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Click any student to view diagnostic profile & teaching tips
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No students found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStudents.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStudent(s)}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group ${
                  activeStudent?.id === s.id
                    ? 'bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-950/40'
                    : 'bg-slate-950/60 border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                }`}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {s.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                      {s.full_name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>Lvl {s.level}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Flame className="w-2.5 h-2.5" /> {s.streak_days}d
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    s.cohortStatus === 'on_track'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : s.cohortStatus === 'needs_attention'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {s.avgScore}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Student Diagnostic Detail Modal Drawer */}
      {activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                  {activeStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{activeStudent.full_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Level {activeStudent.level}</span>
                    <span>•</span>
                    <span>{activeStudent.xp} XP</span>
                    <span>•</span>
                    <span className={`font-bold ${
                      activeStudent.cohortStatus === 'on_track'
                        ? 'text-emerald-400'
                        : activeStudent.cohortStatus === 'needs_attention'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}>
                      {activeStudent.cohortStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveStudent(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Strict Child Privacy Guarantee Banner */}
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-center gap-2.5 text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Privacy Guaranteed:</strong> Direct conversational tutoring chats between cadet and Nova AI remain strictly confidential. Only diagnostic competencies and support signals are surfaced.
              </span>
            </div>

            {/* Learning Modality & Signals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  Learning Modality
                </span>
                <div className="flex flex-wrap gap-1">
                  {(activeStudent.learning_preferences || ['Visual Models', 'Step-by-step Drills']).map((p, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-semibold">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  Pacing Calibration
                </span>
                <span className="text-xs font-semibold text-slate-300 capitalize">
                  {activeStudent.learning_pace || 'Steady'} pacing with positive failure support
                </span>
              </div>
            </div>

            {/* Focus Challenge Concepts */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Active Focus Concepts Needing Support
              </h4>

              {(!activeStudent.weak_topics || activeStudent.weak_topics.length === 0) ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-xs text-slate-400">
                  No active learning gaps detected. Demonstrating strong conceptual fluency.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activeStudent.weak_topics.map((wt) => (
                    <div
                      key={wt.id}
                      className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white">{wt.topic_name}</span>
                      <span className="text-rose-400 font-mono font-bold">{wt.accuracy}% Mastery</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actionable Pedagogical Interventions */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Lightbulb className="w-4 h-4" />
                <span>Actionable Interventions for Teacher</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-300">
                {getPedagogicalIntervention(activeStudent).map((tip, i) => (
                  <li key={i} className="leading-relaxed">
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveStudent(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
