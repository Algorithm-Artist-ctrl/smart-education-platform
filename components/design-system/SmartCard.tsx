// components/design-system/SmartCard.tsx
'use client';

import React from 'react';

interface SmartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'interactive' | 'cyan' | 'purple' | 'gold';
  className?: string;
}

export function SmartCard({
  children,
  variant = 'default',
  className = '',
  ...props
}: SmartCardProps) {
  const variantStyles = {
    default: 'bg-slate-900/70 border-white/10 hover:border-white/20',
    glow: 'bg-slate-900/80 border-indigo-500/30 hover:border-indigo-500/60 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]',
    interactive: 'bg-slate-900/75 border-white/10 hover:border-indigo-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer transition-all duration-300',
    cyan: 'bg-slate-900/80 border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
    purple: 'bg-slate-900/80 border-purple-500/30 hover:border-purple-400/60 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]',
    gold: 'bg-slate-900/80 border-amber-500/30 hover:border-amber-400/60 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]',
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl transition-all duration-300 p-5 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default SmartCard;
