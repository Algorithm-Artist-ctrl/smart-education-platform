// components/gamification/LearningMapWorld.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Compass, Star, Lock, CheckCircle2, ChevronRight, Layers, Eye } from 'lucide-react';
import { Subject } from '@/types/database.types';

interface LearningMapWorldProps {
  subjects: Subject[];
  subjectProgress?: Record<string, { completedLevels: number; totalLevels: number }>;
}

export default function LearningMapWorld({
  subjects,
  subjectProgress = {},
}: LearningMapWorldProps) {
  const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d');

  // Aesthetic theme mappings for subject islands
  const islandThemes: Record<string, {
    glowColor: string;
    gradient: string;
    borderColor: string;
    iconSymbol: string;
    islandType: string;
    description: string;
  }> = {
    mathematics: {
      glowColor: 'rgba(59, 130, 246, 0.4)',
      gradient: 'from-blue-600/30 via-indigo-600/20 to-slate-900/90',
      borderColor: 'border-blue-500/30',
      iconSymbol: 'π',
      islandType: 'Citadel of Numbers',
      description: 'Master algebra, geometry, trigonometry & calculus.',
    },
    physics: {
      glowColor: 'rgba(6, 182, 212, 0.4)',
      gradient: 'from-cyan-600/30 via-teal-600/20 to-slate-900/90',
      borderColor: 'border-cyan-500/30',
      iconSymbol: '⚛',
      islandType: 'Orbital Laboratory',
      description: 'Explore motion, forces, optics & energy mechanics.',
    },
    'computer science': {
      glowColor: 'rgba(168, 85, 247, 0.4)',
      gradient: 'from-purple-600/30 via-violet-600/20 to-slate-900/90',
      borderColor: 'border-purple-500/30',
      iconSymbol: '</>',
      islandType: 'Cybernetic Obelisk',
      description: 'Code algorithms, data structures, and intelligent AI.',
    },
    english: {
      glowColor: 'rgba(245, 158, 11, 0.4)',
      gradient: 'from-amber-600/30 via-orange-600/20 to-slate-900/90',
      borderColor: 'border-amber-500/30',
      iconSymbol: '📖',
      islandType: 'Temple of Literature',
      description: 'Grammar mastery, creative rhetoric, and comprehension.',
    },
  };

  const getTheme = (name: string) => {
    const key = name.toLowerCase();
    for (const k of Object.keys(islandThemes)) {
      if (key.includes(k)) return islandThemes[k];
    }
    return {
      glowColor: 'rgba(99, 102, 241, 0.4)',
      gradient: 'from-indigo-600/30 via-blue-600/20 to-slate-900/90',
      borderColor: 'border-indigo-500/30',
      iconSymbol: '✦',
      islandType: 'Knowledge World',
      description: 'Explore levels, quizzes, and learning materials.',
    };
  };

  return (
    <div className="w-full">
      {/* Header with 3D/List toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Your Learning Journey
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Explore worlds, complete levels and unlock your potential!
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex p-1 bg-slate-900/80 border border-white/10 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            3D View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            List View
          </button>
        </div>
      </div>

      {/* View Mode: 3D Archipelago Canvas */}
      {viewMode === '3d' ? (
        <div className="relative rounded-3xl border border-indigo-500/20 bg-radial from-slate-900/80 via-slate-950/90 to-cosmic-950 p-6 sm:p-10 overflow-hidden min-h-[480px] flex flex-col justify-between shadow-2xl shadow-indigo-950/40">
          {/* Cosmic Background Stars & Nebulae */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950/40 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Floating World Islands Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub, idx) => {
              const theme = getTheme(sub.name);
              const progress = subjectProgress[sub.id] || { completedLevels: 0, totalLevels: 1 };
              const percent = Math.min(100, Math.round((progress.completedLevels / Math.max(progress.totalLevels, 1)) * 100));

              return (
                <Link
                  key={sub.id}
                  href={`/student/subjects/${sub.id}`}
                  className="group relative"
                >
                  <div
                    className={`glass-card-hover rounded-3xl p-5 border ${theme.borderColor} relative overflow-hidden flex flex-col justify-between h-[230px] group-hover:scale-[1.02] transition-all`}
                    style={{
                      boxShadow: `0 10px 30px -10px ${theme.glowColor}`,
                    }}
                  >
                    {/* Floating Island Icon Header */}
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center text-2xl font-black shadow-lg shadow-black/40 group-hover:animate-float-slow">
                        <span>{theme.iconSymbol}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 text-[11px] font-bold text-slate-300 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>
                          {progress.completedLevels}/{progress.totalLevels} Levels
                        </span>
                      </div>
                    </div>

                    {/* Island Info */}
                    <div className="mt-4">
                      <div className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-0.5">
                        {theme.islandType}
                      </div>
                      <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {sub.description || theme.description}
                      </p>
                    </div>

                    {/* Progress Bar & Explore Action */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                        <span>Mastery Progress</span>
                        <span className="text-white font-bold">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Special 5th Island: Career Hub Gateway */}
            <Link href="/student/career" className="group relative">
              <div className="glass-card-hover rounded-3xl p-5 border border-amber-500/40 bg-gradient-to-tr from-amber-950/20 via-slate-900/90 to-slate-900/90 shadow-xl shadow-amber-950/30 h-[230px] flex flex-col justify-between group-hover:scale-[1.02] transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-2xl font-black text-amber-950 shadow-lg shadow-amber-500/20 animate-float-medium">
                    🏛️
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                    Cosmic Portal
                  </span>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-amber-400 mb-0.5">
                    Destiny Gateway
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    Career Galaxy
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Discover your future path, strengths, and AI career recommendations.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Unlock Your Future <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        /* View Mode: List View */
        <div className="space-y-3">
          {subjects.map((sub, idx) => {
            const theme = getTheme(sub.name);
            const progress = subjectProgress[sub.id] || { completedLevels: 0, totalLevels: 1 };
            const percent = Math.min(100, Math.round((progress.completedLevels / Math.max(progress.totalLevels, 1)) * 100));

            return (
              <Link
                key={sub.id}
                href={`/student/subjects/${sub.id}`}
                className="glass-card-hover rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4 block group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xl font-bold">
                    {theme.iconSymbol}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {sub.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{sub.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-white">
                      {progress.completedLevels} / {progress.totalLevels} Levels
                    </div>
                    <div className="text-[11px] text-slate-400">{percent}% Completed</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
