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
        {/* Background Glowing Nebulae */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[450px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/15 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
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
                Transform everyday study into an exciting journey across interactive 3D subject worlds. Powered by real-time diagnostics and your personal Nova AI study mentor.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Start Your Journey</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-slate-200 hover:text-white font-bold text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Demo</span>
                </Link>
              </div>

              {/* Verified Metrics Strip */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-3 text-center border border-white/5">
                  <div className="text-lg sm:text-xl font-black text-white">{studentsCount}+</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Students</div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center border border-white/5">
                  <div className="text-lg sm:text-xl font-black text-cyan-300">{subjectsCount}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Core Worlds</div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center border border-white/5">
                  <div className="text-lg sm:text-xl font-black text-indigo-300">{questionsCount}+</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Quests & MCQs</div>
                </div>
                <div className="glass-card rounded-xl p-3 text-center border border-white/5">
                  <div className="text-lg sm:text-xl font-black text-purple-300">Nova AI</div>
                  <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Study Companion</div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Adventure Celestial Worlds Visual (Matching Screen 1) */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg aspect-square rounded-3xl p-1 bg-gradient-to-tr from-indigo-500/20 via-cyan-500/30 to-purple-500/20 shadow-2xl shadow-indigo-950/60">
                <div className="w-full h-full rounded-[23px] bg-slate-950/90 p-6 flex flex-col justify-between relative overflow-hidden border border-white/10">
                  {/* Floating Glowing Path */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none" />

                  {/* Celestial Islands Showcase */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="glass-card rounded-2xl px-3.5 py-2 border border-blue-500/30 shadow-lg shadow-blue-500/20 flex items-center gap-2 animate-float-slow">
                      <span className="text-lg">🏰</span>
                      <div>
                        <div className="text-[10px] uppercase font-black text-blue-400">World 1</div>
                        <div className="text-xs font-bold text-white">Mathematics</div>
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl px-3.5 py-2 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 flex items-center gap-2 animate-float-medium">
                      <span className="text-lg">⚛</span>
                      <div>
                        <div className="text-[10px] uppercase font-black text-cyan-400">World 2</div>
                        <div className="text-xs font-bold text-white">Physics</div>
                      </div>
                    </div>
                  </div>

                  {/* Central Adventurer & Nova Gateway */}
                  <div className="relative z-10 my-auto text-center py-6">
                    <div className="inline-block relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-1 shadow-2xl shadow-indigo-500/40 animate-float-slow">
                        <div className="w-full h-full bg-slate-950 rounded-[20px] flex flex-col items-center justify-center text-white">
                          <Bot className="w-10 h-10 text-cyan-400 animate-pulse" />
                          <span className="text-[10px] font-black uppercase text-cyan-300 mt-1">Nova AI</span>
                        </div>
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/40 text-[11px] font-bold text-indigo-200">
                        "Your Future Starts Here"
                      </div>
                    </div>
                  </div>

                  {/* Bottom Subject Island */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="glass-card rounded-2xl px-3.5 py-2 border border-purple-500/30 shadow-lg shadow-purple-500/20 flex items-center gap-2 animate-float-slow">
                      <span className="text-lg">💻</span>
                      <div>
                        <div className="text-[10px] uppercase font-black text-purple-400">World 3</div>
                        <div className="text-xs font-bold text-white">Computer Science</div>
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl px-3.5 py-2 border border-amber-500/30 shadow-lg shadow-amber-500/20 flex items-center gap-2 animate-float-medium">
                      <span className="text-lg">🏛️</span>
                      <div>
                        <div className="text-[10px] uppercase font-black text-amber-400">Gateway</div>
                        <div className="text-xs font-bold text-white">Career Galaxy</div>
                      </div>
                    </div>
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
