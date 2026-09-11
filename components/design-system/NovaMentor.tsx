// components/design-system/NovaMentor.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bot, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';

export interface NovaMentorProps {
  partnerName?: string;
  message: string;
  userName?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: 'card' | 'compact' | 'bubble';
  className?: string;
}

export function NovaMentor({
  partnerName = 'NOVA',
  message,
  userName,
  actionLabel = 'Start Practice',
  actionHref,
  onAction,
  variant = 'card',
  className = '',
}: NovaMentorProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 backdrop-blur-md ${className}`}
      >
        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cyan-400/40 shadow-sm shadow-cyan-500/20">
          <Image
            src="/images/nova_robot.jpg"
            alt="NOVA AI Mentor"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider truncate">
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span>{partnerName}</span>
          </div>
          <p className="text-xs text-slate-200 line-clamp-1">
            {message}
          </p>
        </div>
        {actionHref ? (
          <Link
            href={actionHref}
            className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shrink-0"
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shrink-0"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    );
  }

  // Default 'card' variant (matches Screen 2 & 7)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/30 border border-cyan-500/25 p-5 backdrop-blur-xl shadow-lg shadow-cyan-950/20 ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* 3D Robot Avatar */}
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-cyan-400/40 shadow-lg shadow-cyan-500/20 bg-slate-950">
          <Image
            src="/images/nova_robot.jpg"
            alt={`${partnerName} Avatar`}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 truncate">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{partnerName}</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-semibold">
              AI Learning Companion
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            {userName ? `Hi ${userName}! ` : ''}{message}
          </p>

          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-xl transition shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-xl transition shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default NovaMentor;
