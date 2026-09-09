// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, ArrowRight, Loader2, AlertCircle, Sparkles, Shield, Zap, Lock, Mail } from 'lucide-react';
import { Suspense } from 'react';
import { useAuth } from '@/lib/auth/context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanEmail = email.trim();

    try {
      // 1. Primary: Same-origin Next.js server auth route (immune to CORS preflight & ad-blockers)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (data.success) {
        try {
          await refreshProfile();
        } catch {
          // Cookie is set, continue
        }
        const destination = redirectTo || data.redirectTo || '/student';
        window.location.href = destination;
        return;
      } else {
        setErrorMsg(data.error || 'Invalid email or password. Please check your credentials and try again.');
        setLoading(false);
        return;
      }
    } catch (serverErr: any) {
      console.warn('Server auth endpoint error, trying direct client fallback:', serverErr);

      // 2. Fallback: Direct client-side Supabase signIn
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('invalid login credentials')) {
            setErrorMsg('Invalid email or password. Please check your credentials and try again.');
          } else if (msg.includes('email not confirmed')) {
            setErrorMsg('Your email is not verified yet. Please check your inbox for the verification email.');
          } else {
            setErrorMsg(error.message);
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          const destination = redirectTo || '/student';
          window.location.href = destination;
          return;
        }
      } catch (clientErr: any) {
        console.error('Client auth fallback error:', clientErr);
        setErrorMsg('Unable to connect to the authentication service. Please check your network and try again.');
        setLoading(false);
        return;
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-950/40 via-blue-900/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Left 3D World Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-white/10 bg-gradient-to-br from-slate-950/80 via-indigo-950/30 to-slate-950/80 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-35 mix-blend-screen pointer-events-none">
          <Image
            src="/images/hero_student.jpg"
            alt="Smart Edu Cosmic World"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/60 to-transparent" />
        </div>

        {/* Brand Header */}
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/60 rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block">Smart Edu</span>
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase block -mt-1">
              Learn • Play • Grow
            </span>
          </div>
        </Link>

        {/* Center Quote & Visual Banner */}
        <div className="max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive • Personalized • AI-Powered</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Turn Learning Into an Adventure.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Warp into your learning worlds, complete daily bounty quests, and unlock your potential with Nova AI.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-semibold text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>XP & Badges</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real PostgreSQL Auth</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Smart Education Platform. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 py-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Logo */}
          <div className="lg:hidden text-center mb-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">Smart Edu</span>
            </Link>
          </div>

          {/* Form Card */}
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-6">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                Portal Authentication
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Sign In to Continue</h2>
              <p className="text-xs text-slate-400 mt-1">
                Access your personalized learning worlds, quests, and study streak.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@smartedu.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 active:scale-[0.99] touch-manipulation"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Portal Entry...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Smart Edu Galaxy</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account yet?{' '}
                <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300 ml-1">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060913]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
