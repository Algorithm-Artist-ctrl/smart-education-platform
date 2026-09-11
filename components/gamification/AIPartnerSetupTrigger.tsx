// components/gamification/AIPartnerSetupTrigger.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import AIPartnerSetupModal from './AIPartnerSetupModal';
import AIPartnerSettingsModal from './AIPartnerSettingsModal';

interface AIPartnerSetupTriggerProps {
  setupCompleted?: boolean;
  partnerName?: string;
  preferredLanguage?: string;
  conversationStyle?: string;
  variant?: 'banner' | 'icon' | 'badge';
}

export default function AIPartnerSetupTrigger({
  setupCompleted = true,
  partnerName = 'Nova',
  preferredLanguage = 'en',
  conversationStyle = 'friendly',
  variant = 'icon',
}: AIPartnerSetupTriggerProps) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentName, setCurrentName] = useState(partnerName);

  useEffect(() => {
    setCurrentName(partnerName);
  }, [partnerName]);

  useEffect(() => {
    const handlePartnerUpdated = (e: any) => {
      if (e.detail?.partnerName) {
        setCurrentName(e.detail.partnerName);
      }
    };
    window.addEventListener('ai-partner-updated', handlePartnerUpdated);
    return () => window.removeEventListener('ai-partner-updated', handlePartnerUpdated);
  }, []);

  // Auto-prompt setup if explicitly not completed
  useEffect(() => {
    if (setupCompleted === false) {
      const hasSeenPrompt = sessionStorage.getItem('smartedu_partner_setup_prompted');
      if (!hasSeenPrompt) {
        setIsSetupOpen(true);
        sessionStorage.setItem('smartedu_partner_setup_prompted', 'true');
      }
    }
  }, [setupCompleted]);

  if (variant === 'banner') {
    return (
      <>
        <div className="rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/30 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Personalize your AI Partner: <span className="text-cyan-300">{currentName}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Choose custom name, language (Hindi/Hinglish/English), and teaching tone.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
        </div>

        {isSetupOpen && (
          <AIPartnerSetupModal
            isOpen={isSetupOpen}
            onClose={() => setIsSetupOpen(false)}
            currentName={currentName}
            currentLanguage={preferredLanguage}
            currentStyle={conversationStyle}
            onSuccess={(data) => setCurrentName(data.partnerName)}
          />
        )}

        {isSettingsOpen && (
          <AIPartnerSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onUpdated={(newName) => setCurrentName(newName)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition cursor-pointer"
        title={`Configure ${currentName} settings`}
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {isSetupOpen && (
        <AIPartnerSetupModal
          isOpen={isSetupOpen}
          onClose={() => setIsSetupOpen(false)}
          currentName={currentName}
          currentLanguage={preferredLanguage}
          currentStyle={conversationStyle}
          onSuccess={(data) => setCurrentName(data.partnerName)}
        />
      )}

      {isSettingsOpen && (
        <AIPartnerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdated={(newName) => setCurrentName(newName)}
        />
      )}
    </>
  );
}
