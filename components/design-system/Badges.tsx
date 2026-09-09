// components/design-system/Badges.tsx
'use client';

import React from 'react';
import { Flame, Coins, Trophy, Zap, ShieldAlert, Award } from 'lucide-react';

interface BadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function XPBadge({
  xp,
  size = 'md',
  className = '',
}: BadgeProps & { xp: number | string }) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] ${sizeStyles[size]} ${className}`}
    >
      <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400 shrink-0" />
      <span>+{xp} XP</span>
    </span>
  );
}

export function LevelBadge({
  level,
  size = 'md',
  className = '',
}: BadgeProps & { level: number }) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-black rounded-full bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-indigo-400/40 text-cyan-300 shadow-[0_0_15px_rgba(99,102,241,0.25)] uppercase tracking-wider ${sizeStyles[size]} ${className}`}
    >
      <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      <span>Level {level}</span>
    </span>
  );
}

export function StreakBadge({
  streak,
  size = 'md',
  className = '',
}: BadgeProps & { streak: number }) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-orange-500/15 border border-orange-500/35 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.25)] ${sizeStyles[size]} ${className}`}
    >
      <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse shrink-0" />
      <span>{streak} Day Streak</span>
    </span>
  );
}

export function CoinBadge({
  coins,
  size = 'md',
  className = '',
}: BadgeProps & { coins: number | string }) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] ${sizeStyles[size]} ${className}`}
    >
      <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400/80 shrink-0" />
      <span>{coins} Coins</span>
    </span>
  );
}

export function RankBadge({
  rank,
  size = 'md',
  className = '',
}: BadgeProps & { rank: string | number }) {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] ${sizeStyles[size]} ${className}`}
    >
      <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span>{typeof rank === 'number' ? `#${rank} In Class` : rank}</span>
    </span>
  );
}
