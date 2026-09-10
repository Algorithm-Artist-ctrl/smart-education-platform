// app/(dashboard)/student/quests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  Sparkles, 
  Flame, 
  Coins, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Gift, 
  Clock, 
  Loader2, 
  Award,
  Check
} from 'lucide-react';
import { Profile, StudentProfile, Quest } from '@/types/database.types';

export default function QuestsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly'>('all');

  const supabase = createClient();

  useEffect(() => {
    async function loadQuests() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/quests');
        return;
      }

      const [profRes, studRes, questsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase.from('quests').select('*').order('created_at', { ascending: true }),
      ]);

      if (profRes.data) setProfile(profRes.data as Profile);
      if (studRes.data) setStudentProfile(studRes.data as StudentProfile);

      setQuests((questsRes.data || []) as Quest[]);
      setLoading(false);
    }

    loadQuests();
  }, [router, supabase]);

  const handleClaim = async (quest: Quest) => {
    if (!profile || claimingId) return;
    setClaimingId(quest.id);

    try {
      // Optimistic update
      setQuests((prev) =>
        prev.map((q) => (q.id === quest.id ? { ...q, is_claimed: true, status: 'completed', completed_at: new Date().toISOString() } : q))
      );

      // Increment student coins and XP
      if (studentProfile) {
        const rewardCoins = quest.coin_reward ?? quest.coins_reward ?? 25;
        const newCoins = (studentProfile.coins ?? 100) + rewardCoins;
        const newXp = (studentProfile.total_points ?? studentProfile.xp ?? 0) + quest.xp_reward;
        setStudentProfile({
          ...studentProfile,
          coins: newCoins,
          total_points: newXp,
          xp: newXp,
        });

        await supabase
          .from('student_profiles')
          .update({
            coins: newCoins,
            total_points: newXp,
          })
          .eq('id', profile.id);
      }

      // Mark quest claimed
      await supabase
        .from('quests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percent: 100
        })
        .eq('id', quest.id);
    } catch (err) {
      console.error('Failed to claim quest:', err);
    } finally {
      setClaimingId(null);
    }
  };

  const filteredQuests = activeTab === 'all'
    ? quests
    : quests.filter((q) => q.quest_type === activeTab);

  const completedCount = quests.filter((q) => q.is_completed).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Gamification Bar */}
        <GamificationBar
          level={studentProfile?.level || 1}
          currentXp={studentProfile?.xp || 0}
          streakDays={studentProfile?.streak_days || 0}
          coins={studentProfile?.coins ?? 100}
          totalPoints={studentProfile?.total_points || 0}
        />

        {/* Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily & Weekly Bounty Quests</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Cosmic Quests & Bounties
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Complete tactical challenges to earn extra XP, collect gold coins, and unlock exclusive rewards.
              </p>
            </div>

            {/* Quests Status Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/80 border border-white/10 shadow-inner">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {completedCount} <span className="text-slate-400 text-sm font-semibold">/ {quests.length}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Quests Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Quests' },
            { id: 'daily', label: 'Daily Bounties' },
            { id: 'weekly', label: 'Weekly Expeditions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quests List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Quests...</span>
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="cosmic-card rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Quests in this Sector</h3>
              <p className="text-xs text-slate-400 mt-1">
                You have completed all active bounties. Check back tomorrow or take a subject challenge to trigger new quests!
              </p>
            </div>
            <button
              onClick={() => router.push('/student/map')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
            >
              <span>Explore Learning Worlds</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredQuests.map((quest) => {
              const currentProg = quest.progress_current ?? quest.progress_percent ?? 0;
              const totalProg = quest.progress_total ?? 100;
              const percent = Math.min(100, Math.round((currentProg / Math.max(totalProg, 1)) * 100));

              const isQuestClaimed = quest.is_claimed || (quest.status === 'completed' && Boolean(quest.completed_at));
              const isQuestCompleted = quest.is_completed || quest.status === 'completed' || percent >= 100;

              return (
                <div
                  key={quest.id}
                  className={`cosmic-card p-6 rounded-3xl border transition-all flex flex-col justify-between gap-5 ${
                    isQuestClaimed
                      ? 'bg-slate-900/40 border-white/5 opacity-60'
                      : isQuestCompleted
                      ? 'bg-gradient-to-br from-slate-900/90 to-amber-950/30 border-amber-500/40 shadow-xl shadow-amber-950/30'
                      : 'bg-slate-900/80 border-white/10 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 border border-white/5 text-slate-400">
                        {quest.quest_type} quest
                      </span>

                      {/* Rewards Pill */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          +{quest.coin_reward ?? quest.coins_reward ?? 20}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          +{quest.xp_reward} XP
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{quest.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {quest.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>Progress</span>
                        <span>
                          {isQuestCompleted ? 'Completed' : `${quest.progress_current ?? quest.progress_percent ?? 0} / ${quest.progress_total ?? 100}`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${isQuestCompleted ? 100 : percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    {isQuestClaimed ? (
                      <div className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center gap-1.5 border border-white/5">
                        <Check className="w-4 h-4" />
                        <span>Reward Claimed</span>
                      </div>
                    ) : isQuestCompleted ? (
                      <button
                        onClick={() => handleClaim(quest)}
                        disabled={claimingId === quest.id}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition active:scale-95"
                      >
                        {claimingId === quest.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Gift className="w-4 h-4" />
                        )}
                        <span>Claim Rewards (+{quest.xp_reward} XP)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (quest.target_id) {
                            router.push(`/student/assessments/${quest.target_id}`);
                          } else {
                            router.push('/student/map');
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/5 transition"
                      >
                        <span>Go to Quest Objective</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Nova AI Companion */}
      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />
    </div>
  );
}
