// app/(dashboard)/student/career/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CareerProfile, QuizAttempt } from '@/types/database.types';
import Navbar from '@/components/shared/Navbar';
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
  Award
} from 'lucide-react';

export default function CareerGuidancePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const availableInterests = [
    'Software Engineering & Web Development',
    'Data Science & Artificial Intelligence',
    'Mechanical & Aerospace Engineering',
    'Medical & Health Sciences',
    'Financial Modeling & Economics',
    'Digital Product Design & UX',
  ];

  const availableSkills = [
    'Python Programming',
    'Mathematical Problem Solving',
    'Logical Reasoning',
    'Critical Thinking',
    'Physics Analysis',
    'Communication & Technical Writing',
  ];

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const [careerRes, attemptRes] = await Promise.all([
        supabase.from('career_profiles').select('*').eq('student_id', user.id).single(),
        supabase.from('quiz_attempts').select('*, assessment:assessments(*)').eq('student_id', user.id),
      ]);

      if (careerRes.data) {
        setProfile(careerRes.data as CareerProfile);
        setInterests(careerRes.data.interests || []);
        setSkills(careerRes.data.skills || []);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <Compass className="w-4 h-4" />
              <span>Personalized Career & Skill Pathway</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Career Guidance & Readiness</h1>
            <p className="text-sm text-slate-500 mt-1">
              Data-backed recommendations based on your subject strengths and technical aspirations.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Saved to Supabase!' : 'Save Preferences'}</span>
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Disclaimer:</strong> Career insights and skill matching are algorithmic advisory recommendations designed to help guide your study priorities; they do not guarantee admission or employment outcomes.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interests Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>1. Technical & Academic Interests</span>
            </h3>
            <div className="space-y-2">
              {availableInterests.map((item) => {
                const active = interests.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleInterest(item)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item}</span>
                    <CheckCircle2
                      className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-300'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Skills Verified */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600" />
              <span>2. Core Competencies & Skills</span>
            </h3>
            <div className="space-y-2">
              {availableSkills.map((item) => {
                const active = skills.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleSkill(item)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                      active
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item}</span>
                    <CheckCircle2
                      className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-300'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Career Guidance Cards */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Personalized Recommendations & Career Matches
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40">
              <div className="text-xs font-bold text-indigo-700 uppercase">Top Field Match</div>
              <h4 className="text-base font-bold text-slate-900 mt-1">Full-Stack & Cloud Systems</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Matches your interest in programming and database logic. Continue with Python and SQL practice modules.
              </p>
              <div className="mt-4 pt-3 border-t border-indigo-100 text-[11px] text-indigo-600 font-semibold">
                Suggested Project: Student Portal API
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40">
              <div className="text-xs font-bold text-emerald-700 uppercase">Skill Gap Identified</div>
              <h4 className="text-base font-bold text-slate-900 mt-1">Advanced Statistics & Calculus</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Strengthening mathematical problem-solving will accelerate your data science and engineering pathways.
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-100 text-[11px] text-emerald-600 font-semibold">
                Suggested Topic: Quadratic & Differential Equations
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/40">
              <div className="text-xs font-bold text-amber-700 uppercase">Interview Readiness</div>
              <h4 className="text-base font-bold text-slate-900 mt-1">Algorithmic Problem Solving</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Take timed practice quizzes in Computer Science to build fluency with algorithmic time complexities.
              </p>
              <div className="mt-4 pt-3 border-t border-amber-100 text-[11px] text-amber-600 font-semibold">
                Suggested Tool: Practice Quiz Engine
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
