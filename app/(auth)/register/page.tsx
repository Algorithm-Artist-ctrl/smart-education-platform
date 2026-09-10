// app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, ArrowRight, Loader2, AlertCircle, CheckCircle2, Sparkles, User, Mail, Lock, Shield } from 'lucide-react';
import { UserRole } from '@/types/database.types';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and try again.');
      setLoading(false);
      return;
    }

    try {
      // 1. Primary: Same-origin Next.js server register route (immune to CORS preflight & ad-blockers)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.hasSession) {
          window.location.href = data.redirectTo || (role === 'student' ? '/student' : `/${role}`);
          return;
        } else {
          setSuccessMsg(
            'Account created successfully! Redirecting to login...'
          );
          setTimeout(() => {
            window.location.href = `/login?registered=true&email=${encodeURIComponent(email.trim())}`;
          }, 1200);
          return;
        }
      } else {
        setErrorMsg(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
    } catch (serverErr: any) {
      console.warn('Server registration error, trying direct client fallback:', serverErr);

      // 2. Fallback: Direct client-side Supabase signUp
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role,
            },
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            setErrorMsg('An account with this email already exists. Please sign in.');
          } else {
            setErrorMsg(error.message);
          }
          setLoading(false);
          return;
        }

        if (data.session) {
          window.location.href = role === 'student' ? '/onboarding' : `/${role}`;
          return;
        }

        setSuccessMsg(
          'Account created! If email confirmation is enabled, please verify your email before logging in.'
        );
        setLoading(false);
      } catch (clientErr: any) {
        console.error('Client registration fallback error:', clientErr);
        setErrorMsg('Unable to connect to registration service. Please try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-950/40 via-purple-900/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Left 3D Visual Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-white/10 bg-gradient-to-br from-slate-950/80 via-indigo-950/30 to-slate-950/80 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-35 mix-blend-screen pointer-events-none">
          <Image
            src="/images/learning_map_worlds.jpg"
            alt="Smart Edu Learning Worlds"
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
              Join the Galaxy
            </span>
          </div>
        </Link>

        {/* Hero Copy */}
        <div className="max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cadet Enrollment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Begin Your Learning Quest.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Create your account to unlock interactive 3D subject worlds, personalized AI tutoring with Nova, and competitive class leaderboards.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free Forever Plan</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>+100 Bonus Coins</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Smart Education Platform. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 py-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">Smart Edu</span>
            </Link>
          </div>

          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-5">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                New Cadet Registration
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Create Your Account</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose your role and enter your details to launch your experience.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role Selector Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'student', label: 'Student' },
                    { id: 'teacher', label: 'Teacher' },
                    { id: 'parent', label: 'Parent' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id as UserRole)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition border capitalize ${
                        role === r.id
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/80 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
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

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 active:scale-[0.99] touch-manipulation mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling Cadet...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300 ml-1">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
