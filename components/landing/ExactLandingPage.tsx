// components/landing/ExactLandingPage.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronDown, 
  Gamepad2, 
  User, 
  Bot, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Rocket, 
  Check,
} from 'lucide-react';

interface ExactLandingPageProps {
  stats?: {
    studentsCount?: number;
    subjectsCount?: number;
    questionsCount?: number;
  };
}

export default function ExactLandingPage({ stats }: ExactLandingPageProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'HI', label: 'Hindi (हिंदी)' },
    { code: 'ES', label: 'Spanish (Español)' },
    { code: 'FR', label: 'French (Français)' },
    { code: 'DE', label: 'German (Deutsch)' },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-white selection:bg-indigo-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* DESKTOP & TABLET: 16:9 EXACT COMPOSITION MATCHING media_1788977316918.jpg */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-full min-h-screen relative bg-[#060913] items-center justify-center p-0">
        
        {/* Master 16:9 Canvas */}
        <div className="relative w-full max-w-[1920px] aspect-[16/9] max-h-screen overflow-hidden shadow-2xl bg-black">
          
          {/* Base High-Resolution Artwork */}
          <img
            src="/images/landing_exact.jpg"
            alt="Smart Edu - Turn Learning Into an Adventure"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          />

          {/* ===================================================================== */}
          {/* INTERACTIVE HOTSPOTS & HOVER LAYERS */}
          {/* ===================================================================== */}

          {/* 1. TOP NAVBAR OVERLAYS */}
          {/* Logo click target */}
          <Link
            href="/"
            className="absolute top-[2.4%] left-[3.2%] w-[15%] h-[6.5%] rounded-xl z-20 hover:bg-white/5 transition-colors cursor-pointer"
            title="Smart Edu - Home"
          />

          {/* Nav Links */}
          <Link
            href="/"
            className="absolute top-[3.2%] left-[27.6%] w-[4.4%] h-[4.8%] rounded-lg z-20 hover:bg-cyan-500/10 transition-colors cursor-pointer"
            title="Home"
          />
          <Link
            href="/student/map"
            className="absolute top-[3.2%] left-[32.4%] w-[5.6%] h-[4.8%] rounded-lg z-20 hover:bg-white/5 transition-colors cursor-pointer"
            title="Features"
          />
          <Link
            href="/student"
            className="absolute top-[3.2%] left-[38.4%] w-[6.8%] h-[4.8%] rounded-lg z-20 hover:bg-white/5 transition-colors cursor-pointer"
            title="For Students"
          />
          <Link
            href="/teacher"
            className="absolute top-[3.2%] left-[45.6%] w-[6.8%] h-[4.8%] rounded-lg z-20 hover:bg-white/5 transition-colors cursor-pointer"
            title="For Teachers"
          />
          <Link
            href="/parent"
            className="absolute top-[3.2%] left-[52.8%] w-[6.2%] h-[4.8%] rounded-lg z-20 hover:bg-white/5 transition-colors cursor-pointer"
            title="For Parents"
          />
          <Link
            href="/admin"
            className="absolute top-[3.2%] left-[59.4%] w-[7.8%] h-[4.8%] rounded-lg z-20 hover:bg-white/5 transition-colors cursor-pointer"
            title="For Institutions"
          />
          <Link
            href="/student/career"
            className="absolute top-[3.2%] left-[67.6%] w-[4.6%] h-[4.8%] rounded-lg z-20 hover:bg-white/5 transition-colors cursor-pointer"
            title="About Smart Edu"
          />

          {/* Language Selector Dropdown */}
          <div className="absolute top-[3.0%] left-[75.0%] w-[5.5%] h-[5.2%] z-30">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="w-full h-full rounded-full hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              title="Change Language"
            />
            {langMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl z-50 text-xs font-semibold space-y-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLang(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition ${
                      currentLang === lang.code ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log In Button Overlay */}
          <Link
            href="/login"
            className="absolute top-[3.0%] left-[81.8%] w-[6.8%] h-[5.2%] rounded-full z-20 hover:ring-2 hover:ring-white/30 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Log In to Smart Edu"
          />

          {/* Sign Up Button Overlay */}
          <Link
            href="/register"
            className="absolute top-[3.0%] left-[89.2%] w-[7.4%] h-[5.2%] rounded-full z-20 hover:ring-2 hover:ring-purple-400/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95 transition-all cursor-pointer"
            title="Create Smart Edu Account"
          />

          {/* 2. HERO CALL TO ACTION BUTTONS */}
          {/* Start Your Journey Button */}
          <Link
            href="/register"
            className="absolute top-[60.2%] left-[3.6%] w-[17.6%] h-[7.8%] rounded-full z-20 hover:ring-2 hover:ring-cyan-300/80 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] active:scale-95 transition-all cursor-pointer flex items-center justify-center group"
            title="Start Your Learning Journey Now"
          >
            <span className="sr-only">Start Your Journey</span>
          </Link>

          {/* Explore Demo Button */}
          <Link
            href="/student"
            className="absolute top-[60.2%] left-[22.2%] w-[14.2%] h-[7.8%] rounded-full z-20 hover:ring-2 hover:ring-white/40 hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Explore Interactive Student Demo"
          >
            <span className="sr-only">Explore Demo</span>
          </Link>

          {/* 3. VERIFIED METRICS HOTSPOTS (Hover Tooltips & Glows) */}
          <div
            className="absolute top-[71.2%] left-[3.6%] w-[9.0%] h-[8.2%] rounded-2xl z-20 hover:bg-cyan-500/10 hover:ring-1 hover:ring-cyan-400/40 transition-all cursor-pointer"
            title="10,000+ Active Students Learning Worldwide"
          />
          <div
            className="absolute top-[71.2%] left-[12.8%] w-[10.8%] h-[8.2%] rounded-2xl z-20 hover:bg-indigo-500/10 hover:ring-1 hover:ring-indigo-400/40 transition-all cursor-pointer"
            title="500+ Curated Gamified Learning Resources"
          />
          <div
            className="absolute top-[71.2%] left-[23.8%] w-[11.4%] h-[8.2%] rounded-2xl z-20 hover:bg-purple-500/10 hover:ring-1 hover:ring-purple-400/40 transition-all cursor-pointer"
            title="95% Observed Academic Performance Improvement"
          />
          <div
            className="absolute top-[71.2%] left-[35.4%] w-[10.4%] h-[8.2%] rounded-2xl z-20 hover:bg-blue-500/10 hover:ring-1 hover:ring-blue-400/40 transition-all cursor-pointer"
            title="Nova AI 24/7 Adaptive Study Companion"
          />

          {/* 4. CELESTIAL ISLANDS SUBJECT PORTALS */}
          {/* π Mathematics Island */}
          <Link
            href="/student/map"
            className="absolute top-[23.8%] left-[46.5%] w-[11.6%] h-[5.2%] rounded-full z-20 hover:ring-2 hover:ring-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] active:scale-95 transition-all cursor-pointer"
            title="Explore Mathematics World (Citadel of Numbers)"
          />

          {/* ⚛ Science Island */}
          <Link
            href="/student/map"
            className="absolute top-[28.3%] left-[79.0%] w-[9.8%] h-[5.2%] rounded-full z-20 hover:ring-2 hover:ring-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] active:scale-95 transition-all cursor-pointer"
            title="Explore Science World (Orbital Laboratory)"
          />

          {/* </> Computer Science Island */}
          <Link
            href="/student/map"
            className="absolute top-[44.8%] left-[72.0%] w-[13.5%] h-[5.2%] rounded-full z-20 hover:ring-2 hover:ring-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.8)] active:scale-95 transition-all cursor-pointer"
            title="Explore Computer Science World (Cybernetic Tower)"
          />

          {/* Your Future Starts Here Wooden Sign */}
          <Link
            href="/student/career"
            className="absolute top-[49.2%] left-[82.2%] w-[11.2%] h-[16.8%] rounded-2xl z-20 hover:ring-2 hover:ring-amber-400/80 hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] active:scale-95 transition-all cursor-pointer"
            title="Your Future Starts Here - Career Galaxy"
          />

          {/* 5. BOTTOM 4 FEATURE CARDS */}
          {/* Card 1: Gamified Learning */}
          <Link
            href="/student/quests"
            className="absolute top-[83.0%] left-[3.6%] w-[22.2%] h-[11.8%] rounded-3xl z-20 hover:ring-2 hover:ring-cyan-400/60 hover:bg-cyan-500/10 active:scale-98 transition-all cursor-pointer"
            title="Gamified Learning - Turn study into an exciting journey"
          />

          {/* Card 2: Personalized Paths */}
          <Link
            href="/student/map"
            className="absolute top-[83.0%] left-[26.4%] w-[22.2%] h-[11.8%] rounded-3xl z-20 hover:ring-2 hover:ring-indigo-400/60 hover:bg-indigo-500/10 active:scale-98 transition-all cursor-pointer"
            title="Personalized Paths - Learn at your own pace"
          />

          {/* Card 3: AI Study Mentor */}
          <Link
            href="/student/revision"
            className="absolute top-[83.0%] left-[49.6%] w-[22.6%] h-[11.8%] rounded-3xl z-20 hover:ring-2 hover:ring-purple-400/60 hover:bg-purple-500/10 active:scale-98 transition-all cursor-pointer"
            title="AI Study Mentor - Your always-available guide"
          />

          {/* Card 4: Brighter Future */}
          <Link
            href="/student/career"
            className="absolute top-[83.0%] left-[73.0%] w-[22.6%] h-[11.8%] rounded-3xl z-20 hover:ring-2 hover:ring-blue-400/60 hover:bg-blue-500/10 active:scale-98 transition-all cursor-pointer"
            title="Brighter Future - Build skills for tomorrow"
          />

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE & TABLET RESPONSIVE VIEW (< 1024px) */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full min-h-screen flex flex-col bg-[#060913]">
        
        {/* Mobile Header */}
        <header className="px-4 py-4 flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-600/40">
              🎓
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block leading-none">Smart Edu</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Learn · Play · Grow</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/15 text-xs font-semibold text-slate-200"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
            >
              Sign Up
            </Link>
          </div>
        </header>

        {/* Mobile Hero Visual */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950">
          <img
            src="/images/landing_exact.jpg"
            alt="Smart Edu Hero"
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-transparent" />
        </div>

        {/* Mobile Hero Content */}
        <div className="px-5 py-6 space-y-6 flex-1 -mt-8 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive · Personalized · AI-Powered</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Turn Learning Into an{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                Adventure.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Personalized learning, gamified experience, and AI-powered guidance — all in one platform.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/register"
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-xs shadow-xl shadow-indigo-600/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/student"
              className="w-full py-3.5 rounded-full bg-slate-900/90 border border-white/20 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <span>Explore Demo</span>
            </Link>
          </div>

          {/* 4 Metrics Strip */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-base font-black text-white">{stats?.studentsCount || '10K+'}</div>
                <div className="text-[10px] text-slate-400 font-semibold">Students</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-base font-black text-white">500+</div>
                <div className="text-[10px] text-slate-400 font-semibold">Resources</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <div className="text-base font-black text-white">95%</div>
                <div className="text-[10px] text-slate-400 font-semibold">Performance</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 font-black text-xs">
                AI
              </div>
              <div>
                <div className="text-base font-black text-white">Nova AI</div>
                <div className="text-[10px] text-slate-400 font-semibold">Companion</div>
              </div>
            </div>
          </div>

          {/* 4 Bottom Feature Cards on Mobile */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <Link
              href="/student/quests"
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-4 hover:border-cyan-500/40 transition block"
            >
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">Gamified Learning</h4>
                <p className="text-[11px] text-slate-400">Turn study into an exciting journey</p>
              </div>
            </Link>

            <Link
              href="/student/map"
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-4 hover:border-indigo-500/40 transition block"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">Personalized Paths</h4>
                <p className="text-[11px] text-slate-400">Learn at your own pace</p>
              </div>
            </Link>

            <Link
              href="/student/revision"
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-4 hover:border-purple-500/40 transition block"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">AI Study Mentor</h4>
                <p className="text-[11px] text-slate-400">Your always-available guide</p>
              </div>
            </Link>

            <Link
              href="/student/career"
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-4 hover:border-blue-500/40 transition block"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">Brighter Future</h4>
                <p className="text-[11px] text-slate-400">Build skills for tomorrow</p>
              </div>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
