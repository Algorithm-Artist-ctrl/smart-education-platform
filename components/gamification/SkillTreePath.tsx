// components/gamification/SkillTreePath.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Lock, 
  Play, 
  FileText, 
  HelpCircle, 
  ArrowRight, 
  Star, 
  Zap, 
  Crown, 
  Eye, 
  PenTool, 
  BookOpen, 
  Sparkles,
  Compass,
  Check
} from 'lucide-react';
import { Topic, TopicMastery } from '@/types/database.types';

export type TeachingMode = 'visual' | 'practice' | 'story';

interface SkillTreePathProps {
  topics: Topic[];
  subjectName: string;
  activeTopicIndex?: number;
  topicMasteries?: Record<string, TopicMastery>;
}

export default function SkillTreePath({
  topics,
  subjectName,
  activeTopicIndex = 0,
  topicMasteries = {},
}: SkillTreePathProps) {
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number>(activeTopicIndex);
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('visual');

  const selectedTopic = topics[selectedTopicIdx] || topics[0];
  const isBossNode = selectedTopicIdx === topics.length - 1 && topics.length > 1;

  // Determine unlock state based on prerequisites and topic_mastery
  const isNodeUnlocked = (idx: number) => {
    if (idx === 0) return true; // first node always unlocked
    // Boss node requires all preceding nodes to be proficient/completed
    if (idx === topics.length - 1 && topics.length > 1) {
      return topics.slice(0, idx).every((t, i) => {
        const mastery = topicMasteries[t.id];
        return (
          i < activeTopicIndex ||
          mastery?.status === 'proficient' ||
          mastery?.status === 'mastered' ||
          (mastery?.mastery_score || 0) >= 60
        );
      });
    }
    // General node i requires node i-1
    const prevTopic = topics[idx - 1];
    const prevMastery = prevTopic ? topicMasteries[prevTopic.id] : null;
    return (
      idx <= activeTopicIndex ||
      prevMastery?.status === 'proficient' ||
      prevMastery?.status === 'mastered' ||
      (prevMastery?.mastery_score || 0) >= 60
    );
  };

  const teachingModeDetails = {
    visual: {
      label: 'Visual Mode',
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      tagline: 'Diagrams & Mental Models',
      description: 'Learns through interactive diagrams, visual analogies, color-coded schemas, and step-by-step graphical flows.',
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      heroBorder: 'border-cyan-500/40',
      sampleModule: 'Concept Infographic & Vector Flowchart',
    },
    practice: {
      label: 'Practice Mode',
      icon: <PenTool className="w-4 h-4 text-emerald-400" />,
      tagline: 'Step-by-Step Drills',
      description: 'Learns by doing: interactive problem sets, guided scaffold hints, instant calibration, and code/math playgrounds.',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      heroBorder: 'border-emerald-500/40',
      sampleModule: 'Hands-on Micro-drills & Diagnostic Sandbox',
    },
    story: {
      label: 'Story Mode',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      tagline: 'Narrative & Context',
      description: 'Learns through real-world adventure scenarios, historical context, relatable narratives, and situational dilemmas.',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      heroBorder: 'border-amber-500/40',
      sampleModule: 'Real-World Case Adventure & Story Mission',
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Left: Level Nodes Skill Tree Roadmap (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Learning Quest Roadmap
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Prerequisites unlocked sequentially as mastery is verified
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {topics.filter((_, idx) => idx < activeTopicIndex).length}/{topics.length} Mastered
          </span>
        </div>

        <div className="relative pl-6 space-y-4 border-l-2 border-indigo-500/30 ml-4">
          {topics.map((t, idx) => {
            const mastery = topicMasteries[t.id];
            const isCompleted = idx < activeTopicIndex || mastery?.status === 'mastered';
            const isActive = idx === activeTopicIndex;
            const isUnlocked = isNodeUnlocked(idx);
            const isLocked = !isUnlocked;
            const isSelected = idx === selectedTopicIdx;
            const isBoss = idx === topics.length - 1 && topics.length > 1;

            return (
              <div key={t.id} className="relative">
                {/* Connector Dot */}
                <div
                  className={`absolute -left-[31px] top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isBoss
                      ? isUnlocked
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-300 text-amber-950 shadow-lg shadow-amber-500/50 animate-pulse'
                        : 'bg-slate-900 border-amber-900/50 text-amber-700'
                      : isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30'
                      : isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 animate-pulse'
                      : isUnlocked
                      ? 'bg-indigo-950 border-indigo-600 text-indigo-300'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {isBoss ? (
                    <Crown className="w-3.5 h-3.5" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isLocked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Star className="w-3 h-3 fill-white" />
                  )}
                </div>

                {/* Level Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (isUnlocked) setSelectedTopicIdx(idx);
                  }}
                  disabled={isLocked}
                  className={`w-full text-left rounded-2xl p-4 transition-all flex items-center justify-between gap-3 ${
                    isLocked
                      ? 'opacity-60 bg-slate-950/40 border border-white/5 cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-800/90 border-2 border-indigo-500/80 shadow-xl shadow-indigo-950/40'
                      : 'glass-card border border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${
                        isBoss ? 'text-amber-400' : 'text-indigo-400'
                      }`}>
                        {isBoss ? 'Boss Trial' : `Level ${idx + 1}`}
                      </span>

                      {isBoss && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> Sector Boss
                        </span>
                      )}

                      {isCompleted && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          Mastered
                        </span>
                      )}

                      {isActive && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          Current Quest
                        </span>
                      )}

                      {mastery && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          {mastery.mastery_score}% mastery
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">{t.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {isLocked 
                        ? (isBoss ? 'Locked — Master all foundational levels first' : `Locked — Complete Level ${idx} first`)
                        : (t.description || 'Master key concepts, questions, and practice sets.')}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isLocked ? (
                      <span className="p-2 rounded-xl bg-slate-800/60 text-slate-500 flex items-center gap-1 text-[11px] font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : isActive ? (
                      <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1">
                        Active <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        Select <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Right: Level Detail Inspector & Teaching Mode Selector (5 Cols) */}
      {selectedTopic && (
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-3xl p-6 border border-indigo-500/20 shadow-2xl shadow-indigo-950/40 sticky top-24 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                  {isBossNode ? 'Sector Boss Trial' : `Level ${selectedTopicIdx + 1}`}
                </span>
                <h3 className="text-lg font-black text-white">{selectedTopic.name}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isBossNode 
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                  : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
              }`}>
                {isBossNode ? <Crown className="w-5 h-5 text-amber-400" /> : <Star className="w-5 h-5 fill-indigo-400 text-indigo-400" />}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedTopic.description ||
                'Comprehensive interactive module covering foundational theory, step-by-step examples, and diagnostic quizzes.'}
            </p>

            {/* "Same Lesson, Different Teaching" Mode Switcher */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Same Lesson, Different Teaching
                </span>
                <span className="text-[10px] text-slate-400">Adaptive Mode</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/5">
                {(['visual', 'practice', 'story'] as TeachingMode[]).map((mode) => {
                  const details = teachingModeDetails[mode];
                  const isCurrent = teachingMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTeachingMode(mode)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {details.icon}
                      <span className="text-[10px]">{mode === 'visual' ? 'Visual' : mode === 'practice' ? 'Practice' : 'Story'}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mode Description pill */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  {teachingModeDetails[teachingMode].icon}
                  <span>{teachingModeDetails[teachingMode].tagline}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {teachingModeDetails[teachingMode].description}
                </p>
              </div>
            </div>

            {/* Content Modules Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {teachingMode === 'visual' ? 'Diagram Breakdown' : teachingMode === 'story' ? 'Narrative Context' : 'Worked Examples'}
                    </div>
                    <div className="text-[10px] text-slate-400">Adaptive concept walkthrough</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Interactive Practice</div>
                    <div className="text-[10px] text-slate-400">Active recall with positive failure (+5 XP)</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-400">+50 XP</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Mastery Checkpoint</div>
                    <div className="text-[10px] text-slate-400">Diagnostic rating to unlock next level</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-400">Verified</span>
              </div>
            </div>

            {/* Launch Action with teaching mode parameter */}
            <Link
              href={`/student/revision?topic=${selectedTopic.id}&mode=${teachingMode}`}
              className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                isBossNode
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-indigo-600/30'
              }`}
            >
              <span>
                {isBossNode 
                  ? `Challenge Boss Trial (${teachingMode.toUpperCase()} Mode)` 
                  : `Start Level ${selectedTopicIdx + 1} (${teachingMode.toUpperCase()} Mode)`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
