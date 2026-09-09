// app/(dashboard)/student/study-plan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { StudyPlan, Subject, Topic, Profile, StudentProfile } from '@/types/database.types';
import { enqueueAction } from '@/lib/offline/db';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Trash2,
  Check,
  Zap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';

export default function StudyPlanPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [savingTask, setSavingTask] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/study-plan');
        return;
      }
      setUserId(user.id);

      const [profRes, studRes, subRes, topRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase.from('subjects').select('*'),
        supabase.from('topics').select('*'),
      ]);

      if (profRes.data) setProfile(profRes.data as Profile);
      if (studRes.data) setStudentProfile(studRes.data as StudentProfile);
      if (subRes.data) setSubjects(subRes.data);
      if (topRes.data) setTopics(topRes.data);
      if (subRes.data && subRes.data.length > 0) setSubjectId(subRes.data[0].id);

      // Load tasks for date
      const { data: planData } = await supabase
        .from('study_plans')
        .select('*, subject:subjects(*), topic:topics(*)')
        .eq('student_id', user.id)
        .eq('plan_date', selectedDate)
        .order('created_at', { ascending: true });

      if (planData) setPlans(planData as StudyPlan[]);
      setLoading(false);
    }

    loadData();
  }, [selectedDate, router, supabase]);

  const toggleTaskComplete = async (plan: StudyPlan) => {
    const newStatus = plan.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id ? { ...p, status: newStatus, completed_at: completedAt } : p
      )
    );

    if (navigator.onLine) {
      await supabase
        .from('study_plans')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', plan.id);
    } else {
      await enqueueAction({
        type: 'COMPLETE_STUDY_TASK',
        payload: { id: plan.id, completed_at: completedAt },
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title) return;
    setSavingTask(true);

    try {
      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          student_id: userId,
          plan_date: selectedDate,
          title,
          description: description || null,
          subject_id: subjectId || null,
          topic_id: topicId || null,
          duration_minutes: durationMinutes,
          priority,
          status: 'pending',
        })
        .select('*, subject:subjects(*), topic:topics(*)')
        .single();

      if (data) {
        setPlans((prev) => [...prev, data as StudyPlan]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSavingTask(false);
    }
  };

  const deleteTask = async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('study_plans').delete().eq('id', id);
  };

  // Generate 7 days strip around the selected date
  const getDaysStrip = () => {
    const curr = new Date(selectedDate);
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      });
    }
    return days;
  };

  const completedCount = plans.filter((p) => p.status === 'completed').length;
  const progressPercent = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;
  const totalMinutes = plans.reduce((acc, p) => acc + (p.duration_minutes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-900/20 via-blue-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 pb-28 md:pb-12">
        <SidebarRail />

        <main className="flex-1 min-w-0 space-y-6">
          {/* Gamification Bar */}
          <GamificationBar
            level={studentProfile?.level || 1}
            currentXp={studentProfile?.xp || 0}
            streakDays={studentProfile?.streak_days || studentProfile?.current_streak || 0}
            coins={studentProfile?.coins || 0}
            totalPoints={studentProfile?.total_points || 0}
          />

        {/* Hero Header & Date Controls */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mission Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Daily Study Planner
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Plan your learning sprints, complete daily missions, and safeguard your study streak.
              </p>
            </div>

            {/* Quick Actions & Date Input */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2 gap-2 text-xs">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
                />
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Mission</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid matching Screen 7 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Month Calendar & Today's Timeline Tasks (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Month Calendar Card matching Screen 7 */}
            <div className="cosmic-card p-5 sm:p-6 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {}}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-black text-white tracking-wide">
                  September 2026
                </h3>
                <button
                  type="button"
                  onClick={() => {}}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Month Dates Grid (Sept 2026 starts on Tuesday, 30 days) */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                <span className="py-1 text-slate-600">30</span>
                <span className="py-1 text-slate-600">31</span>
                {[...Array(30)].map((_, i) => {
                  const day = i + 1;
                  const isSelected = day === 9; // 9 Sep in reference
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {}}
                      className={`py-1.5 rounded-xl transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's Tasks Timeline List matching Screen 7 */}
            <div className="cosmic-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">
                    Today
                  </h4>
                  <div className="text-[11px] text-slate-400 font-medium">Mon, 9 Sep</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                  4 Tasks
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { title: 'Math Practice', time: '10:00 AM', color: 'border-l-blue-500' },
                  { title: 'Physics Revision', time: '12:00 PM', color: 'border-l-cyan-500' },
                  { title: 'Complete Assignment', time: '04:00 PM', color: 'border-l-indigo-500' },
                  { title: 'Quick Quiz', time: '07:00 PM', color: 'border-l-amber-500' },
                ].map((t) => (
                  <div
                    key={t.title}
                    className={`p-3 rounded-2xl bg-slate-800/50 border border-white/5 border-l-4 ${t.color} flex items-center justify-between text-xs`}
                  >
                    <span className="font-bold text-white">{t.title}</span>
                    <span className="text-[11px] font-mono text-slate-400">{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Today's Schedule & 3D Nova Motivation matching Screen 7 (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Today's Schedule Card */}
            <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">
                  Today&apos;s Schedule
                </h3>
                <span className="text-xs text-slate-400 font-medium">Daily Agenda</span>
              </div>

              {/* 4 Agenda Cards with Start buttons */}
              <div className="space-y-3">
                {[
                  {
                    title: 'Math Practice',
                    sub: 'Quadratic Equations',
                    icon: '📐',
                    href: '/student/subjects',
                  },
                  {
                    title: 'Physics Revision',
                    sub: 'Laws of Motion',
                    icon: '⚛',
                    href: '/student/revision',
                  },
                  {
                    title: 'Career Guide',
                    sub: 'Explore opportunities',
                    icon: '🧭',
                    href: '/student/career',
                  },
                  {
                    title: 'Daily Reflection',
                    sub: 'How did you learn today?',
                    icon: '💡',
                    href: '/student',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 transition flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-lg shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                          {item.title}
                        </h4>
                        <div className="text-xs text-slate-400">{item.sub}</div>
                      </div>
                    </div>

                    <Link
                      href={item.href}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
                    >
                      Start
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Nova Robot Motivation Quote Card matching Screen 7 */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 shadow-xl flex items-center gap-5">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-cyan-400/40 shrink-0 bg-slate-950 shadow-lg shadow-cyan-500/20">
                <img
                  src="/images/nova_robot.jpg"
                  alt="Nova Robot Mascot"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Nova Daily Boost
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-200 leading-relaxed italic">
                  &ldquo;Discipline today creates freedom tomorrow.&rdquo;
                </p>
              </div>
            </div>

            {/* Add to Plan Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Plan</span>
            </button>
          </div>
        </div>
      </main>
    </div>

      {/* Quick Add Mission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="cosmic-card w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Schedule New Mission</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Add a focused study goal to your daily agenda.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mission Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Trigonometry Identities"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Review chapter notes and complete practice questions 1-10"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={90}>1.5 Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border transition ${
                        priority === p
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Mission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Nova AI Companion */}
      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />

      <MobileBottomNav />
    </div>
  );
}
