// components/design-system/NotificationPanel.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Check, Zap, BookOpen, Trophy, Sparkles, X } from 'lucide-react';
import { NotificationItem } from '@/types/database.types';

export interface NotificationPanelProps {
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  onClose?: () => void;
  className?: string;
}

export function NotificationPanel({
  notifications = [],
  onMarkAllRead,
  onClose,
  className = '',
}: NotificationPanelProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'quiz':
      case 'assessment':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'quest':
        return <Zap className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
      if (diff < 1) return 'Just now';
      if (diff < 60) return `${diff}m ago`;
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
      return `${Math.floor(diff / 1440)}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div
      className={`w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-white/15 p-4 shadow-2xl backdrop-blur-2xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-white">Notifications</h4>
          {notifications.filter((n) => !n.is_read).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
              {notifications.filter((n) => !n.is_read).length} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-[11px] text-indigo-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition"
            >
              Mark all read
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <Sparkles className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-50" />
            No new notifications right now.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border transition-all ${
                n.is_read
                  ? 'bg-slate-950/40 border-white/5 opacity-70'
                  : 'bg-indigo-950/30 border-indigo-500/25'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h5 className="text-xs font-bold text-white truncate">
                      {n.title}
                    </h5>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {n.message}
                  </p>
                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-[11px] text-cyan-400 hover:underline inline-block mt-1.5 font-semibold"
                    >
                      View details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
