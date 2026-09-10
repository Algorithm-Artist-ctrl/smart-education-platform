// components/shared/AccessibilityBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Volume2, 
  VolumeX, 
  Type, 
  Contrast, 
  Sliders, 
  Minimize2, 
  Maximize2, 
  Sparkles,
  Check,
  ZapOff
} from 'lucide-react';

interface AccessibilitySettings {
  focusMode: boolean;
  readAloud: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  liteMode: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  focusMode: false,
  readAloud: false,
  dyslexiaFont: false,
  highContrast: false,
  liteMode: false,
};

export default function AccessibilityBar({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart_edu_a11y');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettingsToDOM(parsed);
      }
    } catch {}
  }, []);

  const applySettingsToDOM = (cfg: AccessibilitySettings) => {
    const root = document.documentElement;
    if (cfg.focusMode) root.classList.add('a11y-focus-mode');
    else root.classList.remove('a11y-focus-mode');

    if (cfg.dyslexiaFont) root.classList.add('a11y-dyslexia-font');
    else root.classList.remove('a11y-dyslexia-font');

    if (cfg.highContrast) root.classList.add('a11y-high-contrast');
    else root.classList.remove('a11y-high-contrast');

    if (cfg.liteMode) root.classList.add('a11y-lite-mode');
    else root.classList.remove('a11y-lite-mode');
  };

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    applySettingsToDOM(updated);
    try {
      localStorage.setItem('smart_edu_a11y', JSON.stringify(updated));
    } catch {}
  };

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Get active selection or main text on page
    const selectedText = window.getSelection()?.toString();
    const textToRead = selectedText || document.querySelector('main')?.innerText?.slice(0, 400) || 'Smart Education platform ready.';

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const activeCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility settings"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition shadow-md"
      >
        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Accessibility</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Settings Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl p-4 z-50 backdrop-blur-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Support & Accessibility
              </h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {/* 1. Focus Mode */}
            <button
              type="button"
              onClick={() => toggleSetting('focusMode')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                settings.focusMode
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                  : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Minimize2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Focus Mode</div>
                  <div className="text-[10px] text-slate-400">Dim distractions & extra animations</div>
                </div>
              </div>
              <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                settings.focusMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600'
              }`}>
                {settings.focusMode && <Check className="w-3 h-3" />}
              </span>
            </button>

            {/* 2. Read Aloud */}
            <button
              type="button"
              onClick={handleReadAloud}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                isSpeaking
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                  : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold">
                    {isSpeaking ? 'Reading Aloud (Click to Stop)' : 'Read Screen Aloud'}
                  </div>
                  <div className="text-[10px] text-slate-400">Speaks selected text or page summary</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                {isSpeaking ? 'Active' : 'TTS'}
              </span>
            </button>

            {/* 3. Dyslexia Font */}
            <button
              type="button"
              onClick={() => toggleSetting('dyslexiaFont')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                settings.dyslexiaFont
                  ? 'bg-blue-500/20 border-blue-500/50 text-white'
                  : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Dyslexia Friendly Font</div>
                  <div className="text-[10px] text-slate-400">Enhanced spacing & high legibility</div>
                </div>
              </div>
              <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                settings.dyslexiaFont ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600'
              }`}>
                {settings.dyslexiaFont && <Check className="w-3 h-3" />}
              </span>
            </button>

            {/* 4. High Contrast */}
            <button
              type="button"
              onClick={() => toggleSetting('highContrast')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                settings.highContrast
                  ? 'bg-amber-500/20 border-amber-500/50 text-white'
                  : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Contrast className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">High Contrast</div>
                  <div className="text-[10px] text-slate-400">Boosts element and text visibility</div>
                </div>
              </div>
              <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                settings.highContrast ? 'bg-amber-600 border-amber-500 text-white' : 'border-slate-600'
              }`}>
                {settings.highContrast && <Check className="w-3 h-3" />}
              </span>
            </button>

            {/* 5. Lite Mode (for low-end devices) */}
            <button
              type="button"
              onClick={() => toggleSetting('liteMode')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                settings.liteMode
                  ? 'bg-teal-500/20 border-teal-500/50 text-white'
                  : 'bg-slate-800/60 border-white/5 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ZapOff className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Lite Mode</div>
                  <div className="text-[10px] text-slate-400">Disables 3D particles for low-spec devices</div>
                </div>
              </div>
              <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                settings.liteMode ? 'bg-teal-600 border-teal-500 text-white' : 'border-slate-600'
              }`}>
                {settings.liteMode && <Check className="w-3 h-3" />}
              </span>
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Settings saved locally</span>
            <button
              onClick={() => {
                setSettings(DEFAULT_SETTINGS);
                applySettingsToDOM(DEFAULT_SETTINGS);
                localStorage.removeItem('smart_edu_a11y');
              }}
              className="hover:text-white underline"
            >
              Reset all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
