// components/gamification/AIPartnerSettingsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  X, 
  Check, 
  Settings, 
  Languages, 
  MessageSquare, 
  RotateCcw, 
  AlertTriangle, 
  Loader2, 
  Save, 
  ShieldCheck, 
  Brain, 
  History 
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface AIPartnerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (partnerName: string) => void;
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
  { id: 'en', label: 'English', desc: 'Standard academic English' },
  { id: 'hinglish', label: 'Hinglish', desc: 'Hindi + English mix (Bhai/Dost tone)' },
  { id: 'hi', label: 'हिंदी (Hindi)', desc: 'सरल एवं स्पष्ट हिंदी' },
];

const STYLE_OPTIONS = [
  { id: 'friendly', label: 'Friendly & Encouraging' },
  { id: 'simple', label: 'Simple & Direct' },
  { id: 'hinglish', label: 'Casual & Relatable' },
  { id: 'detailed', label: 'Deep & Analytical' },
  { id: 'visual', label: 'Visual & Analogies' },
];

export default function AIPartnerSettingsModal({
  isOpen,
  onClose,
  onUpdated,
}: AIPartnerSettingsModalProps) {
  const { language } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [partnerName, setPartnerName] = useState('Nova');
  const [preferredLang, setPreferredLang] = useState('en');
  const [convStyle, setConvStyle] = useState('friendly');
  const [learningMemory, setLearningMemory] = useState<{
    common_mistakes?: string[];
    focus_topics?: string[];
    learning_habits?: string[];
  }>({});

  // Fetch current AI profile on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadProfile() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/student/ai-profile');
        const data = await res.json();
        if (isMounted && data.success && data.profile) {
          setPartnerName(data.profile.ai_partner_name || 'Nova');
          setPreferredLang(data.profile.preferred_language || 'en');
          setConvStyle(data.profile.conversation_style || 'friendly');
          setLearningMemory(data.profile.learning_memory || {});
        }
      } catch (err) {
        console.warn('Failed to load AI profile:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadProfile();
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const resolvedName = partnerName.trim() || 'Nova';

    try {
      const res = await fetch('/api/student/ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_partner_name: resolvedName,
          preferred_language: preferredLang,
          conversation_style: convStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccessMsg(`Your AI Partner "${resolvedName}" settings have been saved!`);
      if (onUpdated) onUpdated(resolvedName);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ai-partner-updated', {
            detail: {
              partnerName: resolvedName,
              language: preferredLang,
              style: convStyle,
            },
          })
        );
      }

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSafeReset = async () => {
    setIsResetting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/student/ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_memory: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset memory');
      }

      setSuccessMsg('AI Partner conversational memory has been safely reset. Your grades and XP are untouched!');
      setShowResetConfirm(false);
      setLearningMemory({});

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ai-partner-updated', {
            detail: { partnerName, language: preferredLang, style: convStyle },
          })
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resetting memory');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="cosmic-card rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-950/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/30 overflow-hidden shrink-0">
              <div className="w-full h-full relative rounded-[10px] overflow-hidden bg-slate-950">
                <Image
                  src="/images/nova_robot.jpg"
                  alt="AI Partner"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>AI Partner Settings</span>
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure persona, language, and study preferences
              </p>
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs text-slate-400">Loading AI partner configurations...</p>
            </div>
          ) : (
            <>
              {/* Partner Name Field */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                  AI Partner Name
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. My Hudy Buddy"
                  maxLength={40}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_NAMES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setPartnerName(name)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer border ${
                        partnerName === name
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-slate-800 text-slate-300 border-white/10 hover:border-cyan-400/50'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Teaching Language</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreferredLang(opt.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        preferredLang === opt.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                          : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs block">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversational Style */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Teaching Tone & Style</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setConvStyle(style.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer text-xs flex items-center justify-between ${
                        convStyle === style.id
                          ? 'bg-indigo-600/25 border-cyan-400 text-white font-bold'
                          : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{style.label}</span>
                      {convStyle === style.id && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Memorized Habits & Transparency Section */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span>What {partnerName} Knows About Your Learning</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your AI partner retains personalized study notes to better help you. This data is private to you and never shared with teachers or parents.
                </p>
                <div className="space-y-1.5 text-xs">
                  {learningMemory.learning_habits && learningMemory.learning_habits.length > 0 ? (
                    learningMemory.learning_habits.map((habit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{habit}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      No customized study habits memorized yet. As you ask questions, {partnerName} will learn your preferred pace.
                    </p>
                  )}
                </div>
              </div>

              {/* Safe Reset Preference Section (Requirement 20) */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Safe AI Memory Reset</span>
                </div>
                <p className="text-[11px] text-rose-200/80 leading-relaxed">
                  Want a fresh start? Resetting your AI memory removes past conversational patterns and preferences.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>Guaranteed: Your quiz scores, XP, level, and academic history will NEVER be deleted.</span>
                </div>

                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset AI Learning Memory</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 space-y-2">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Are you sure you want to reset AI memory?</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSafeReset}
                        disabled={isResetting}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {isResetting && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>Yes, Reset Memory</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-semibold">
                  {errorMsg}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-900/95 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
