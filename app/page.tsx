// app/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import { 
  Sparkles, 
  BrainCircuit, 
  Target, 
  CalendarCheck, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  CheckCircle2,
  TrendingUp,
  BookOpen
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
      .single();

    const role = profile?.role || 'student';
    if (role === 'teacher') redirect('/teacher');
    if (role === 'parent') redirect('/parent');
    if (role === 'admin') redirect('/admin');
    if (role === 'super_admin') redirect('/super-admin');
    redirect('/student');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-indigo-50/20">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Adaptive Education Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Learn <span className="text-indigo-600">Effectively</span>, Flexibly, and at Your Own Natural Pace.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The student is at the center. Our real-time diagnostic engine identifies exactly where you struggle, creates daily study plans, and turns weak topics into mastery.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition flex items-center justify-center"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Quick Metrics / Features */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Diagnostic Tests</h4>
                <p className="text-xs text-slate-500">Accurate baseline analysis</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <Target className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Weak Area Alerts</h4>
                <p className="text-xs text-slate-500">Auto-targeted revision</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <CalendarCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Smart Planner</h4>
                <p className="text-xs text-slate-500">Dynamic daily goals</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">PostgreSQL RLS</h4>
                <p className="text-xs text-slate-500">Enterprise data privacy</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Built for the Complete Education Ecosystem
              </h2>
              <p className="mt-2 text-slate-600 text-sm">
                Empowering students, teachers, parents, and administrators with role-specific views.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Student Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold mb-4">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Student Experience</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Personalized learning path, interactive quizzes, automated weak-topic detection, streaks, XP points, and offline-first queue.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Adaptive practice quizzes</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Daily smart study planner</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Gamified badges and streaks</li>
                  </ul>
                </div>
              </div>

              {/* Teacher Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold mb-4">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Teacher Command Center</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Manage classes, create assignments, upload curriculum lessons, monitor topic-level performance, and grade submissions.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time class analytics</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Assignment & quiz authoring</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Student support intervention</li>
                  </ul>
                </div>
              </div>

              {/* Parent & Admin Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Parent & Admin Governance</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    Strict Row Level Security guarantees parents view only authorized child progress, while administrators manage institutions and subjects.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified child performance</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Attendance tracking</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Institution audit logging</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Smart Education Platform. Connected to Supabase PostgreSQL with Row Level Security.</p>
        </div>
      </footer>
    </div>
  );
}
