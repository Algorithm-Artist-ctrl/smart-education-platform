// app/(auth)/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { AcademicClass, Section, Subject } from '@/types/database.types';
import { GraduationCap, ArrowRight, CheckCircle2, Loader2, Sparkles, AlertCircle, Check, Zap, Target, BookOpen } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Database options
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // User form states
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Score > 90% in upcoming Exams',
    'Daily Disciplined Study Routine'
  ]);

  const availableGoals = [
    'Score > 90% in upcoming Exams',
    'Master Foundations in Mathematics',
    'Understand Physics Practical Concepts',
    'Learn Computer Programming & Logic',
    'Daily Disciplined Study Routine',
    'Revise Weak Areas Quickly',
  ];

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/onboarding');
        return;
      }

      // 1. Verify user profile and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && profile.role !== 'student') {
        if (profile.role === 'teacher') router.push('/teacher');
        else if (profile.role === 'parent') router.push('/parent');
        else if (profile.role === 'admin') router.push('/admin');
        else if (profile.role === 'super_admin') router.push('/super-admin');
        else router.push('/student');
        return;
      }

      // 2. Check if student has already finished onboarding
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (sp && sp.onboarding_completed) {
        router.push('/student');
        return;
      }

      // 3. Load classes, sections, subjects
      const [clsRes, secRes, subRes] = await Promise.all([
        supabase.from('classes').select('*').order('grade_level', { ascending: true }),
        supabase.from('sections').select('*'),
        supabase.from('subjects').select('*'),
      ]);

      if (clsRes.data) setClasses(clsRes.data);
      if (secRes.data) setSections(secRes.data);
      if (subRes.data) setSubjects(subRes.data);

      if (clsRes.data && clsRes.data.length > 0) {
        setSelectedClass(clsRes.data[0].id);
      }
      if (secRes.data && secRes.data.length > 0) {
        setSelectedSection(secRes.data[0].id);
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    setErrorMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const classId = selectedClass && selectedClass.trim() !== '' ? selectedClass.trim() : null;
      const sectionId = selectedSection && selectedSection.trim() !== '' ? selectedSection.trim() : null;
      const roll = rollNumber && rollNumber.trim() !== '' ? rollNumber.trim() : null;

      // 1. Update auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            onboarding_completed: true,
            class_id: classId,
            section_id: sectionId,
            learning_goals: selectedGoals,
          },
        });
      } catch (metaErr) {
        console.warn('Auth user metadata update warning:', metaErr);
      }

      // 2. Update student profile in Supabase table
      try {
        await supabase
          .from('student_profiles')
          .upsert({
            id: user.id,
            class_id: classId,
            section_id: sectionId,
            roll_number: roll,
            learning_goals: selectedGoals,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          });
      } catch (spError) {
        console.warn('Student profile upsert warning:', spError);
      }

      // Initialize default study plan item for today
      try {
        await supabase.from('study_plans').insert({
          student_id: user.id,
          plan_date: new Date().toISOString().split('T')[0],
          title: 'Take Initial Diagnostic Assessment',
          description: 'Complete baseline subject evaluations to tailor your personalized study plan.',
          duration_minutes: 20,
          priority: 'high',
          status: 'pending',
        });
      } catch (e) {
        console.warn('Initial study plan item creation warning:', e);
      }

      await refreshProfile();
      router.push('/student');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060913]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-950/40 via-purple-900/20 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Initialize Cadet Profile</h1>
          <p className="text-xs text-slate-400">
            Step {step} of 2 — Configure your academic sector & personal objectives
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className={`w-12 h-1.5 rounded-full transition-all ${
              step >= 1 ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-slate-800'
            }`} />
            <div className={`w-12 h-1.5 rounded-full transition-all ${
              step >= 2 ? 'bg-indigo-500 shadow-md shadow-indigo-500/50' : 'bg-slate-800'
            }`} />
          </div>
        </div>

        {/* Card */}
        <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 pb-2 border-b border-white/10">
                <Target className="w-4 h-4" />
                <span>Sector & Academic Details</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Your Grade / Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id} className="bg-slate-900 text-white">
                      {cls.name} (Grade {cls.grade_level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium focus:border-indigo-500 outline-none"
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id} className="bg-slate-900 text-white">
                        Section {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-4"
              >
                <span>Continue to Learning Goals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 pb-2 border-b border-white/10">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Target Objectives</span>
              </div>

              <p className="text-xs text-slate-300">
                Select your primary academic goals so Nova can recommend personalized practice sets:
              </p>

              <div className="space-y-2.5">
                {availableGoals.map((goal) => {
                  const isSelected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-400/40 shadow-lg shadow-indigo-950/40'
                          : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{goal}</span>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition ${
                        isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  Back
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleFinishOnboarding}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Launching Orbit...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Claim +100 XP</span>
                      <Zap className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
