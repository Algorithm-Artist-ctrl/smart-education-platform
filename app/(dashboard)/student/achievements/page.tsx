// app/(dashboard)/student/achievements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  Award, 
  Flame, 
  Zap, 
  Star, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Crown, 
  BookOpen,
  Loader2,
  Trophy,
  Filter
} from 'lucide-react';
import { Profile, StudentProfile } from '@/types/database.types';

interface BadgeItem {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: number;
  category?: string;
  isUnlocked?: boolean;
  unlockedAt?: string | null;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadAchievements() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/achievements');
        return;
      }

      const [profRes, studRes, badgesRes, studentBadgesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase.from('gamification_badges').select('*'),
        supabase.from('student_badges').select('*').eq('student_id', user.id),
      ]);

      if (profRes.data) setProfile(profRes.data as Profile);
      if (studRes.data) setStudentProfile(studRes.data as StudentProfile);

      const allBadges = (badgesRes.data || []) as any[];
      const awarded = (studentBadgesRes.data || []) as any[];
      const awardedMap = new Map(awarded.map((a: any) => [a.badge_id, a.awarded_at]));

      // Fallback base badges if none in database yet to ensure zero breakage
      const defaultBadgesList: BadgeItem[] = [
        {
          id: 'e0000000-0000-0000-0000-000000000001',
          code: 'FIRST_ASSESSMENT',
          title: 'First Step',
          description: 'Completed your diagnostic assessment or initial test',
          icon: 'Award',
          criteria_type: 'assessment_completed',
          criteria_value: 1,
          category: 'academics',
        },
        {
          id: 'e0000000-0000-0000-0000-000000000002',
          code: 'STREAK_3',
          title: 'Flame Igniter',
          description: 'Maintained an active 3-day learning streak',
          icon: 'Flame',
          criteria_type: 'streak',
          criteria_value: 3,
          category: 'streak',
        },
        {
          id: 'e0000000-0000-0000-0000-000000000003',
          code: 'STREAK_7',
          title: 'Study Champion',
          description: 'Maintained a disciplined 7-day study streak',
          icon: 'Zap',
          criteria_type: 'streak',
          criteria_value: 7,
          category: 'streak',
        },
        {
          id: 'e0000000-0000-0000-0000-000000000004',
          code: 'PERFECT_SCORE',
          title: 'Mastermind',
          description: 'Scored 100% on any topic quiz or mastery challenge',
          icon: 'Star',
          criteria_type: 'perfect_score',
          criteria_value: 1,
          category: 'academics',
        },
        {
          id: 'e0000000-0000-0000-0000-000000000005',
          code: 'WEAK_TOPIC_CONQUEROR',
          title: 'Phoenix Rising',
          description: 'Turned a flagged weak topic into mastery through revision',
          icon: 'ShieldCheck',
          criteria_type: 'weak_topic_resolved',
          criteria_value: 1,
          category: 'progress',
        },
        {
          id: 'e0000000-0000-0000-0000-000000000006',
          code: 'LEVEL_5',
          title: 'Cosmic Scholar',
          description: 'Reached Student Progression Level 5',
          icon: 'Crown',
          criteria_type: 'level',
          criteria_value: 5,
          category: 'progress',
        },
        {
          id: 'e0000000-0000-0000-0000-000000000007',
          code: 'REVISION_MASTER',
          title: 'Memory Vault',
          description: 'Completed 5 revision drill cycles in the Arena',
          icon: 'BookOpen',
          criteria_type: 'revision_completed',
          criteria_value: 5,
          category: 'special',
        },
        {
          id: 'e0000000-0000-0000-0000-000000000008',
          code: 'CAREER_EXPLORER',
          title: 'Future Navigator',
          description: 'Explored Career Galaxy and saved 3 target pathways',
          icon: 'Sparkles',
          criteria_type: 'career_saved',
          criteria_value: 3,
          category: 'special',
        },
      ];

      const mergedBadges = (allBadges.length > 0 ? allBadges : defaultBadgesList).map((b: any) => {
        const isAwarded = awardedMap.has(b.id);
        // Categorize based on criteria
        let cat = 'progress';
        if (b.criteria_type?.includes('streak')) cat = 'streak';
        else if (b.criteria_type?.includes('assessment') || b.criteria_type?.includes('score')) cat = 'academics';
        else if (b.criteria_type?.includes('career') || b.criteria_type?.includes('revision')) cat = 'special';

        return {
          ...b,
          category: cat,
          isUnlocked: isAwarded || (studRes.data && studRes.data.streak_days >= (b.criteria_value || 999) && b.criteria_type === 'streak'),
          unlockedAt: awardedMap.get(b.id) || null,
        };
      });

      setBadges(mergedBadges);
      setLoading(false);
    }

    loadAchievements();
  }, [router, supabase]);

  const categories = [
    { id: 'all', label: 'All Badges' },
    { id: 'progress', label: 'Progress' },
    { id: 'academics', label: 'Academics' },
    { id: 'streak', label: 'Streak' },
    { id: 'special', label: 'Special Quests' },
  ];

  const filteredBadges = activeCategory === 'all'
    ? badges
    : badges.filter((b) => b.category === activeCategory);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const iconClass = `w-7 h-7 sm:w-8 sm:h-8 ${
      isUnlocked ? 'text-white' : 'text-slate-500'
    }`;

    switch (iconName) {
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'Zap':
        return <Zap className={iconClass} />;
      case 'Star':
        return <Star className={iconClass} />;
      case 'ShieldCheck':
        return <ShieldCheck className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      case 'BookOpen':
        return <BookOpen className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      default:
        return <Award className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glow */}
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

        {/* Hero Header matching Screen 6 */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Achievements & Badges Vault</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Your Cosmic Trophy Case
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Unlock rare badges, climb the interplanetary leaderboard, and earn bonus XP!
              </p>
            </div>

            {/* Badges Counter Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/80 border border-white/10 shadow-inner">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {unlockedCount} <span className="text-slate-400 text-sm font-semibold">/ {badges.length}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Badges Unlocked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll-x pb-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges Grid (Screen 6 3D Metallic Cards) */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Badge Vault...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredBadges.map((badge) => {
              const isUnlocked = badge.isUnlocked;

              return (
                <div
                  key={badge.id}
                  className={`rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                    isUnlocked
                      ? 'bg-gradient-to-b from-slate-900/90 to-indigo-950/40 border-indigo-500/40 shadow-xl shadow-indigo-950/40 hover:-translate-y-1 hover:border-indigo-400'
                      : 'bg-slate-900/40 border-white/5 opacity-60 hover:opacity-80'
                  }`}
                >
                  {/* Subtle top glow for unlocked badges */}
                  {isUnlocked && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  )}

                  <div>
                    {/* Badge Icon Medallion */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/30 ring-2 ring-indigo-400/40'
                            : 'bg-slate-800 text-slate-500 border border-white/5'
                        }`}
                      >
                        {renderBadgeIcon(badge.icon, !!isUnlocked)}
                      </div>

                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/10 text-[10px] font-bold">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{badge.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {badge.description}
                    </p>
                  </div>

                  {/* Footer criteria / reward */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-400 font-medium">
                      {badge.criteria_type}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20 text-[11px]">
                      <Zap className="w-3 h-3 text-indigo-400" />
                      +50 XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating AI Companion */}
      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />
    </div>
  );
}
