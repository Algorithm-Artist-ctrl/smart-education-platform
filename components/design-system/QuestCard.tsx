// components/design-system/QuestCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Target, Zap, Coins, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { ProgressBar } from './Progress';

export interface QuestCardProps {
  id?: string;
  title: string;
  subjectName?: string | null;
  durationMinutes?: number | null;
  progressPercent?: number;
  xpReward: number;
  coinReward?: number;
  isCompleted?: boolean;
  isClaimed?: boolean;
  onAction?: () => void;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function QuestCard({
  title,
  subjectName = 'General',
  durationMinutes = 15,
  progressPercent = 0,
  xpReward,
  coinReward = 10,
  isCompleted = false,
  isClaimed = false,
  onAction,
  actionHref,
  actionLabel,
  className = '',
}: QuestCardProps) {
  const percentage = Math.min(100, Math.max(0, progressPercent));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/40 border border-indigo-500/25 p-5 backdrop-blur-xl shadow-lg shadow-indigo-950/30 hover:border-indigo-400/40 transition-all ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              {subjectName || 'Academic Quest'}
            </span>
            {durationMinutes && (
              <span className="text-[10px] text-slate-400 ml-2 inline-flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {durationMinutes} min
              </span>
            )}
          </div>
        </div>

        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            {isClaimed ? 'Claimed' : 'Ready'}
          </span>
        )}
      </div>

      {/* Quest Title */}
      <h3 className="text-base font-bold text-white mb-3 line-clamp-1">
        {title}
      </h3>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
          <span>Objective Progress</span>
          <span className="font-mono text-cyan-400 font-bold">{percentage}%</span>
        </div>
        <ProgressBar value={percentage} color="cyan" size="sm" />
      </div>

      {/* Rewards & Action */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-1 rounded-lg">
            <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
            +{xpReward} XP
          </span>
          {coinReward ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
              <Coins className="w-3 h-3 text-amber-400 fill-amber-400" />
              +{coinReward}
            </span>
          ) : null}
        </div>

        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <span>{actionLabel || 'Continue'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <span>{actionLabel || 'Continue'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default QuestCard;
