// components/gamification/StudentInsightsClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Settings, MessageSquare } from 'lucide-react';
import LearningInsightsReport from './LearningInsightsReport';
import AIPartnerSettingsModal from './AIPartnerSettingsModal';

interface StudentInsightsClientProps {
  initialPartnerName?: string;
}

export default function StudentInsightsClient({
  initialPartnerName = 'Nova',
}: StudentInsightsClientProps) {
  const [partnerName, setPartnerName] = useState(initialPartnerName);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const handlePartnerUpdated = (e: any) => {
      if (e.detail?.partnerName) {
        setPartnerName(e.detail.partnerName);
      }
    };
    window.addEventListener('ai-partner-updated', handlePartnerUpdated);
    return () => window.removeEventListener('ai-partner-updated', handlePartnerUpdated);
  }, []);

  const openCompanion = (prompt?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-nova-mentor', {
          detail: { prompt },
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Your AI Learning Partner is active:</span>
          <span className="font-bold text-white bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/30">
            {partnerName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Partner Settings</span>
          </button>

          <button
            type="button"
            onClick={() => openCompanion()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat with {partnerName}</span>
          </button>
        </div>
      </div>

      {/* Main Real Insights Report */}
      <LearningInsightsReport onOpenPartnerChat={(prompt) => openCompanion(prompt)} />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <AIPartnerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdated={(newName) => setPartnerName(newName)}
        />
      )}
    </div>
  );
}
