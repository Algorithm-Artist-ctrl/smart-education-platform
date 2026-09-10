// components/landing/ExactLandingPage.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  ArrowRight, 
  Globe, 
  ChevronDown, 
  Gamepad2, 
  User, 
  Bot, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Rocket, 
  Check,
  Atom,
  Code
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
    <div className="min-h-screen bg-[#060913] text-white selection:bg-indigo-500 selection:text-white flex flex-col justify-between relative overflow-x-hidden font-sans">
      
      {/* ========================================================================= */}
      {/* 3D CELESTIAL BACKGROUND ARTWORK LAYER (Behind & Alongside content) */}
      {/* ========================================================================= */}
      <div className="absolute top-0 right-0 w-full lg:w-[60%] h-full z-0 pointer-events-none overflow-hidden select-none">
        {/* The 3D Student Explorer gazing out at floating fantasy islands */}
        <Image
          src="/images/hero_student.jpg"
          alt="Smart Edu 3D World"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          quality={80}
          className="object-cover object-center lg:object-right opacity-90"
        />
        {/* Smooth Dark Gradient Overlays to preserve absolute text readability on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060913] via-[#060913]/90 lg:via-[#060913]/65 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#060913] via-[#060913]/80 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#060913] via-[#060913]/95 to-transparent" />
      </div>

      {/* Subtle Cosmic Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP HEADER / NAVBAR (Crisp HTML Elements) */}
      {/* ========================================================================= */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between relative z-30">
        
        {/* Brand Logo */}
        <Link href="/" prefetch={false} className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
            🎓
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black tracking-tight text-white block leading-none">
              Smart Edu
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-wider">
              Learn · Play · Grow
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          <Link
            href="/"
            prefetch={false}
            className="text-cyan-400 font-semibold relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400 after:rounded-full after:shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          >
            Home
          </Link>
          <Link
            href="/student/map"
            prefetch={false}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            Features
          </Link>
          <Link
            href="/student"
            prefetch={false}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            For Students
          </Link>
          <Link
            href="/teacher"
            prefetch={false}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            For Teachers
          </Link>
          <Link
            href="/parent"
            prefetch={false}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            For Parents
          </Link>
          <Link
            href="/admin"
            prefetch={false}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            For Institutions
          </Link>
          <Link
            href="/student/career"
            prefetch={false}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            About
          </Link>
        </nav>

        {/* Right Header Controls: Language, Log In, Sign Up */}
        <div className="flex items-center gap-3">
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{languages.find(l => l.code === currentLang)?.label.split(' ')[0]}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setCurrentLang(lang.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      currentLang === lang.code
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log In Button */}
          <Link
            href="/login"
            prefetch={false}
            className="px-4 sm:px-5 py-2 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-white/15 hover:border-white/30 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer active:scale-95"
          >
            Log In
          </Link>

          {/* Sign Up Button */}
          <Link
            href="/register"
            prefetch={false}
            className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition active:scale-95 cursor-pointer"
          >
            Sign Up
          </Link>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* MAIN HERO CONTENT (Crisp, High-Contrast Typography & Real Controls) */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col justify-center py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Area (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 max-w-2xl">
              
              {/* Feature Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Interactive · Personalized · AI-Powered</span>
              </div>

              {/* Razor-Sharp Main Heading */}
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
                Turn <br />
                Learning Into <br />
                an{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                  Adventure.
                </span>
              </h1>

              {/* Crisp Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-normal max-w-xl">
                Personalized learning, gamified experience, and AI-powered guidance — all in one platform.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/register"
                  prefetch={false}
                  className="px-7 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer group"
                >
                  <span>Start Your Journey</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/student"
                  prefetch={false}
                  className="px-6 sm:px-7 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-slate-200 hover:text-white font-bold text-sm backdrop-blur-md hover:border-white/40 transition-all cursor-pointer"
                >
                  <span>Explore Demo</span>
                </Link>
              </div>

              {/* 4 Verified Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-4 max-w-xl">
                
                {/* 10K+ Students */}
                <div className="p-3 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-md flex items-center gap-2.5 hover:border-cyan-500/40 transition">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-white leading-tight">
                      {stats?.studentsCount ? `${stats.studentsCount}+` : '10K+'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold">Students</div>
                  </div>
                </div>

                {/* 500+ Learning Resources */}
                <div className="p-3 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-md flex items-center gap-2.5 hover:border-indigo-500/40 transition">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-white leading-tight">500+</div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Resources</div>
                  </div>
                </div>

                {/* 95% Improved Performance */}
                <div className="p-3 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-md flex items-center gap-2.5 hover:border-purple-500/40 transition">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-white leading-tight">95%</div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Performance</div>
                  </div>
                </div>

                {/* AI Study Companion */}
                <div className="p-3 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-md flex items-center gap-2.5 hover:border-blue-500/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs shrink-0">
                    AI
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-white leading-tight">Nova AI</div>
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Companion</div>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Interactive 3D Subject Island Badges (5 Cols on Desktop) */}
            <div className="lg:col-span-5 relative min-h-[380px] hidden lg:block select-none">
              
              {/* Mathematics Island Portal */}
              <Link
                href="/student/map"
                prefetch={false}
                className="absolute top-[12%] left-[8%] px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-blue-500/50 text-blue-300 text-xs font-bold shadow-lg shadow-blue-500/20 backdrop-blur-md hover:scale-105 hover:border-blue-400 transition cursor-pointer flex items-center gap-1.5 group"
                title="Mathematics World"
              >
                <span className="font-mono text-cyan-400 font-black">π</span>
                <span>Mathematics</span>
              </Link>

              {/* Science Island Portal */}
              <Link
                href="/student/map"
                prefetch={false}
                className="absolute top-[24%] right-[6%] px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-500/20 backdrop-blur-md hover:scale-105 hover:border-cyan-400 transition cursor-pointer flex items-center gap-1.5 group"
                title="Science World"
              >
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span>Science</span>
              </Link>

              {/* Computer Science Island Portal */}
              <Link
                href="/student/map"
                prefetch={false}
                className="absolute bottom-[36%] left-[28%] px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-purple-500/50 text-purple-300 text-xs font-bold shadow-lg shadow-purple-500/20 backdrop-blur-md hover:scale-105 hover:border-purple-400 transition cursor-pointer flex items-center gap-1.5 group"
                title="Computer Science World"
              >
                <Code className="w-3.5 h-3.5 text-purple-400" />
                <span>Computer Science</span>
              </Link>

              {/* Wooden Signpost: Your Future Starts Here */}
              <Link
                href="/student/career"
                prefetch={false}
                className="absolute bottom-[10%] right-[4%] px-4 py-3 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs font-extrabold shadow-2xl shadow-amber-950/50 backdrop-blur-md hover:scale-105 hover:border-amber-400 transition cursor-pointer flex flex-col items-center justify-center text-center group"
                title="Your Future Starts Here - Career Galaxy"
              >
                <span className="text-[11px] leading-tight">Your Future</span>
                <span className="text-xs font-black text-amber-100 flex items-center gap-1 mt-0.5">
                  Starts Here
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

            </div>

          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 4 BOTTOM FEATURE CARDS (Crisp HTML Glass Cards) */}
      {/* ========================================================================= */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Gamified Learning */}
          <Link
            href="/student/quests"
            prefetch={false}
            className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl flex items-center gap-3.5 shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Gamified Learning
              </h4>
              <p className="text-xs text-slate-400 truncate">
                Turn study into an exciting journey
              </p>
            </div>
          </Link>

          {/* Card 2: Personalized Paths */}
          <Link
            href="/student/map"
            prefetch={false}
            className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 backdrop-blur-xl flex items-center gap-3.5 shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Personalized Paths
              </h4>
              <p className="text-xs text-slate-400 truncate">
                Learn at your own pace
              </p>
            </div>
          </Link>

          {/* Card 3: AI Study Mentor */}
          <Link
            href="/student/revision"
            prefetch={false}
            className="p-4 rounded-3xl bg-slate-900/80 border border-purple-500/20 hover:border-purple-500/40 backdrop-blur-xl flex items-center gap-3.5 shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                AI Study Mentor
              </h4>
              <p className="text-xs text-slate-400 truncate">
                Your always-available guide
              </p>
            </div>
          </Link>

          {/* Card 4: Brighter Future */}
          <Link
            href="/student/career"
            prefetch={false}
            className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-blue-500/40 backdrop-blur-xl flex items-center gap-3.5 shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Brighter Future
              </h4>
              <p className="text-xs text-slate-400 truncate">
                Build skills for tomorrow
              </p>
            </div>
          </Link>

        </div>
      </footer>

    </div>
  );
}
