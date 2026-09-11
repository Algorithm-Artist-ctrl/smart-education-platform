// components/gamification/NovaAICompanion.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/context';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  ArrowRight, 
  Lightbulb, 
  MessageSquare, 
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Zap,
  HelpCircle,
  Brain
} from 'lucide-react';

interface NovaAICompanionProps {
  weakTopicName?: string | null;
  studentName?: string;
  recommendedSubject?: string;
  level?: number;
  compact?: boolean;
  mode?: 'inline' | 'floating' | 'both';
  className?: string;
}

export default function NovaAICompanion({
  weakTopicName,
  studentName = 'Cadet',
  recommendedSubject = 'Mathematics',
  level = 1,
  compact = false,
  mode = 'both',
  className = '',
}: NovaAICompanionProps) {
  const { language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);
  const [aiHealth, setAiHealth] = useState<{ status: 'checking' | 'online' | 'offline'; message?: string; model?: string }>({ status: 'checking' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Poll server-side health of Nova AI (Gemini client & key verification)
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch('/api/ai/nova');
        const data = await res.json();
        if (isMounted) {
          setAiHealth({
            status: data.status === 'online' ? 'online' : 'offline',
            message: data.message,
            model: data.model,
          });
        }
      } catch {
        if (isMounted) {
          setAiHealth({ status: 'offline', message: 'Unable to connect to Nova AI service' });
        }
      }
    }
    checkHealth();
    return () => { isMounted = false; };
  }, []);

  // Suggested prompt chips per product specifications
  const suggestedPrompts = [
    { text: "What is a quadratic equation?", label: "What is a quadratic equation?", tag: "English" },
    { text: "Quadratic equation kya hoti hai?", label: "Quadratic equation kya hoti hai?", tag: "Hinglish" },
    { text: "Bhai quadratic equation simple way me samjha de", label: "Bhai quadratic equation simple way me samjha de", tag: "Casual Hinglish" },
    { text: "Give me a practice problem on Quadratic Equations", label: "Practice problem on Quadratic Equations", tag: "Practice" },
  ];

  // Quick Action buttons with meaningful structured prompt text per requirement 8
  const quickActions = [
    { label: "Explain like I'm 10", promptText: "Can you explain this like I'm 10 years old?", hi: 'सरल 10-वर्षीय भाषा में समझाएं', action: 'explain_10' },
    { label: 'Make it easier', promptText: "Can you make this explanation easier and simpler?", hi: 'और आसान बनाएं', action: 'simplify' },
    { label: 'Give me a hint', promptText: "Give me a hint to help me solve this problem without telling me the answer.", hi: 'एक संकेत दें', action: 'hint' },
    { label: 'Explain with example', promptText: "Can you give me a memorable real-world example of this?", hi: 'उदाहरण देकर समझाएं', action: 'example' },
    { label: 'Practice question', promptText: "Give me one practice question on this topic with multiple choice options.", hi: 'एक अभ्यास प्रश्न दें', action: 'practice' },
    { label: 'Quiz me', promptText: "Can you quiz me on this to test my understanding?", hi: 'मेरी परीक्षा लें', action: 'quiz' },
  ];

  // Cleanup abort controller and speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const initialGreeting = language === 'hi'
    ? weakTopicName
      ? `नमस्ते ${studentName}! मैंने देखा कि आप "${weakTopicName}" में सुधार कर सकते हैं। क्या हम इसे साथ में समझें या 1 अभ्यास प्रश्न हल करें?`
      : `नमस्ते ${studentName}! मैं नोवा हूँ, आपका AI स्टडी मेंटर। मुझसे ${recommendedSubject}, फॉर्मूले या होमवर्क के बारे में कुछ भी पूछें!`
    : weakTopicName
      ? `Hi ${studentName}! I noticed you could boost your mastery on "${weakTopicName}". Ready to explore it together or try a quick practice question?`
      : `Greetings ${studentName}! I'm Nova, your AI study mentor. Ask me anything about ${recommendedSubject}, homework problems, or formulas you'd like to understand!`;

  const [messages, setMessages] = useState<Array<{ sender: 'nova' | 'user'; text: string }>>([
    {
      sender: 'nova',
      text: initialGreeting,
    },
  ]);
  const [inputVal, setInputVal] = useState('');

  // Listen for open events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-nova-mentor', handleOpen);
    return () => window.removeEventListener('open-nova-mentor', handleOpen);
  }, []);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputVal(transcript);
            handleSend(transcript);
          }
          setIsListening(false);
        };

        recog.onerror = () => {
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, [language]);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Voice start warning:', err);
      }
    }
  };

  const speakText = (text: string, index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgIndex(null);
    utterance.onerror = () => setSpeakingMsgIndex(null);

    setSpeakingMsgIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string, actionType?: string) => {
    const userText = (textToSend || inputVal).trim();
    if (!userText || isLoading) return;

    // Abort previous in-flight request if user submits again
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newMessages = [...messages, { sender: 'user' as const, text: userText }];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          studentContext: {
            studentName,
            level,
            currentSubject: recommendedSubject,
            weakTopics: weakTopicName ? [weakTopicName] : [],
            language,
            actionType,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { sender: 'nova', text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'nova',
            text: data.error || (language === 'hi' 
              ? 'मुझे उत्तर तैयार करने में समस्या आ रही है। कृपया पुनः प्रयास करें।'
              : "I'm having trouble retrieving that from my knowledge cortex right now. Please try asking again!"),
          },
        ]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cleanly cancelled by user
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: 'nova',
          text: language === 'hi'
            ? 'सर्वर से संपर्क नहीं हो सका। कृपया अपना नेटवर्क जांचें।'
            : "I couldn't reach the server right now. Please check your network connection and try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };


  return (
    <>
      {/* 1. Inline Widget Card */}
      {(mode === 'inline' || mode === 'both') && (
        <div
          className={`cosmic-card rounded-2xl p-4 border border-cyan-500/20 bg-slate-900/80 shadow-xl shadow-cyan-950/20 relative overflow-hidden group ${className}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />

          <div className="flex items-center gap-3.5">
            {/* 3D Robot Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30 overflow-hidden">
                <div className="w-full h-full relative rounded-[14px] overflow-hidden bg-slate-950">
                  <Image
                    src="/images/nova_robot.jpg"
                    alt="Nova AI Mentor"
                    fill
                    className="object-cover"
                  />
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
                  ? language === 'hi'
                    ? `क्या आप "${weakTopicName}" पर 5 अभ्यास प्रश्न करना चाहते हैं?`
                    : `Want to practice 5 questions on "${weakTopicName}"?`
                  : language === 'hi'
                    ? `${recommendedSubject} में अपने अगले मिशन को पूरा करने के लिए तैयार हैं?`
                    : `Ready to master your next mission in ${recommendedSubject}?`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/25 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'hi' ? 'नोवा से पूछें' : 'Ask Nova'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Persistent Widget */}
      {(mode === 'floating' || mode === 'both') && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-40 p-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group border border-cyan-400/40 cursor-pointer"
          title={language === 'hi' ? 'नोवा AI मेंटर से बात करें' : 'Chat with Nova AI Mentor'}
        >
          <div className="w-9 h-9 rounded-full relative overflow-hidden bg-slate-950 border border-white/20">
            <Image
              src="/images/nova_robot.jpg"
              alt="Nova AI"
              fill
              className="object-cover"
            />
          </div>
          <span className="hidden sm:inline-block pr-2 text-xs font-black text-white tracking-wide">
            Nova AI
          </span>
          <span className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 border-2 border-slate-950 ${
            aiHealth.status === 'online' ? 'bg-emerald-400 animate-pulse' : aiHealth.status === 'checking' ? 'bg-amber-400' : 'bg-rose-400'
          }`} />
        </button>
      )}

      {/* 3. Interactive AI Mentor Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="cosmic-card rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-950/60 w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[82vh]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl relative overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-md shadow-cyan-500/30">
                  <Image
                    src="/images/nova_robot.jpg"
                    alt="Nova AI"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Nova AI Companion
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                      aiHealth.status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : aiHealth.status === 'checking'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {aiHealth.status === 'online'
                        ? (language === 'hi' ? 'ऑनलाइन' : 'Online')
                        : aiHealth.status === 'checking'
                          ? (language === 'hi' ? 'जांच जारी...' : 'Connecting...')
                          : (language === 'hi' ? 'ऑफ़लाइन' : 'Offline / Config Pending')}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'स्मार्ट एडु व्यक्तिगत अध्ययन साथी' : 'Personalized Smart Edu Study Mentor'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-[280px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap relative group ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-800/90 text-slate-200 border border-white/10'
                    }`}
                  >
                    {msg.text}

                    {/* Speaker icon for reading Nova text aloud */}
                    {msg.sender === 'nova' && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text, i)}
                        className="absolute -bottom-2 -right-2 p-1 rounded-full bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white transition shadow border border-white/10"
                        title={speakingMsgIndex === i ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingMsgIndex === i ? (
                          <VolumeX className="w-3 h-3 text-amber-300" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Truthful Offline Diagnostic Notice */}
              {aiHealth.status === 'offline' && messages.length <= 1 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">
                      {language === 'hi' ? 'नोवा AI स्थिति: ऑफ़लाइन' : 'Nova AI Status: Offline'}
                    </p>
                    <p className="text-amber-200/80 text-[10px] mt-0.5 leading-relaxed">
                      {aiHealth.message || (language === 'hi'
                        ? 'सर्वर पर GEMINI_API_KEY कॉन्फ़िगर नहीं है। कृपया एनवायरनमेंट सेटिंग्स में GEMINI_API_KEY सेट करें।'
                        : 'GEMINI_API_KEY is not configured or reachable on the server. Please set GEMINI_API_KEY in your deployment environment.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Starter Prompts (English, Hindi, Hinglish) */}
              {messages.length <= 1 && (
                <div className="pt-2 pb-1 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{language === 'hi' ? 'सुझाए गए प्रश्न (Suggested Prompts):' : 'Try Asking Nova:'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedPrompts.map((sp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSend(sp.text)}
                        className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/20 hover:border-cyan-400/50 transition-all text-xs text-slate-200 group flex flex-col gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400/80 group-hover:text-cyan-300">
                            {sp.tag}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <span className="line-clamp-2 leading-relaxed text-[11px] font-medium group-hover:text-white">
                          "{sp.label}"
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 text-xs bg-slate-800/90 text-cyan-300 border border-cyan-500/20 flex items-center gap-2.5 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>{language === 'hi' ? 'नोवा उत्तर तैयार कर रहा है...' : 'Nova is preparing your answer...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Bar (Part 14 & Requirement 8) */}
            <div className="px-4 py-2 border-t border-white/5 bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickActions.map((qa, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(qa.promptText, qa.action)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  {language === 'hi' ? qa.hi : qa.label}
                </button>
              ))}
            </div>

            {/* Prompt Form with Voice Support */}
            <form
              onSubmit={handleFormSubmit}
              className="p-3.5 border-t border-white/10 bg-slate-900/95 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'नोवा से अवधारणा, सूत्र या प्रश्न पूछें...'
                    : 'Ask Nova about a concept, formula, or problem...'
                }
                disabled={isLoading || isListening}
                className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
              />

              {/* Voice Mic Button (Part 18) */}
              <button
                type="button"
                onClick={toggleVoiceListening}
                className={`w-10 h-10 rounded-xl border transition flex items-center justify-center shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-white/10 hover:text-cyan-300 hover:border-cyan-400/40'
                }`}
                title={isListening ? 'Listening... click to cancel' : 'Ask by voice'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/25 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
