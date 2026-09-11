// components/gamification/AIPartnerSetupModal.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  X, 
  Check, 
  Heart, 
  MessageSquare, 
  Languages, 
  Bot, 
  Rocket, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface AIPartnerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentLanguage?: string;
  currentStyle?: string;
  onSuccess?: (savedData: { partnerName: string; language: string; style: string }) => void;
}

const PRESET_NAMES = [
  'Buddy',
  'Mera Dost',
  'Study Buddy',
  'Einstein',
  'My Hudy Buddy',
  'My Learning Partner',
  'Nova',
  'Aryabhata',
];

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English', desc: 'Clear, standard academic English' },
  { id: 'hinglish', label: 'Hinglish', desc: 'Natural mix of Hindi & English (Bhai/Dost style)' },
  { id: 'hi', label: 'हिंदी (Hindi)', desc: 'सरल एवं शुद्ध हिंदी में शिक्षण' },
];

const STYLE_OPTIONS = [
  { id: 'friendly', label: 'Friendly & Encouraging', desc: 'Supportive, uplifting mentor' },
  { id: 'simple', label: 'Simple & Direct', desc: 'Short explanations without fluff' },
  { id: 'hinglish', label: 'Casual & Relatable', desc: 'Feels like study session with a peer' },
  { id: 'detailed', label: 'Deep & Analytical', desc: 'Detailed concepts, proofs & mechanics' },
  { id: 'visual', label: 'Visual & Analogies', desc: 'Mental models, scenarios & pictures' },
];

export default function AIPartnerSetupModal({
  isOpen,
  onClose,
  currentName = 'Nova',
  currentLanguage = 'en',
  currentStyle = 'friendly',
  onSuccess,
}: AIPartnerSetupModalProps) {
  const { language } = useI18n();
  const [partnerName, setPartnerName] = useState(currentName === 'Nova' ? '' : currentName);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [selectedStyle, setSelectedStyle] = useState(currentStyle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resolvedName = partnerName.trim() || 'Nova';

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/student/ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_partner_name: resolvedName,
          preferred_language: selectedLanguage,
          conversation_style: selectedStyle,
          setup_completed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save AI partner profile');
      }

      if (onSuccess) {
        onSuccess({
          partnerName: resolvedName,
          language: selectedLanguage,
          style: selectedStyle,
        });
      }

      // Dispatch global event so all components react instantly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ai-partner-updated', {
            detail: {
              partnerName: resolvedName,
              language: selectedLanguage,
              style: selectedStyle,
            },
          })
        );
      }

      onClose();
    } catch (err: any) {
      console.error('[AIPartnerSetupModal] Save error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="cosmic-card rounded-3xl border border-cyan-500/40 bg-slate-900 shadow-2xl shadow-cyan-950/70 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30 overflow-hidden shrink-0">
              <div className="w-full h-full relative rounded-[14px] overflow-hidden bg-slate-950">
                <Image
                  src="/images/nova_robot.jpg"
                  alt="AI Learning Partner"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Smart Edu AI Matrix</span>
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                Meet Your Personal AI Learning Partner
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Intro Box */}
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
            Give your AI mentor a personal name and choose how they teach you. They'll remember your strengths, adapt to your pace, and guide your daily study missions.
          </div>

          {/* 1. Name Your Partner */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
              1. What would you like to call your AI Partner?
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g. My Hudy Buddy, Mera Dost, Study Buddy..."
              maxLength={40}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition shadow-inner"
            />

            {/* Suggested Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setPartnerName(name)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                      partnerName === name
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-300 border-white/10 hover:border-cyan-400/50 hover:text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Choose Language */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Preferred Teaching Language</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LANGUAGE_OPTIONS.map((langOpt) => {
                const isSelected = selectedLanguage === langOpt.id;
                return (
                  <button
                    key={langOpt.id}
                    type="button"
                    onClick={() => setSelectedLanguage(langOpt.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-cyan-400 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{langOpt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{langOpt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Choose Conversational Style */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Conversational Style</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STYLE_OPTIONS.map((styleOpt) => {
                const isSelected = selectedStyle === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => setSelectedStyle(styleOpt.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-cyan-400 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{styleOpt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{styleOpt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Pill */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950/50 border border-indigo-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-400">Preview: </span>
              <span className="font-bold text-white">
                "{resolvedName}" will mentor you in {selectedLanguage.toUpperCase()} using {selectedStyle} explanations.
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-semibold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/95 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>Save & Start Learning</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
