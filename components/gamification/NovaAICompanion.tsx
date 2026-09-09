// components/gamification/NovaAICompanion.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, X, Send, Bot, ArrowRight, Lightbulb } from 'lucide-react';

interface NovaAICompanionProps {
  weakTopicName?: string | null;
  studentName?: string;
  recommendedSubject?: string;
  level?: number;
  compact?: boolean;
  className?: string;
}

export default function NovaAICompanion({
  weakTopicName,
  studentName = 'Learner',
  recommendedSubject = 'Mathematics',
  level = 1,
  compact = false,
  className = '',
}: NovaAICompanionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'nova' | 'user'; text: string }>>([
    {
      sender: 'nova',
      text: weakTopicName
        ? `Hi ${studentName}! I noticed you could boost your score on "${weakTopicName}". Ready to try 5 quick practice questions?`
        : `Hi ${studentName}! I'm Nova, your AI study mentor. Ask me anything about your lessons, concepts, or homework!`,
    },
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputVal('');

    // Responsive AI Mentor logic based on topic
    setTimeout(() => {
      let reply = `Great question about that! Let's break it down into core principles first. Would you like me to walk through a step-by-step example?`;
      if (userText.toLowerCase().includes('quiz') || userText.toLowerCase().includes('practice')) {
        reply = `Awesome! I recommend heading to the Quiz section or Revision Arena to challenge yourself and earn +100 XP!`;
      } else if (userText.toLowerCase().includes('math') || userText.toLowerCase().includes('quadratic')) {
        reply = `For quadratic equations $ax^2 + bx + c = 0$, remember the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. Always check the discriminant $b^2 - 4ac$ first!`;
      }
      setMessages((prev) => [...prev, { sender: 'nova', text: reply }]);
    }, 600);
  };

  return (
    <>
      {/* 1. Main Widget Card */}
      <div
        className={`glass-card rounded-2xl p-4 border border-cyan-500/20 shadow-xl shadow-cyan-950/20 relative overflow-hidden group ${className}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />

        <div className="flex items-center gap-3.5">
          {/* 3D Robot Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30 animate-float-medium">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute -top-1 w-2 h-2 rounded-full bg-cyan-400 blur-xs" />
                <Bot className="w-7 h-7 text-cyan-300" />
                <div className="absolute bottom-1 w-5 h-1 rounded-full bg-cyan-400/60 animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full" />
          </div>

          {/* Dialogue & CTA */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                Nova AI
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug line-clamp-2">
              {weakTopicName
                ? `Want to practice 5 questions on "${weakTopicName}"?`
                : `Ready to master your next mission in ${recommendedSubject}?`}
            </p>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Ask Nova</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive AI Mentor Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Nova AI Companion
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Personalized Smart Edu Study Mentor</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 min-h-[250px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-800/90 text-slate-200 border border-white/10'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Prompt Form */}
            <form
              onSubmit={handleSend}
              className="p-3.5 border-t border-white/10 bg-slate-900/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about a concept, formula, or problem..."
                className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/25 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
