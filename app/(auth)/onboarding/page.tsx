// app/(auth)/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { AcademicClass, Section, Subject } from '@/types/database.types';
import { GraduationCap, ArrowRight, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

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
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

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

      // Update student profile in Supabase
      const { error: spError } = await supabase
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

      if (spError) {
        console.error('Failed to update student profile:', spError);
        setErrorMsg(spError.message || 'Failed to complete onboarding. Please try again.');
        setSaving(false);
        return;
      }

      // Initialize default study plan item for today (non-blocking)
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
        console.warn('Initial study plan item could not be created:', e);
      }

      // Synchronize client auth state
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Personalize Your Learning Journey</h1>
          <p className="text-sm text-slate-500 mt-1">
            Step {step} of 2 — Tell us about your academic goals
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span>1. Academic Information</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Your Class / Grade
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll Number (Optional)
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 104"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition"
                >
                  <span>Next: Learning Goals</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>2. Select Your Learning Goals</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select the targets that matter to you. The system customizes your daily study plan around them.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableGoals.map((goal) => {
                  const active = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition flex items-start gap-2.5 ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          active ? 'text-indigo-600' : 'text-slate-300'
                        }`}
                      />
                      <span>{goal}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={saving}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
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
