// components/gamification/NovaAICompanion.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/context';
import { 
  Sparkles, 
  X, 
  Send, 
  ArrowRight, 
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  Brain,
  Lightbulb
} from 'lucide-react';
import AIPartnerSettingsModal from './AIPartnerSettingsModal';

interface NovaAICompanionProps {
  partnerName?: string;
  weakTopicName?: string | null;
  studentName?: string;
  recommendedSubject?: string;
  level?: number;
  compact?: boolean;
  mode?: 'inline' | 'floating' | 'both';
  className?: string;
}

export default function NovaAICompanion({
  partnerName = 'Nova',
  weakTopicName,
  studentName = 'Cadet',
  recommendedSubject = 'Mathematics',
  level = 1,
  compact = false,
  mode = 'both',
  className = '',
}: NovaAICompanionProps) {
  const { language } = useI18n();
  const [currentPartnerName, setCurrentPartnerName] = useState(partnerName);
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);
  const [aiHealth, setAiHealth] = useState<{ status: 'checking' | 'online' | 'offline'; message?: string; model?: string }>({ status: 'checking' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync partnerName prop
  useEffect(() => {
    if (partnerName && partnerName !== 'Nova') {
      setCurrentPartnerName(partnerName);
    }
  }, [partnerName]);

  // Fetch student's custom AI profile on mount to hydrate partner name
  useEffect(() => {
    let isMounted = true;
    async function loadAIProfile() {
      try {
        const res = await fetch('/api/student/ai-profile');
        const data = await res.json();
        if (isMounted && data.success && data.profile?.ai_partner_name) {
          setCurrentPartnerName(data.profile.ai_partner_name);
        }
      } catch (err) {
        // Fallback silently to prop or 'Nova'
      }
    }
    loadAIProfile();
    return () => { isMounted = false; };
  }, []);

  // Listen for global updates (e.g. when user changes partner name in settings or setup modal)
  useEffect(() => {
    const handlePartnerUpdated = (e: any) => {
      if (e.detail?.partnerName) {
        setCurrentPartnerName(e.detail.partnerName);
      }
    };
    window.addEventListener('ai-partner-updated', handlePartnerUpdated);
    return () => window.removeEventListener('ai-partner-updated', handlePartnerUpdated);
  }, []);

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
          setAiHealth({ status: 'offline', message: 'Unable to connect to AI partner service' });
        }
      }
    }
    checkHealth();
    return () => { isMounted = false; };
  }, []);

  // Dynamically resolve active topic from weak topic, subject, or recent conversation
  const resolvedTopic = weakTopicName || (recommendedSubject ? `${recommendedSubject} concepts` : 'Core Concepts');

  // Dynamic suggested prompt chips tailored to the student's personal partner & topic
  const suggestedPrompts = [
    { text: `What is ${resolvedTopic}?`, label: `What is ${resolvedTopic}?`, tag: "Concept" },
    { text: `Why am I learning ${resolvedTopic}? Where is it used in real life?`, label: `Why learn ${resolvedTopic}?`, tag: "Real World" },
    { text: `Bhai ${currentPartnerName} ${resolvedTopic} simple way me samjha de`, label: `Bhai simple way me samjha de`, tag: "Casual" },
    { text: `Give me a practice problem on ${resolvedTopic}`, label: `Practice problem on ${resolvedTopic}`, tag: "Practice" },
  ];

  // Specialized interactive learning modes including "Why am I learning this?"
  const quickActions = [
    { label: 'Why learn this?', promptText: "Why am I learning this topic? What is its authentic real-world connection, and how is it used in technology, science, or daily life?", hi: 'हम यह क्यों सीख रहे हैं?', action: 'why_am_i_learning_this' },
    { label: 'Explain simply', promptText: "Can you explain this simply and clearly with no jargon?", hi: 'सरल भाषा में समझाएं', action: 'explain_simple' },
    { label: 'Explain with example', promptText: "Can you give me a memorable real-world example of this concept?", hi: 'उदाहरण देकर समझाएं', action: 'example' },
    { label: 'Give me a hint', promptText: "Give me a small hint to guide my thinking without giving away the answer.", hi: 'एक संकेत दें', action: 'hint' },
    { label: 'Practice question', promptText: "Give me one practice question on this topic with multiple-choice options.", hi: 'एक अभ्यास प्रश्न दें', action: 'practice' },
    { label: 'Quiz me', promptText: "Quiz me with 3 quick questions to thoroughly test my understanding.", hi: 'मेरी परीक्षा लें', action: 'quiz' },
    { label: 'Explain visually', promptText: "Explain this using vivid mental imagery, diagrams, or visual analogies.", hi: 'चित्रों व दृश्य रूप में समझाएं', action: 'visual' },
    { label: 'Step-by-step', promptText: "Walk me through the complete step-by-step solution for this.", hi: 'चरण-दर-चरण समाधान', action: 'step_by_step' },
    { label: 'Challenge me', promptText: "Give me a high-order thinking challenge or hard question on this concept.", hi: 'कठिन चुनौती दें', action: 'challenge' },
    { label: 'Why am I wrong?', promptText: "Can you explain the common misconception here and why this approach might be wrong?", hi: 'मेरी गलती क्या है?', action: 'misconception' },
    { label: 'Revise topic', promptText: "Give me a 3-point quick revision summary and key formulas for this topic.", hi: 'संक्षेप में दोहराएं', action: 'revise' },
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
      ? `नमस्ते ${studentName}! मैं ${currentPartnerName} हूँ। मैंने देखा कि आप "${weakTopicName}" में सुधार कर सकते हैं। क्या हम इसे साथ में समझें या 1 अभ्यास प्रश्न हल करें?`
      : `नमस्ते ${studentName}! मैं ${currentPartnerName} हूँ, आपका व्यक्तिगत AI अध्ययन साथी। मुझसे ${recommendedSubject}, फॉर्मूले या होमवर्क के बारे में कुछ भी पूछें!`
    : weakTopicName
      ? `Hi ${studentName}! I'm ${currentPartnerName}, your personal AI learning partner. I noticed you could boost your mastery on "${weakTopicName}". Ready to explore it together or try a quick practice question?`
      : `Greetings ${studentName}! I'm ${currentPartnerName}, your personal AI learning partner. Ask me anything about ${recommendedSubject}, homework problems, or formulas you'd like to understand!`;

  const [messages, setMessages] = useState<Array<{ sender: 'nova' | 'user'; text: string }>>([
    {
      sender: 'nova',
      text: initialGreeting,
    },
  ]);
  const [inputVal, setInputVal] = useState('');

  // Update greeting text if currentPartnerName changes and user hasn't chatted yet
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'nova') {
      setMessages([{ sender: 'nova', text: initialGreeting }]);
    }
  }, [currentPartnerName, language, weakTopicName, studentName, recommendedSubject]);

  // Listen for open events (including optional custom prompts)
  useEffect(() => {
    const handleOpen = (e: any) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        // Pre-fill and trigger send
        handleSend(e.detail.prompt);
      }
    };
    window.addEventListener('open-nova-mentor', handleOpen);
    return () => window.removeEventListener('open-nova-mentor', handleOpen);
  }, [messages, isLoading]);

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
            partnerName: currentPartnerName,
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
              ? `${currentPartnerName} अभी उपलब्ध नहीं है। कृपया पुनः प्रयास करें।`
              : `${currentPartnerName} is temporarily unavailable. Please try again.`),
          },
        ]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request cleanly cancelled
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: 'nova',
          text: language === 'hi'
            ? `${currentPartnerName} अभी उपलब्ध नहीं है। कृपया पुनः प्रयास करें।`
            : `${currentPartnerName} is temporarily unavailable. Please try again.`,
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
                    alt={`${currentPartnerName} Avatar`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-slate-950 rounded-full ${
                aiHealth.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`} />
            </div>

            {/* Dialogue & CTA */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1 truncate">
                  {currentPartnerName}
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
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
              <span>{language === 'hi' ? `${currentPartnerName} से पूछें` : `Ask ${currentPartnerName}`}</span>
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
          title={language === 'hi' ? `${currentPartnerName} से बात करें` : `Chat with ${currentPartnerName}`}
        >
          <div className="w-9 h-9 rounded-full relative overflow-hidden bg-slate-950 border border-white/20">
            <Image
              src="/images/nova_robot.jpg"
              alt={currentPartnerName}
              fill
              className="object-cover"
            />
          </div>
          <span className="hidden sm:inline-block pr-2 text-xs font-black text-white tracking-wide max-w-[120px] truncate">
            {currentPartnerName}
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
                <div className="w-10 h-10 rounded-xl relative overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-md shadow-cyan-500/30 shrink-0">
                  <Image
                    src="/images/nova_robot.jpg"
                    alt={currentPartnerName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="truncate max-w-[180px]">{currentPartnerName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                      aiHealth.status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : aiHealth.status === 'checking'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {aiHealth.status === 'online'
                        ? (language === 'hi' ? 'ऑनलाइन' : 'ONLINE')
                        : aiHealth.status === 'checking'
                          ? (language === 'hi' ? 'जांच जारी...' : 'CONNECTING...')
                          : (language === 'hi' ? 'अस्थायी रूप से अनुपलब्ध' : 'TEMPORARILY UNAVAILABLE')}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'hi' ? 'स्मार्ट एडु व्यक्तिगत अध्ययन साथी' : 'Personalized Smart Edu Study Mentor'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition cursor-pointer"
                  title="Customize AI Partner Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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

              {/* Truthful Diagnostic Notice */}
              {aiHealth.status === 'offline' && messages.length <= 1 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">
                      {language === 'hi' ? `${currentPartnerName} स्थिति: अस्थायी रूप से अनुपलब्ध` : `${currentPartnerName} Status: Temporarily Unavailable`}
                    </p>
                    <p className="text-amber-200/80 text-[10px] mt-0.5 leading-relaxed">
                      {aiHealth.message || (language === 'hi'
                        ? 'सर्वर पर GEMINI_API_KEY कॉन्फ़िगर नहीं है। कृपया Render एनवायरनमेंट सेटिंग्स में GEMINI_API_KEY सेट करें।'
                        : 'GEMINI_API_KEY is not configured or reachable on the server. Please set GEMINI_API_KEY in your deployment environment.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Starter Prompts */}
              {messages.length <= 1 && (
                <div className="pt-2 pb-1 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{language === 'hi' ? 'सुझाए गए प्रश्न:' : `Try Asking ${currentPartnerName}:`}</span>
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
                    <span>{language === 'hi' ? `${currentPartnerName} उत्तर तैयार कर रहा है...` : `${currentPartnerName} is preparing your answer...`}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions Bar with all 10 specialized learning interaction modes */}
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
                    ? `${currentPartnerName} से अवधारणा, सूत्र या प्रश्न पूछें...`
                    : `Ask ${currentPartnerName} about a concept, formula, or problem...`
                }
                disabled={isLoading || isListening}
                className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-50"
              />

              {/* Voice Mic Button */}
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

      {/* Embedded Settings Modal */}
      {isSettingsOpen && (
        <AIPartnerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onUpdated={(newName) => setCurrentPartnerName(newName)}
        />
      )}
    </>
  );
}
