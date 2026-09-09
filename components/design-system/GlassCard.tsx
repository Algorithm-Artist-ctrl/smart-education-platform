// components/design-system/GlassCard.tsx
'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  opacity?: 'low' | 'medium' | 'high';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GlassCard({
  children,
  opacity = 'medium',
  blur = 'lg',
  className = '',
  ...props
}: GlassCardProps) {
  const opacityStyles = {
    low: 'bg-slate-950/40',
    medium: 'bg-slate-900/60',
    high: 'bg-slate-900/85',
  };

  const blurStyles = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 ${opacityStyles[opacity]} ${blurStyles[blur]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
