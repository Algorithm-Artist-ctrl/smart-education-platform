// app/(dashboard)/student/portfolio/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import { 
  Sparkles, 
  Award, 
  Printer, 
  Layers, 
  Globe, 
  CheckCircle2, 
  Flame, 
  Star, 
  BookOpen, 
  Palette, 
  Heart,
  TrendingUp,
  Brain,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Profile, StudentProfile, TopicMastery, CreativitySubmission, MissionSubmission } from '@/types/database.types';

export default function PortfolioPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [masteries, setMasteries] = useState<TopicMastery[]>([]);
  const [creativitySubs, setCreativitySubs] = useState<CreativitySubmission[]>([]);
  const [missionSubs, setMissionSubs] = useState<MissionSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/portfolio');
        return;
      }

      const [pRes, spRes, mRes, cRes, msRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('topic_mastery')
          .select('*, topic:topics(*, subject:subjects(*))')
          .eq('student_id', user.id)
          .order('mastery_score', { ascending: false }),
        supabase
          .from('creativity_submissions')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mission_submissions')
          .select('*, mission:life_missions(*)')
          .eq('student_id', user.id)
          .order('submitted_at', { ascending: false }),
      ]);

      if (pRes.data) setProfile(pRes.data as Profile);
      if (spRes.data) setStudentProfile(spRes.data as StudentProfile);
      if (mRes.data) setMasteries((mRes.data || []) as any[]);
      if (cRes.data) setCreativitySubs((cRes.data || []) as any[]);
      if (msRes.data) setMissionSubs((msRes.data || []) as any[]);
      setLoading(false);
    }

    loadPortfolio();
  }, [router, supabase]);

  const masteredTopics = masteries.filter((m) => m.mastery_score >= 70 || m.status === 'mastered' || m.status === 'proficient');

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background cosmic illumination */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-blue-950/30 via-indigo-900/10 to-transparent blur-3xl pointer-events-none -z-10 print:hidden" />

      <div className="print:hidden">
        <Navbar profile={profile} />
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 pb-28 md:pb-12 print:p-0">
        <div className="print:hidden">
          <SidebarRail />
        </div>

        <main className="flex-1 min-w-0 space-y-6">
          <div className="print:hidden">
            <GamificationBar
              level={studentProfile?.level || 1}
              currentXp={studentProfile?.xp || 0}
              streakDays={studentProfile?.streak_days || studentProfile?.current_streak || 0}
              coins={studentProfile?.coins || 0}
              totalPoints={studentProfile?.total_points || 0}
            />
          </div>

          {/* Portfolio Hero Header */}
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 shadow-2xl relative overflow-hidden print:border-black print:bg-white print:text-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 print:text-black">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verified Learner Portfolio</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight print:text-black">
                  {profile?.full_name || 'Explorer'}'s Learning Portfolio
                </h1>
                <p className="text-sm text-slate-300 mt-1 print:text-gray-700 max-w-xl">
                  A holistic record of conceptual understanding, creative visual models, and hands-on real-world investigations.
                </p>
              </div>

              <div className="flex items-center gap-3 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>Export / Print</span>
                </button>
              </div>
            </div>

            {/* Profile Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 print:border-gray-300">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-gray-100 print:text-black">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Mastered Topics</span>
                <span className="text-xl font-black text-white print:text-black">{masteredTopics.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-gray-100 print:text-black">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Creative Visuals</span>
                <span className="text-xl font-black text-purple-400 print:text-black">{creativitySubs.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-gray-100 print:text-black">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Life Missions</span>
                <span className="text-xl font-black text-emerald-400 print:text-black">{missionSubs.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-gray-100 print:text-black">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Consistency Streak</span>
                <span className="text-xl font-black text-amber-400 print:text-black">
                  {studentProfile?.streak_days || studentProfile?.current_streak || 0} Days 🔥
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Learning Preferences & Strengths */}
          <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl space-y-4 print:border-gray-300 print:bg-white print:text-black">
            <h3 className="text-base font-bold text-white flex items-center gap-2 print:text-black">
              <Brain className="w-5 h-5 text-indigo-400" />
              Learning Preferences & Support Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-gray-50 space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Learning Modality
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(studentProfile?.learning_preferences || ['Visual diagrams', 'Step-by-step practice']).map((pref, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold print:text-black">
                      {pref}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-gray-50 space-y-1.5">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Demonstrated Strengths
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(studentProfile?.strengths || ['Calculus', 'Optics', 'Logical Reasoning']).map((st, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold print:text-black">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 print:bg-gray-50 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Pacing Calibration
                </span>
                <span className="text-xs font-semibold text-slate-200 capitalize print:text-black">
                  {studentProfile?.learning_pace || 'Steady Paced'} progression with adaptive hints
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Verified Conceptual Masteries */}
          <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl space-y-4 print:border-gray-300 print:bg-white print:text-black">
            <h3 className="text-base font-bold text-white flex items-center gap-2 print:text-black">
              <Award className="w-5 h-5 text-amber-400" />
              Verified Topic Masteries ({masteredTopics.length})
            </h3>

            {masteredTopics.length === 0 ? (
              <p className="text-xs text-slate-400">
                Topics will appear here once you achieve 70%+ score or proficiency rating.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {masteredTopics.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between gap-3 print:bg-gray-50"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                        {m.topic?.subject?.name || 'Academic Core'}
                      </span>
                      <h4 className="text-xs font-bold text-white print:text-black">{m.topic?.name || 'Topic Mastery'}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-emerald-400 print:text-black">
                        {m.mastery_score}%
                      </span>
                      <span className="text-[10px] text-slate-400 block capitalize">{m.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Creativity Lab Gallery */}
          <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl space-y-4 print:border-gray-300 print:bg-white print:text-black">
            <h3 className="text-base font-bold text-white flex items-center gap-2 print:text-black">
              <Palette className="w-5 h-5 text-purple-400" />
              Visual Conceptual Explanations ({creativitySubs.length})
            </h3>

            {creativitySubs.length === 0 ? (
              <p className="text-xs text-slate-400">
                Sketches and visual analogies from the Creativity Lab will automatically be archived here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {creativitySubs.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl bg-slate-950 border border-white/10 p-3 flex flex-col justify-between gap-2 shadow-lg print:border-gray-300"
                  >
                    <div className="aspect-video w-full rounded-xl bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center">
                      {sub.canvas_data ? (
                        <img
                          src={sub.canvas_data}
                          alt="Creative submission"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">Visual proof</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1 print:text-black">{sub.prompt}</h4>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 italic print:text-gray-700">
                        "{sub.explanation_text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Real-World Life Missions */}
          <div className="cosmic-card p-6 rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl space-y-4 print:border-gray-300 print:bg-white print:text-black">
            <h3 className="text-base font-bold text-white flex items-center gap-2 print:text-black">
              <Globe className="w-5 h-5 text-emerald-400" />
              Real-World Life Missions Completed ({missionSubs.length})
            </h3>

            {missionSubs.length === 0 ? (
              <p className="text-xs text-slate-400">
                Field observations completed in the Life Missions hub will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {missionSubs.map((ms) => (
                  <div
                    key={ms.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-white/5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 print:bg-gray-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white print:text-black">
                          {ms.mission?.title || (ms.mission_id ? ms.mission_id.replace('mission-', '').split('-').join(' ').toUpperCase() : 'Real-World Mission')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic print:text-gray-700">
                        "{ms.observation_notes || ms.reflection_text}"
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(ms.submitted_at || ms.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="print:hidden">
        <NovaAICompanion
          studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
          level={studentProfile?.level || 1}
        />
        <MobileBottomNav />
      </div>
    </div>
  );
}
