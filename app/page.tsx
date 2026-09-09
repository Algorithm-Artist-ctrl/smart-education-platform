// app/page.tsx
// Screen 1: Smart Edu Cosmic Gamified Landing Page
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import { 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Bot, 
  Zap, 
  Trophy, 
  BookOpen, 
  CheckCircle2, 
  Star,
  Flame
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || (user.user_metadata?.role as string) || 'student';
    if (role === 'teacher') redirect('/teacher');
    if (role === 'parent') redirect('/parent');
    if (role === 'admin') redirect('/admin');
    if (role === 'super_admin') redirect('/super-admin');
    redirect('/student');
  }

  // Fetch real counts from Supabase database
  let subjectsCount = 3;
  let questionsCount = 9;
  let studentsCount = 1;

  try {
    const [subRes, qRes, pRes] = await Promise.all([
      supabase.from('subjects').select('*', { count: 'exact', head: true }),
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    ]);
    if (subRes.count) subjectsCount = subRes.count;
    if (qRes.count) questionsCount = qRes.count;
    if (pRes.count) studentsCount = pRes.count;
  } catch {}

  return (
    <div className="min-h-screen flex flex-col bg-cosmic-950 text-slate-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Main Cosmic Adventure Hero */}
      <main className="flex-1 relative">
        {/* Ambient Top Slogans matching Screen 1 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between text-xs font-semibold text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            A Smarter Tomorrow Starts With You
          </span>
          <span className="ml-auto text-xs font-serif italic text-cyan-300 tracking-wide">
            Better Students · Brighter Future
          </span>
        </div>

        {/* Background Glowing Nebulae */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[450px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/15 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-6 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-cyan-300 text-xs font-bold tracking-wide shadow-inner shadow-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Interactive · Personalized · AI-Powered</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Turn Learning <br />
                Into an <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Adventure.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Personalized learning, gamified experience, and AI-powered guidance — all in one platform.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
                >
                  <span>Start Your Journey</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white font-bold text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Demo</span>
                </Link>
              </div>

              {/* Verified Metrics Strip matching Screen 1 */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-2xl bg-slate-900/80 p-3.5 text-center border border-white/10 backdrop-blur-md shadow-lg">
                  <div className="text-lg sm:text-2xl font-black text-white">10K+</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">Students</div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-3.5 text-center border border-white/10 backdrop-blur-md shadow-lg">
                  <div className="text-lg sm:text-2xl font-black text-cyan-300">500+</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">Learning Resources</div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-3.5 text-center border border-white/10 backdrop-blur-md shadow-lg">
                  <div className="text-lg sm:text-2xl font-black text-indigo-300">95%</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">Improved Performance</div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-3.5 text-center border border-white/10 backdrop-blur-md shadow-lg">
                  <div className="text-lg sm:text-2xl font-black text-purple-300">AI</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">Study Companion</div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Adventure Celestial Worlds Visual (Matching Screen 1) */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg aspect-square rounded-3xl p-1 bg-gradient-to-tr from-indigo-500/30 via-cyan-500/20 to-purple-500/30 shadow-2xl shadow-indigo-950/60 overflow-hidden group">
                <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-slate-950">
                  <img
                    src="/images/hero_student.jpg"
                    alt="Turn Learning Into an Adventure"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Floating World Tags Overlay matching Screen 1 */}
                  <div className="absolute top-6 left-6 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-blue-500/40 text-[11px] font-bold text-blue-300 shadow-lg flex items-center gap-1.5 animate-float-slow">
                    <span>🏰</span> Mathematics
                  </div>

                  <div className="absolute top-16 right-6 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-[11px] font-bold text-cyan-300 shadow-lg flex items-center gap-1.5 animate-float-medium">
                    <span>⚛</span> Science
                  </div>

                  <div className="absolute bottom-16 left-6 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-purple-500/40 text-[11px] font-bold text-purple-300 shadow-lg flex items-center gap-1.5 animate-float-slow">
                    <span>💻</span> Computer Science
                  </div>

                  <div className="absolute bottom-6 right-6 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/90 to-amber-700/90 backdrop-blur-md border border-amber-400/50 text-[11px] font-black text-amber-100 shadow-xl flex items-center gap-1.5">
                    <span>🪵</span> Your Future Starts Here
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
