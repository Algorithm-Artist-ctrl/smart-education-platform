// components/design-system/SubjectWorldCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { ProgressBar } from './Progress';

export interface SubjectWorldCardProps {
  id: string;
  name: string;
  code?: string;
  description?: string | null;
  fantasyName?: string;
  completedLevels: number;
  totalLevels: number;
  masteryPercentage?: number;
  imageUrl?: string;
  className?: string;
}

export function SubjectWorldCard({
  id,
  name,
  code,
  description,
  fantasyName,
  completedLevels,
  totalLevels,
  masteryPercentage,
  imageUrl,
  className = '',
}: SubjectWorldCardProps) {
  const safeTotal = Math.max(1, totalLevels);
  const safeCompleted = Math.min(safeTotal, Math.max(0, completedLevels));
  const progressPercent = masteryPercentage !== undefined 
    ? masteryPercentage 
    : Math.round((safeCompleted / safeTotal) * 100);

  // Generate fantasy title if not provided
  const displayTitle = fantasyName || (
    name.toLowerCase().includes('math') ? 'Citadel of Numbers' :
    name.toLowerCase().includes('sci') || name.toLowerCase().includes('phys') ? 'Orbital Laboratory' :
    name.toLowerCase().includes('comp') || name.toLowerCase().includes('code') ? 'Cybernetic Obelisk' :
    name.toLowerCase().includes('eng') ? 'Temple of Lexicon' :
    `${name} World`
  );

  return (
    <Link
      href={`/student/subjects/${id}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/90 border border-white/10 hover:border-indigo-500/40 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/10 ${className}`}
    >
      {/* 3D Visual or Themed Header */}
      {imageUrl ? (
        <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 border border-white/10">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-cyan-300">
            {code || name}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            {safeCompleted}/{safeTotal} Levels
          </span>
        </div>
      )}

      {/* Info */}
      <div>
        <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
          {name}
        </h4>
        <p className="text-xs text-indigo-300/80 font-medium mb-1">
          {displayTitle}
        </p>
        {description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {description}
          </p>
        )}
      </div>

      {/* Progress & Warp Button */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5 text-slate-300">
          <span>Mastery</span>
          <span className="font-mono text-cyan-400">{progressPercent}%</span>
        </div>
        <ProgressBar value={progressPercent} color="indigo" size="sm" />

        <div className="flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white mt-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400">
            <Sparkles className="w-3 h-3" />
            Enter World
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

export default SubjectWorldCard;
