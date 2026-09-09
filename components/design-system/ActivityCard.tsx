// components/design-system/ActivityCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

export interface ActivityCardProps {
  title: string;
  subtitle?: string;
  timestamp?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'emerald' | 'cyan' | 'indigo' | 'amber';
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ActivityCard({
  title,
  subtitle,
  timestamp,
  icon,
  badge,
  badgeColor = 'cyan',
  actionHref,
  actionLabel = 'Review',
  onAction,
  className = '',
}: ActivityCardProps) {
  const badgeStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/15 transition-all duration-200 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h5 className="text-sm font-bold text-white truncate">
            {title}
          </h5>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {timestamp && (
              <span className="inline-flex items-center gap-1 shrink-0 text-slate-500">
                <Clock className="w-3 h-3" />
                {timestamp}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 ml-3">
        {badge && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${badgeStyles[badgeColor]}`}
          >
            {badge}
          </span>
        )}

        {actionHref ? (
          <Link
            href={actionHref}
            className="px-2.5 py-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition inline-flex items-center gap-1"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="px-2.5 py-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition inline-flex items-center gap-1"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ActivityCard;
