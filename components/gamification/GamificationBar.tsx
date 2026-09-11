// components/gamification/GamificationBar.tsx
'use client';

import React from 'react';
import { Flame, Coins, Trophy, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface GamificationBarProps {
  level: number;
  totalXp?: number;
  currentXp?: number;
  totalPoints?: number;
  streak?: number;
  streakDays?: number;
  coins?: number;
  rankText?: string;
  className?: string;
}

export default function GamificationBar({
  level = 1,
  totalXp,
  currentXp,
  totalPoints,
  streak,
  streakDays,
  coins,
  rankText,
  className = '',
}: GamificationBarProps) {
  const { language, t } = useI18n();
  const resolvedXp = currentXp ?? totalXp ?? totalPoints ?? 0;
  const resolvedStreak = streak ?? streakDays ?? 0;
  const resolvedCoins = coins ?? 0;
  const displayRank = rankText && rankText.trim() !== ''
    ? rankText
    : (language === 'hi' ? 'डेटा प्रतीक्षारत' : 'Not enough data yet');

  // XP formula: Each level requires level * 500 XP
  const xpForCurrentLevel = Math.max(0, (level - 1) * 500);
  const xpForNextLevel = Math.max(500, level * 500);
  const currentLevelProgress = Math.max(0, resolvedXp - xpForCurrentLevel);
  const levelSpan = Math.max(1, xpForNextLevel - xpForCurrentLevel);
  const progressPercent = resolvedXp === 0 ? 0 : Math.min(100, Math.max(3, Math.round((currentLevelProgress / levelSpan) * 100)));

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {/* 1. Level Card with XP progress */}
      <div className="glass-card rounded-2xl p-3.5 border border-indigo-500/20 shadow-lg shadow-indigo-950/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-black shadow-md shadow-indigo-500/30">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-300">
              {t.studentLevel || 'Level'} {level}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-300">
            {resolvedXp} <span className="text-slate-400">/ {xpForNextLevel} XP</span>
          </span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden p-0.5 border border-white/5">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 shadow-sm shadow-indigo-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Streak Badge */}
      <div className="glass-card rounded-2xl p-3.5 border border-orange-500/20 shadow-lg shadow-orange-950/20 relative overflow-hidden group flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 shrink-0">
          <Flame className="w-5 h-5 fill-white animate-pulse" />
        </div>
        <div>
          <div className="text-lg font-black text-white leading-none mb-0.5">{resolvedStreak}</div>
          <div className="text-xs font-semibold text-orange-300">{t.dayStreakLabel || 'Day Streak'}</div>
        </div>
      </div>

      {/* 3. Coins Counter */}
      <div className="glass-card rounded-2xl p-3.5 border border-amber-500/20 shadow-lg shadow-amber-950/20 relative overflow-hidden group flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-amber-950 shadow-md shadow-yellow-500/30 shrink-0">
          <Coins className="w-5 h-5 fill-amber-950" />
        </div>
        <div>
          <div className="text-lg font-black text-white leading-none mb-0.5">{resolvedCoins}</div>
          <div className="text-xs font-semibold text-amber-300">{t.coinsLabel || 'Coins'}</div>
        </div>
      </div>

      {/* 4. Rank Badge */}
      <div className="glass-card rounded-2xl p-3.5 border border-emerald-500/20 shadow-lg shadow-emerald-950/20 relative overflow-hidden group flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0">
          <Trophy className="w-5 h-5 fill-white" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black text-white leading-tight mb-0.5 truncate max-w-[130px]" title={displayRank}>
            {displayRank}
          </div>
          <div className="text-xs font-semibold text-emerald-300">{t.classRank || 'Class Rank'}</div>
        </div>
      </div>
    </div>
  );
}
