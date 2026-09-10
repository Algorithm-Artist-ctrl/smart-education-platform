// app/(auth)/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { AcademicClass, Section } from '@/types/database.types';
import { 
  GraduationCap, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Zap, 
  Target, 
  Compass, 
  Layers, 
  Brain, 
  BookOpen, 
  Headphones, 
  Gamepad2, 
  Palette, 
  HelpCircle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';

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

  // Step 1: Academic & Sector
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [preferredLang, setPreferredLang] = useState<'en' | 'hi'>('en');

  // Step 2: "How Do You Like to Learn?" (Learning Preferences)
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    'visual',
    'practice',
  ]);

  // Step 3: "What Needs Extra Support?" (Support Signals - Non-Clinical)
  const [selectedSupportSignals, setSelectedSupportSignals] = useState<string[]>([
    'remembering',
  ]);
  const [learningPace, setLearningPace] = useState<'steady' | 'fast' | 'thorough'>('steady');

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/onboarding');
        return;
      }

      // Verify user profile and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && profile.role !== 'student') {
        if (profile.role === 'teacher') router.push('/teacher');
        else if (profile.role === 'parent') router.push('/parent');
        else if (profile.role === 'admin') router.push('/admin');
        else if (profile.role === 'super_admin') router.push('/super-admin');
        else router.push('/student');
        return;
      }

      // Check if student has already completed onboarding
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (sp && sp.onboarding_completed) {
        router.push('/student');
        return;
      }

      // Load classes and sections
      const [clsRes, secRes] = await Promise.all([
        supabase.from('classes').select('*').order('grade_level', { ascending: true }),
        supabase.from('sections').select('*'),
      ]);

      if (clsRes.data) setClasses(clsRes.data);
      if (secRes.data) setSections(secRes.data);

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

  const togglePreference = (key: string) => {
    if (selectedPreferences.includes(key)) {
      if (selectedPreferences.length > 1) {
        setSelectedPreferences(selectedPreferences.filter((p) => p !== key));
      }
    } else {
      setSelectedPreferences([...selectedPreferences, key]);
    }
  };

  const toggleSupportSignal = (key: string) => {
    if (selectedSupportSignals.includes(key)) {
      setSelectedSupportSignals(selectedSupportSignals.filter((s) => s !== key));
    } else {
      setSelectedSupportSignals([...selectedSupportSignals, key]);
    }
  };

  const preferenceOptions = [
    {
      id: 'visual',
      label: 'Visual Diagrams & 3D Models',
      sublabel: 'चित्र और विजुअल्स से सीखना',
      icon: Palette,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-cyan-500/40',
    },
    {
      id: 'practice',
      label: 'Problem Solving & Puzzles',
      sublabel: 'प्रॉब्लम्स और पहेलियां हल करके',
      icon: Target,
      gradient: 'from-indigo-500/20 to-purple-500/20',
      border: 'border-indigo-500/40',
    },
    {
      id: 'audio',
      label: 'Audio & Step-by-Step Talks',
      sublabel: 'सुनकर और आवाज से सीखना',
      icon: Headphones,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/40',
    },
    {
      id: 'games',
      label: 'Quests & Interactive Games',
      sublabel: 'गेम्स और चुनौतियों के माध्यम से',
      icon: Gamepad2,
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/40',
    },
    {
      id: 'reading',
      label: 'Deep Reading & Notes',
      sublabel: 'गहन अध्ययन और संक्षिप्त नोट्स',
      icon: BookOpen,
      gradient: 'from-violet-500/20 to-pink-500/20',
      border: 'border-violet-500/40',
    },
    {
      id: 'stories',
      label: 'Real-World Stories & Analogies',
      sublabel: 'कहानियों और वास्तविक उदाहरणों से',
      icon: Compass,
      gradient: 'from-rose-500/20 to-red-500/20',
      border: 'border-rose-500/40',
    },
  ];

  const supportSignalOptions = [
    {
      id: 'mathematics',
      label: 'Step-by-Step Math Calculations',
      sublabel: 'गणित के चरण और सूत्र',
    },
    {
      id: 'reading',
      label: 'Reading Long Academic Passages',
      sublabel: 'लंबे पैराग्राफ को तेजी से समझना',
    },
    {
      id: 'remembering',
      label: 'Remembering Formulas & Rules',
      sublabel: 'फॉर्मूले और नियम याद रखना',
    },
    {
      id: 'concentration',
      label: 'Focus & Concentration Pacing',
      sublabel: 'लंबे समय तक ध्यान केंद्रित रखना',
    },
    {
      id: 'time_management',
      label: 'Time Management in Quizzes',
      sublabel: 'टेस्ट के दौरान समय प्रबंधन',
    },
    {
      id: 'explaining_answers',
      label: 'Explaining Answers in Own Words',
      sublabel: 'अपने शब्दों में उत्तर समझाना',
    },
  ];

  const handleSaveProfile = async (proceedToDiagnostic: boolean = true) => {
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

      // 1. Update Auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            preferred_language: preferredLang,
            learning_preferences: selectedPreferences,
            support_signals: selectedSupportSignals,
            learning_pace: learningPace,
            class_id: classId,
            section_id: sectionId,
          },
        });
      } catch (metaErr) {
        console.warn('Auth user metadata update warning:', metaErr);
      }

      // 2. Persist in student_profiles
      try {
        await supabase
          .from('student_profiles')
          .upsert({
            id: user.id,
            class_id: classId,
            section_id: sectionId,
            roll_number: roll,
            preferred_language: preferredLang,
            learning_preferences: selectedPreferences,
            support_signals: selectedSupportSignals,
            learning_pace: learningPace,
            updated_at: new Date().toISOString(),
          });
      } catch (spError) {
        console.warn('Student profile upsert warning:', spError);
      }

      await refreshProfile();

      if (proceedToDiagnostic) {
        router.push('/student/diagnostic');
      } else {
        router.push('/student');
      }
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

      <div className="w-full max-w-2xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 mb-1">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {step === 1 && 'Initialize Your Academic Orbit'}
            {step === 2 && 'How Do You Like to Learn?'}
            {step === 3 && 'Tailor Your Support Signals'}
            {step === 4 && 'Your Learning Space is Ready!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {step === 1 && 'Step 1 of 4 — Set your grade, section, and language'}
            {step === 2 && 'Step 2 of 4 — Pick your favorite learning styles (Multi-Select)'}
            {step === 3 && 'Step 3 of 4 — Choose areas where Nova can assist you most'}
            {step === 4 && 'Step 4 of 4 — Launch into your Initial Adaptive Diagnostic'}
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-10 h-1.5 rounded-full transition-all duration-300 ${
                  step >= i ? 'bg-cyan-400 shadow-md shadow-cyan-400/50' : 'bg-slate-800'
                }`}
              />
            ))}
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

          {/* STEP 1: Academic & Language */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-white/10">
                <Target className="w-4 h-4" />
                <span>Sector & Academic Details</span>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Primary Learning Language / मुख्य भाषा
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreferredLang('en')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      preferredLang === 'en'
                        ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">English</div>
                      <div className="text-[10px] text-slate-400">All instructions in English</div>
                    </div>
                    {preferredLang === 'en' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredLang('hi')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      preferredLang === 'hi'
                        ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">Hindi (हिंदी)</div>
                      <div className="text-[10px] text-slate-400">सभी निर्देश और व्याख्या हिंदी में</div>
                    </div>
                    {preferredLang === 'hi' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Your Grade / Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium focus:border-cyan-400 outline-none"
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium focus:border-cyan-400 outline-none"
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs font-medium placeholder:text-slate-500 focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Continue to Learning Style</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: "How Do You Like to Learn?" */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-white/10">
                <Brain className="w-4 h-4" />
                <span>Learning Preferences (Select All That Apply)</span>
              </div>

              <p className="text-xs text-slate-300">
                Smart Edu personalizes each lesson to match your style. Tell us how concepts click best for you:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preferenceOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedPreferences.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => togglePreference(opt.id)}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? `bg-gradient-to-br ${opt.gradient} ${opt.border} text-white shadow-lg ring-1 ring-cyan-400/50`
                          : 'bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected ? 'bg-cyan-500 border-cyan-400 text-white' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.sublabel}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-md shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Support Signals</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Support Signals & Pacing */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 pb-2 border-b border-white/10">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Support Signals & Pacing (Non-Clinical)</span>
              </div>

              <p className="text-xs text-slate-300">
                Where would you like Nova to provide extra hints, visual breakdowns, or smaller practice sets?
              </p>

              <div className="space-y-2">
                {supportSignalOptions.map((sig) => {
                  const isSelected = selectedSupportSignals.includes(sig.id);
                  return (
                    <button
                      key={sig.id}
                      type="button"
                      onClick={() => toggleSupportSignal(sig.id)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{sig.label}</div>
                        <div className="text-[10px] text-slate-400">{sig.sublabel}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold' : 'border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pacing selection */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Preferred Learning Pace
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'steady', label: 'Steady & Deep', desc: 'मजबूत समझ' },
                    { id: 'fast', label: 'Fast Explorer', desc: 'तेज गति' },
                    { id: 'thorough', label: 'Step-by-Step', desc: 'कदम-दर-कदम' },
                  ].map((pace) => (
                    <button
                      key={pace.id}
                      type="button"
                      onClick={() => setLearningPace(pace.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        learningPace === pace.id
                          ? 'bg-blue-600/30 border-cyan-400 text-white font-bold'
                          : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs">{pace.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{pace.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-md shadow-cyan-500/25 transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Review Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Ready to Launch Initial Diagnostic */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 border border-cyan-400/40 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/30">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Your Personal Learning Orbit is Formed!</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  Nova has configured your learning preferences and support signals. Now, take a brief 5-question adaptive diagnostic to map your current baseline mastery.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Language:</span>
                  <span className="font-bold text-cyan-300">{preferredLang === 'hi' ? 'Hindi (हिंदी)' : 'English'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Learning Styles:</span>
                  <span className="font-bold text-white capitalize">{selectedPreferences.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Support Signals:</span>
                  <span className="font-bold text-amber-300 capitalize">{selectedSupportSignals.join(', ') || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pacing:</span>
                  <span className="font-bold text-white capitalize">{learningPace}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveProfile(true)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white text-xs font-black rounded-xl shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Configuring Learning Space...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Initial Diagnostic Assessment (+100 XP)</span>
                      <Zap className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveProfile(false)}
                  className="text-xs text-slate-400 hover:text-white transition underline cursor-pointer"
                >
                  Skip diagnostic for now and enter Student Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
