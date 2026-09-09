// components/design-system/StatCard.tsx
'use client';

import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  color?: 'indigo' | 'cyan' | 'purple' | 'amber' | 'emerald';
  subtitle?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendPositive = true,
  color = 'indigo',
  subtitle,
  className = '',
}: StatCardProps) {
  const colorStyles = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    purple: 'border-purple-500/20 hover:border-purple-500/40 text-purple-400 bg-purple-500/10',
    amber: 'border-amber-500/20 hover:border-amber-500/40 text-amber-400 bg-amber-500/10',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
  };

  return (
    <div
      className={`rounded-2xl bg-slate-900/75 border border-white/10 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colorStyles[color]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold ${
              trendPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default StatCard;
