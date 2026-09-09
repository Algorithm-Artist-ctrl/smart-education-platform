// app/(dashboard)/student/career/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CareerProfile, QuizAttempt, Profile, StudentProfile } from '@/types/database.types';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  Compass, 
  Briefcase, 
  Code, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  Save, 
  Info,
  TrendingUp,
  Award,
  Zap,
  Globe,
  Check,
  ArrowRight,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';

export default function CareerGuidancePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableInterests = [
    'Software Engineering & Web Apps',
    'AI & Machine Learning Research',
    'Data Science & Analytics',
    'Aerospace & Mechanical Engineering',
    'Robotics & Automation',
    'Medicine & Bioengineering',
    'Financial Modeling & Quant Trading',
    'Digital Product Design & UI/UX',
    'Cybersecurity & Network Defense',
  ];

  const availableSkills = [
    'Python Programming',
    'Mathematical Problem Solving',
    'Calculus & Linear Algebra',
    'Logical & Algorithmic Reasoning',
    'Physics Modeling',
    'Critical Thinking & Analysis',
    'Data Visualization',
    'System Architecture',
  ];

  const careerRoadmaps = [
    {
      title: 'Software Engineer',
      matchScore: 95,
      category: 'Computer Science',
      salaryRange: '$95k - $160k',
      requiredSubjects: ['Mathematics', 'Computer Science'],
      description: 'Architect scalable web systems, APIs, and cloud infrastructure powering modern applications.',
      topSkills: ['Python Programming', 'System Architecture', 'Algorithmic Reasoning'],
      growthRate: '+25% (High Match)',
    },
    {
      title: 'Data Scientist',
      matchScore: 88,
      category: 'Data & Analytics',
      salaryRange: '$110k - $185k',
      requiredSubjects: ['Mathematics', 'Computer Science'],
      description: 'Extract actionable insights, statistical patterns, and predictive predictive machine learning models.',
      topSkills: ['Statistics', 'Python Programming', 'Data Analytics'],
      growthRate: '+30% (High Match)',
    },
    {
      title: 'AI/ML Engineer',
      matchScore: 82,
      category: 'Artificial Intelligence',
      salaryRange: '$120k - $210k',
      requiredSubjects: ['Mathematics', 'Physics', 'Computer Science'],
      description: 'Develop neural networks, multimodal foundation models, and autonomous intelligent agents.',
      topSkills: ['Calculus & Linear Algebra', 'Python Programming', 'Logical & Algorithmic Reasoning'],
      growthRate: '+38% (Good Match)',
    },
  ];

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/career');
        return;
      }

      const [profRes, studRes, careerRes, attemptRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase.from('career_profiles').select('*').eq('student_id', user.id).maybeSingle(),
        supabase.from('quiz_attempts').select('*, assessment:assessments(*)').eq('student_id', user.id),
      ]);

      if (profRes.data) setProfile(profRes.data as Profile);
      if (studRes.data) setStudentProfile(studRes.data as StudentProfile);

      if (careerRes.data) {
        setCareerProfile(careerRes.data as CareerProfile);
        setInterests(careerRes.data.interests || ['Software Engineering & Web Apps', 'AI & Machine Learning Research']);
        setSkills(careerRes.data.skills || ['Python Programming', 'Mathematical Problem Solving']);
      } else {
        // Defaults
        setInterests(['Software Engineering & Web Apps', 'AI & Machine Learning Research']);
        setSkills(['Python Programming', 'Mathematical Problem Solving', 'Logical & Algorithmic Reasoning']);
      }

      if (attemptRes.data) {
        setAttempts(attemptRes.data as QuizAttempt[]);
      }
      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSkill = (item: string) => {
    setSkills((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    try {
      await supabase.from('career_profiles').upsert({
        student_id: user.id,
        interests,
        skills,
        updated_at: new Date().toISOString(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-950/20 via-blue-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

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

        {/* Hero Header matching Screen 9 */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Career Galaxy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Career Galaxy
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Discover your path, based on your interests and strengths.
              </p>
            </div>

            {/* Save Action */}
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Preferences Saved!' : 'Save Career Preferences'}</span>
            </button>
          </div>
        </div>

        {/* Interests Pills matching Screen 9 */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Your Interests
          </div>
          <div className="flex flex-wrap gap-2">
            {['Technology', 'Problem Solving', 'Innovation'].map((item) => {
              const isSelected = interests.includes(item) || true;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleInterest(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Selectors: Interests Cloud & Skills Cloud */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interests Cloud */}
          <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Your Core Fields of Interest</span>
              </h3>
              <span className="text-xs font-mono text-cyan-300 font-semibold">
                {interests.length} Selected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tap the technology fields and domains you are passionate about exploring:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {availableInterests.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills Cloud */}
          <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Key Competencies & Target Skills</span>
              </h3>
              <span className="text-xs font-mono text-indigo-300 font-semibold">
                {skills.length} Selected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Select technical disciplines and analytical skills you want to level up:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {availableSkills.map((item) => {
                const isSelected = skills.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSkill(item)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recommended Career Tracks Matching Screen 9 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Recommended Career Pathways</span>
            </h3>
            <span className="text-xs text-slate-400">Algorithmic Match Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {careerRoadmaps.map((career, idx) => (
              <div
                key={career.title}
                className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Top glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                      {career.category}
                    </span>

                    {/* Match percentage pill */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>{career.matchScore}% Match</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition">
                      {career.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {career.description}
                    </p>
                  </div>

                  {/* Compensation & Growth */}
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Expected Salary:</span>
                      <strong className="text-white font-mono">{career.salaryRange}</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                      <span>Growth Trend:</span>
                      <span>{career.growthRate}</span>
                    </div>
                  </div>

                  {/* Required Foundation Subjects */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Foundational Sectors
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {career.requiredSubjects.map((sub) => (
                        <span
                          key={sub}
                          className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="pt-5 mt-5 border-t border-white/5">
                  <Link
                    href="/student/map"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-white/5"
                  >
                    <span>View Curriculum Requirements</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* 3D Visual Artwork Banner matching Screen 9 */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-64 sm:h-80 flex flex-col justify-end p-6 sm:p-8 group mt-6">
            <img
              src="/images/hero_student.jpg"
              alt="Future Career Galaxy"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-md">
                <p className="text-base sm:text-xl font-bold text-white italic drop-shadow-md">
                  &ldquo;The best way to predict the future is to create it.&rdquo;
                </p>
                <p className="text-xs text-cyan-300 font-semibold mt-1">
                  Connect your classroom milestones directly to world-changing careers.
                </p>
              </div>

              <Link
                href="/student/map"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 active:scale-95 transition-all"
              >
                <span>Explore Careers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        </main>
      </div>

      {/* Floating Nova AI Companion */}
      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />

      <MobileBottomNav />
    </div>
  );
}
