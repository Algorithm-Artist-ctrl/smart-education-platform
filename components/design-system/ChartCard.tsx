// components/design-system/ChartCard.tsx
'use client';

import React from 'react';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  children: React.ReactNode;
  legend?: { label: string; color: string }[];
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  timeframe = '7D',
  onTimeframeChange,
  children,
  legend,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`rounded-2xl bg-slate-900/75 border border-white/10 p-5 backdrop-blur-xl ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {onTimeframeChange && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
            {['7D', '30D', 'ALL'].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg transition ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-[180px] w-full flex items-center justify-center">
        {children}
      </div>

      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
          {legend.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChartCard;
