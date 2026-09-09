// app/(dashboard)/student/leaderboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Crown, 
  Medal, 
  Loader2, 
  ArrowUp, 
  Sparkles,
  Users
} from 'lucide-react';
import { Profile, StudentProfile } from '@/types/database.types';

interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatarUrl?: string | null;
  totalPoints: number;
  level: number;
  streakDays: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadLeaderboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/leaderboard');
        return;
      }

      const [profRes, studRes, allStudRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('student_profiles')
          .select('id, total_points, level, current_streak, profiles(id, full_name, avatar_url)')
          .order('total_points', { ascending: false })
          .limit(25),
      ]);

      if (profRes.data) setProfile(profRes.data as Profile);
      if (studRes.data) setStudentProfile(studRes.data as StudentProfile);

      if (allStudRes.data && allStudRes.data.length > 0) {
        const mapped: LeaderboardUser[] = allStudRes.data.map((item: any, index: number) => ({
          id: item.id,
          rank: index + 1,
          name: item.profiles?.full_name || `Cadet #${item.id.slice(0, 4)}`,
          avatarUrl: item.profiles?.avatar_url,
          totalPoints: item.total_points || 0,
          level: item.level || 1,
          streakDays: item.current_streak || 0,
          isCurrentUser: item.id === user.id,
        }));
        setLeaderboard(mapped);
      } else {
        // Fallback demo ranks if only 1 student exists
        setLeaderboard([
          {
            id: user.id,
            rank: 1,
            name: profRes.data?.full_name || 'Alex Morgan',
            totalPoints: studRes.data?.total_points || 350,
            level: studRes.data?.level || 2,
            streakDays: studRes.data?.current_streak || 3,
            isCurrentUser: true,
          },
          {
            id: 'demo-2',
            rank: 2,
            name: 'Priya Sharma',
            totalPoints: 320,
            level: 2,
            streakDays: 5,
            isCurrentUser: false,
          },
          {
            id: 'demo-3',
            rank: 3,
            name: 'Marcus Chen',
            totalPoints: 290,
            level: 2,
            streakDays: 4,
            isCurrentUser: false,
          },
          {
            id: 'demo-4',
            rank: 4,
            name: 'Sarah Jenkins',
            totalPoints: 250,
            level: 1,
            streakDays: 2,
            isCurrentUser: false,
          },
          {
            id: 'demo-5',
            rank: 5,
            name: 'Ethan Ross',
            totalPoints: 210,
            level: 1,
            streakDays: 1,
            isCurrentUser: false,
          },
        ]);
      }
      setLoading(false);
    }

    loadLeaderboard();
  }, [router, supabase]);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-amber-950/20 via-indigo-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Gamification Bar */}
        <GamificationBar
          level={studentProfile?.level || 1}
          currentXp={studentProfile?.xp || 0}
          streakDays={studentProfile?.streak_days || 0}
          coins={studentProfile?.coins ?? 100}
          totalPoints={studentProfile?.total_points || 0}
        />

        {/* Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-amber-950/30 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Planetary Hall of Fame</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Interplanetary Class Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mt-1">
            Compete with classmates, complete daily quests, and climb to the cosmic summit.
          </p>
        </div>

        {/* Top 3 Podium Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Leaderboard...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* Rank 2 (Silver) */}
              {topThree[1] && (
                <div className="order-2 md:order-1 cosmic-card p-6 rounded-3xl border border-slate-400/30 bg-slate-900/80 backdrop-blur-md shadow-xl text-center flex flex-col items-center justify-center space-y-3 relative">
                  <div className="w-10 h-10 rounded-full bg-slate-300/20 border border-slate-300 text-slate-200 font-black text-sm flex items-center justify-center shadow-lg">
                    2
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-xl font-black text-white shadow-xl">
                    {topThree[1].name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{topThree[1].name}</h3>
                    <span className="text-xs text-slate-400">Level {topThree[1].level} Cadet</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-xs font-mono font-bold text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{topThree[1].totalPoints} XP</span>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold / Champion) */}
              {topThree[0] && (
                <div className="order-1 md:order-2 cosmic-card p-8 rounded-3xl border-2 border-amber-400/50 bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-900 shadow-2xl text-center flex flex-col items-center justify-center space-y-3 relative md:-translate-y-4">
                  <div className="absolute -top-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-amber-500/30">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Grand Champion</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 border-2 border-amber-400 text-amber-300 font-black text-base flex items-center justify-center shadow-xl shadow-amber-500/20">
                    1
                  </div>
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-2xl font-black text-slate-950 shadow-2xl shadow-amber-500/40">
                    {topThree[0].name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{topThree[0].name}</h3>
                    <span className="text-xs text-amber-300 font-semibold">Level {topThree[0].level} Supreme</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-sm font-mono font-black text-amber-300 shadow-inner">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{topThree[0].totalPoints} XP</span>
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {topThree[2] && (
                <div className="order-3 md:order-3 cosmic-card p-6 rounded-3xl border border-amber-700/30 bg-slate-900/80 backdrop-blur-md shadow-xl text-center flex flex-col items-center justify-center space-y-3 relative">
                  <div className="w-10 h-10 rounded-full bg-amber-700/20 border border-amber-600 text-amber-400 font-black text-sm flex items-center justify-center shadow-lg">
                    3
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-600 flex items-center justify-center text-xl font-black text-white shadow-xl">
                    {topThree[2].name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{topThree[2].name}</h3>
                    <span className="text-xs text-slate-400">Level {topThree[2].level} Cadet</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-xs font-mono font-bold text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{topThree[2].totalPoints} XP</span>
                  </div>
                </div>
              )}
            </div>

            {/* Remaining Ranks Table */}
            {remaining.length > 0 && (
              <div className="cosmic-card rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Class Rank & Cadet</span>
                  <div className="flex items-center gap-8">
                    <span>Streak</span>
                    <span>Total XP</span>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {remaining.map((cadet) => (
                    <div
                      key={cadet.id}
                      className={`px-6 py-4 flex items-center justify-between transition ${
                        cadet.isCurrentUser
                          ? 'bg-indigo-600/20 border-l-4 border-indigo-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-6 font-mono font-bold text-xs text-slate-400">
                          #{cadet.rank}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                          {cadet.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <span>{cadet.name}</span>
                            {cadet.isCurrentUser && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">Level {cadet.level}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="flex items-center gap-1 text-xs text-orange-400 font-bold">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{cadet.streakDays}d</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-300">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{cadet.totalPoints}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
