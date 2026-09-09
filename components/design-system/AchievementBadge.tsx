// components/design-system/AchievementBadge.tsx
'use client';

import React from 'react';
import { Flame, BookOpen, Zap, ShieldCheck, Sun, Trophy, Award, Lock, Sparkles } from 'lucide-react';

export interface AchievementBadgeProps {
  id?: string;
  code: string;
  name: string;
  description?: string;
  criteria?: string;
  unlocked?: boolean;
  earnedDate?: string | null;
  xpReward?: number;
  iconName?: string;
  className?: string;
}

export function AchievementBadge({
  code,
  name,
  description,
  criteria,
  unlocked = false,
  earnedDate,
  xpReward = 100,
  iconName,
  className = '',
}: AchievementBadgeProps) {
  // Select icon based on code or iconName
  const getIcon = () => {
    const c = (iconName || code).toUpperCase();
    if (c.includes('STREAK')) return <Flame className="w-8 h-8 text-orange-400 fill-orange-400/80" />;
    if (c.includes('MATH') || c.includes('BOOK')) return <BookOpen className="w-8 h-8 text-amber-400" />;
    if (c.includes('SPEED') || c.includes('SOLVER') || c.includes('BOLT')) return <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400/80" />;
    if (c.includes('PERFECT') || c.includes('SCORE') || c.includes('SHIELD')) return <ShieldCheck className="w-8 h-8 text-emerald-400" />;
    if (c.includes('EARLY') || c.includes('BIRD') || c.includes('SUN')) return <Sun className="w-8 h-8 text-yellow-400 fill-yellow-400/80" />;
    if (c.includes('CHAMPION') || c.includes('MASTER') || c.includes('LEGEND')) return <Trophy className="w-8 h-8 text-purple-400" />;
    return <Award className="w-8 h-8 text-indigo-400" />;
  };

  return (
    <div
      className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 ${
        unlocked
          ? 'bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-indigo-950/40 border-indigo-500/30 hover:border-indigo-400/60 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] hover:-translate-y-1'
          : 'bg-slate-950/40 border-white/5 opacity-50 grayscale'
      } ${className}`}
    >
      {/* 3D-styled Badge Icon Hexagon/Orb */}
      <div className="relative mb-3">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
            unlocked
              ? 'bg-gradient-to-tr from-indigo-950 to-slate-900 border-white/20 shadow-indigo-500/20'
              : 'bg-slate-900 border-white/5 shadow-none'
          }`}
        >
          {unlocked ? getIcon() : <Lock className="w-7 h-7 text-slate-500" />}
        </div>
        {unlocked && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="w-3 h-3 fill-slate-950" />
          </div>
        )}
      </div>

      {/* Name */}
      <h4 className="text-sm font-bold text-white mb-1">
        {name}
      </h4>

      {/* Criteria */}
      <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
        {criteria || description || 'Earned by achieving mastery milestones'}
      </p>

      {/* Footer / XP */}
      <div className="mt-auto pt-2 border-t border-white/5 w-full flex items-center justify-center">
        {unlocked ? (
          <span className="text-[11px] font-bold text-purple-300 inline-flex items-center gap-1 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/30">
            <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
            +{xpReward} XP
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
      </div>
    </div>
  );
}

export default AchievementBadge;
