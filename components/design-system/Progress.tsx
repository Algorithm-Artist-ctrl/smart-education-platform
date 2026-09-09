// components/design-system/Progress.tsx
'use client';

import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: 'indigo' | 'cyan' | 'purple' | 'amber' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = false,
  color = 'indigo',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorGradients = {
    indigo: 'from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
    cyan: 'from-teal-400 via-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]',
    purple: 'from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    amber: 'from-amber-400 via-orange-500 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    emerald: 'from-emerald-400 via-teal-500 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1.5 text-slate-300">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono text-cyan-400">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-950/80 rounded-full overflow-hidden border border-white/10 ${heightStyles[size]}`}>
        <div
          className={`h-full bg-gradient-to-r rounded-full transition-all duration-500 ${colorGradients[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress: number; // 0 to 100
  color?: 'indigo' | 'cyan' | 'purple' | 'amber' | 'emerald';
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  radius = 48,
  stroke = 6,
  progress,
  color = 'indigo',
  children,
  className = '',
}: ProgressRingProps) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const strokeColors = {
    indigo: '#6366f1',
    cyan: '#06b6d4',
    purple: '#a855f7',
    amber: '#f59e0b',
    emerald: '#10b981',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] transform"
      >
        {/* Background Circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.08)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress Circle */}
        <circle
          stroke={strokeColors[color]}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {/* Center Label/Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-xs font-bold font-mono text-white">
            {clampedProgress}%
          </span>
        )}
      </div>
    </div>
  );
}
