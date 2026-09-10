// app/(dashboard)/student/missions/page.tsx
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
  Globe, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  Award, 
  Send, 
  Camera, 
  BookOpen, 
  Flame, 
  Zap, 
  Loader2,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Profile, StudentProfile, LifeMission, MissionSubmission } from '@/types/database.types';

const LIFE_MISSIONS_CATALOGUE = [
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    title: 'The Surface Friction Test',
    category: 'Physics • Mechanics',
    difficulty: 'Hands-on',
    xpReward: 140,
    coinsReward: 35,
    icon: '⚡',
    summary: 'Test how friction changes across 3 different floors in your home using a single object.',
    steps: [
      'Take a clean shoe or textbook and place it on a smooth tile floor.',
      'Slide it gently with a finger or rubber band to gauge resistance.',
      'Repeat on a rug or carpet, and then on a wooden desk or marble floor.',
      'Record which surface required the most force and explain why microscopic roughness causes resistance.',
    ],
    reflectionPrompt: 'Which surface had the highest resistance? How does this concept explain why race cars use wide rubber tires?',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    title: 'Geometry in the Wild',
    category: 'Mathematics • Geometry',
    difficulty: 'Outdoor',
    xpReward: 120,
    coinsReward: 30,
    icon: '📐',
    summary: 'Observe 5 objects at home or in nature with different geometric shapes and proportions.',
    steps: [
      'Find 5 distinct objects representing circles, cylinders, prisms, or spheres.',
      'Measure their dimensions (diameter, height, or side lengths).',
      'Calculate their area, volume, or aspect ratios.',
      'Document where geometric symmetry appears in human design or organic growth.',
    ],
    reflectionPrompt: 'What geometric shapes did you discover? How does geometry help structural stability in real architecture?',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    title: 'Household Energy Audit',
    category: 'Physics • Energy',
    difficulty: 'Home Investigation',
    xpReward: 150,
    coinsReward: 40,
    icon: '💡',
    summary: 'Track 3 major electrical appliances in your home and calculate their approximate power usage.',
    steps: [
      'Inspect the labels of 3 appliances (e.g. refrigerator, fan, computer/charger).',
      'Record their wattage ratings (W or kW).',
      'Estimate how many hours each runs in a typical day.',
      'Calculate the kilowatt-hours (kWh) consumed daily.',
    ],
    reflectionPrompt: 'Which appliance is the biggest power consumer? What simple adjustment could reduce wasted energy?',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    title: 'Algorithmic Daily Routine',
    category: 'Computer Science • Logic',
    difficulty: 'Logic Challenge',
    xpReward: 130,
    coinsReward: 35,
    icon: '💻',
    summary: 'Write pseudocode or a flowchart describing your morning routine using conditional logic and loops.',
    steps: [
      'Decompose your morning into distinct algorithmic steps from waking up to starting school.',
      'Include at least two IF-THEN-ELSE decision branches (e.g. IF raining THEN take jacket).',
      'Include at least one WHILE loop (e.g. WHILE breakfast not finished...).',
      'Identify any potential infinite loops or edge cases in your algorithm.',
    ],
    reflectionPrompt: 'How does computational thinking help humans organize complex tasks and automate systems?',
  },
];

export default function MissionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [missionsList, setMissionsList] = useState(LIFE_MISSIONS_CATALOGUE);
  const [loading, setLoading] = useState(true);

  // Active submission modal state
  const [activeMission, setActiveMission] = useState<typeof LIFE_MISSIONS_CATALOGUE[0] | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<{ xp: number; coins: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/missions');
        return;
      }

      const [pRes, spRes, subsRes, dbMissionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase.from('mission_submissions').select('*').eq('student_id', user.id),
        supabase.from('life_missions').select('*').order('created_at', { ascending: true }),
      ]);

      if (pRes.data) setProfile(pRes.data as Profile);
      if (spRes.data) setStudentProfile(spRes.data as StudentProfile);
      if (subsRes.data) setSubmissions(subsRes.data as MissionSubmission[]);

      if (dbMissionsRes.data && dbMissionsRes.data.length > 0) {
        // Merge DB missions with UI metadata
        const merged = dbMissionsRes.data.map((dbM: any) => {
          const match = LIFE_MISSIONS_CATALOGUE.find((c) => c.id === dbM.id);
          return {
            id: dbM.id,
            title: dbM.title,
            category: `${dbM.subject_name} • ${dbM.category}`,
            difficulty: match?.difficulty || 'Real-World Task',
            xpReward: dbM.xp_reward || 120,
            coinsReward: dbM.coins_reward || 30,
            icon: match?.icon || '🌍',
            summary: dbM.description || match?.summary || '',
            steps: match?.steps || [dbM.task_prompt || 'Complete the real-world investigation and log your findings.'],
            reflectionPrompt: match?.reflectionPrompt || dbM.task_prompt || 'What did you discover during this investigation?',
          };
        });
        setMissionsList(merged);
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  const isCompleted = (missionId: string) => {
    return submissions.some((s) => s.mission_id === missionId && s.status === 'completed');
  };

  const handleSubmit = async () => {
    if (!activeMission || !reflectionText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/student/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_id: activeMission.id,
          observation_notes: reflectionText.trim(),
          reflection_text: reflectionText.trim(),
          media_url: evidenceUrl.trim() || null,
          evidence_url: evidenceUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessBanner({ xp: data.xpEarned, coins: data.coinsEarned });
        setSubmissions((prev) => [data.submission, ...prev.filter((s) => s.mission_id !== activeMission.id)]);
        setReflectionText('');
        setEvidenceUrl('');
        setActiveMission(null);

        if (studentProfile) {
          setStudentProfile({
            ...studentProfile,
            xp: (studentProfile.xp || 0) + data.xpEarned,
            total_points: (studentProfile.total_points || 0) + data.xpEarned,
            coins: (studentProfile.coins || 0) + data.coinsEarned,
            current_streak: (studentProfile.current_streak || 0) + 1,
          });
        }
      } else {
        alert(data.error || 'Failed to submit mission.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving mission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-emerald-950/30 via-teal-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

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

          {/* Hero Header */}
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-World Application</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Life Missions
                </h1>
                <p className="text-sm text-slate-300 mt-1 max-w-xl">
                  Step away from the screen and observe science, math, and nature in action around your home. Complete missions to earn +75 XP, +20 Coins, and boost your streak!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-center min-w-[110px]">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Completed</span>
                  <span className="text-base font-black text-white">
                    {submissions.length} / {LIFE_MISSIONS_CATALOGUE.length}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center min-w-[110px]">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Streak Boost</span>
                  <span className="text-base font-black text-amber-300">+1 Day 🔥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-4 animate-bounce-short">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Field Observation Verified!</h4>
                  <p className="text-xs text-emerald-300">
                    Earned +{successBanner.xp} XP, +{successBanner.coins} Coins, and extended your streak!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessBanner(null)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Missions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {missionsList.map((m) => {
              const completed = isCompleted(m.id);
              const pastSub = submissions.find((s) => s.mission_id === m.id);

              return (
                <div
                  key={m.id}
                  className={`rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-2xl relative overflow-hidden ${
                    completed
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20'
                      : 'glass-card border-white/10 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                          {m.icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                            {m.category}
                          </span>
                          <h3 className="text-lg font-black text-white">{m.title}</h3>
                        </div>
                      </div>

                      {completed ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold shrink-0">
                          {m.difficulty}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {m.summary}
                    </p>

                    {/* Step-by-Step Instructions */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                        Field Protocol
                      </span>
                      <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-300">
                        {m.steps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            <span className="text-slate-200">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* If completed, show past reflection snippet */}
                    {completed && pastSub && (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-emerald-300 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Your Field Notes
                        </div>
                        <p className="text-[11px] italic text-emerald-100/90 line-clamp-3">
                          "{pastSub.reflection_text}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Rewards Footer */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-emerald-400 font-bold">+{m.xpReward} XP</span>
                      <span className="text-amber-400 font-bold">+{m.coinsReward} 🪙</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMission(m);
                        setReflectionText(pastSub?.reflection_text || '');
                        setEvidenceUrl(pastSub?.evidence_url || '');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                        completed
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <span>{completed ? 'Update Notes' : 'Submit Observation'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submission Modal Drawer */}
          {activeMission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base">
                      {activeMission.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                        {activeMission.category}
                      </span>
                      <h3 className="text-base font-black text-white">{activeMission.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveMission(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-xs text-slate-300">
                  <strong className="text-emerald-400 block mb-1">Key Observation Prompt:</strong>
                  {activeMission.reflectionPrompt}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Field Observation Notes</span>
                    <span className="text-[10px] text-slate-400 font-normal">What actually happened?</span>
                  </label>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    rows={4}
                    placeholder="Describe your setup, measurements, observations, and conclusion..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Evidence Photo URL (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Snapshot link</span>
                  </label>
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://... photo link (optional)"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveMission(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!reflectionText.trim() || submitting}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition ${
                      !reflectionText.trim() || submitting
                        ? 'opacity-50 bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit (+{activeMission.xpReward} XP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />

      <MobileBottomNav />
    </div>
  );
}
