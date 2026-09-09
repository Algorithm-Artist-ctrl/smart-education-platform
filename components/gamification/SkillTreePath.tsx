// components/gamification/SkillTreePath.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, Play, FileText, HelpCircle, ArrowRight, Star, Zap } from 'lucide-react';
import { Topic } from '@/types/database.types';

interface SkillTreePathProps {
  topics: Topic[];
  subjectName: string;
  activeTopicIndex?: number;
}

export default function SkillTreePath({
  topics,
  subjectName,
  activeTopicIndex = 1,
}: SkillTreePathProps) {
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number>(activeTopicIndex);
  const selectedTopic = topics[selectedTopicIdx] || topics[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Left: Level Nodes Skill Tree Roadmap (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Learning Quest Roadmap
          </h3>
          <span className="text-xs text-slate-400">
            {topics.filter((_, idx) => idx < activeTopicIndex).length} of {topics.length} Levels Completed
          </span>
        </div>

        <div className="relative pl-6 space-y-4 border-l-2 border-indigo-500/30 ml-4">
          {topics.map((t, idx) => {
            const isCompleted = idx < activeTopicIndex;
            const isActive = idx === activeTopicIndex;
            const isLocked = idx > activeTopicIndex;
            const isSelected = idx === selectedTopicIdx;

            return (
              <div key={t.id} className="relative">
                {/* Connector Dot */}
                <div
                  className={`absolute -left-[31px] top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30'
                      : isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 animate-pulse'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
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
                  onClick={() => setSelectedTopicIdx(idx)}
                  className={`w-full text-left rounded-2xl p-4 transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-800/90 border-2 border-indigo-500/80 shadow-xl shadow-indigo-950/40'
                      : 'glass-card border border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                        Level {idx + 1}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          Completed
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          Current Quest
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{t.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {t.description || 'Master key concepts, questions, and practice sets.'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isActive ? (
                      <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1">
                        Continue <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : isLocked ? (
                      <span className="p-2 rounded-xl bg-slate-800/60 text-slate-500">
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        Review <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Right: Level Detail Inspector (5 Cols) */}
      {selectedTopic && (
        <div className="lg:col-span-5">
          <div className="glass-card rounded-3xl p-6 border border-indigo-500/20 shadow-2xl shadow-indigo-950/40 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                  Level {selectedTopicIdx + 1}
                </span>
                <h3 className="text-lg font-black text-white">{selectedTopic.name}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                <Star className="w-5 h-5 fill-indigo-400 text-indigo-400" />
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              {selectedTopic.description ||
                'Comprehensive interactive module covering foundational theory, step-by-step examples, and diagnostic quizzes.'}
            </p>

            {/* Content Modules Checklist */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Video Lesson</div>
                    <div className="text-[10px] text-slate-400">15 min visual explanation</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">Ready</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Practice Questions</div>
                    <div className="text-[10px] text-slate-400">10 interactive exercises</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-400">+50 XP</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Summary Notes</div>
                    <div className="text-[10px] text-slate-400">Revision cheat sheet (PDF)</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400">PDF</span>
              </div>
            </div>

            {/* Launch Action */}
            <Link
              href="/student/revision"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Start Learning Level {selectedTopicIdx + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
