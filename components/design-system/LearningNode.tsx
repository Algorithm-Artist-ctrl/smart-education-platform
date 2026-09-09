// components/design-system/LearningNode.tsx
'use client';

import React from 'react';
import { Check, Lock, Play, Sparkles } from 'lucide-react';

export interface LearningNodeProps {
  levelNumber: number;
  title: string;
  subtitle?: string;
  status: 'completed' | 'current' | 'locked';
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LearningNode({
  levelNumber,
  title,
  subtitle,
  status,
  isActive = false,
  onClick,
  className = '',
}: LearningNodeProps) {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';

  const statusStyles = {
    completed: 'bg-emerald-950/40 border-emerald-500/30 hover:border-emerald-400 text-white',
    current: 'bg-indigo-950/60 border-indigo-400/60 shadow-[0_0_25px_rgba(99,102,241,0.25)] text-white ring-1 ring-indigo-400/50',
    locked: 'bg-slate-950/50 border-white/5 text-slate-500 cursor-not-allowed opacity-60',
  };

  const badgeStyles = {
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    current: 'bg-indigo-500/30 text-cyan-300 border-indigo-400/40 animate-pulse',
    locked: 'bg-white/5 text-slate-500 border-white/5',
  };

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 select-none ${statusStyles[status]} ${isActive ? 'ring-2 ring-cyan-400' : ''} ${!isLocked ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      <div className="flex items-center gap-3.5">
        {/* Node Circle Indicator */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${badgeStyles[status]}`}
        >
          {isCompleted ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : isCurrent ? (
            <Sparkles className="w-5 h-5 text-cyan-400" />
          ) : (
            <Lock className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {/* Text */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Level {levelNumber}
            </span>
            {isCurrent && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                Active
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action pill / indicator */}
      {isCurrent ? (
        <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 inline-flex items-center gap-1">
          <Play className="w-3 h-3 fill-white" />
          Continue
        </span>
      ) : isCompleted ? (
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          Mastered
        </span>
      ) : (
        <Lock className="w-4 h-4 text-slate-600 mr-2" />
      )}
    </div>
  );
}

export default LearningNode;
