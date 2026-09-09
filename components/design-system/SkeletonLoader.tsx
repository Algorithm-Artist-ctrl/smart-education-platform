// components/design-system/SkeletonLoader.tsx
'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function SkeletonLoader({ className = 'h-4 w-full' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-800/60 border border-white/5 ${className}`}
    />
  );
}

export function CardSkeleton({ className = 'h-40 w-full' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-900/60 border border-white/5 p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 rounded-lg bg-slate-800/80" />
        <div className="h-8 w-8 rounded-xl bg-slate-800/80" />
      </div>
      <div className="h-7 w-20 rounded-lg bg-slate-800/80 mb-3" />
      <div className="h-3 w-40 rounded-lg bg-slate-800/60" />
    </div>
  );
}

export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div
      className={`animate-pulse rounded-full bg-slate-800/80 border border-white/10 ${sizeMap[size]}`}
    />
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded bg-slate-800/80" />
              <div className="h-3 w-20 rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="h-8 w-16 rounded-xl bg-slate-800/80" />
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader;
