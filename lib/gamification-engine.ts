// lib/gamification-engine.ts
// Smart Edu Centralized Gamification & Adaptive Engine

export interface StudentStats {
  totalPoints: number;
  quizzesCompleted: number;
  perfectQuizzes: number;
  currentStreak: number;
  subjectsExplored: number;
  totalStudyMinutes: number;
}

export interface AchievementEvaluation {
  code: string;
  name: string;
  unlocked: boolean;
  progressPercent: number;
  criteria: string;
  xpReward: number;
}

/**
 * Calculates XP based on student profile attributes and achievements
 */
export function calculateXP(totalPoints: number | undefined | null): number {
  return Math.max(0, Number(totalPoints) || 0);
}

/**
 * Calculates the cadet's current level based on total XP.
 * Formula: Level = Math.floor(XP / 500) + 1
 * Each level requires 500 XP.
 */
export function calculateLevel(xp: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  const safeXP = Math.max(0, xp);
  const xpPerLevel = 500;
  const level = Math.floor(safeXP / xpPerLevel) + 1;
  const currentLevelXP = safeXP % xpPerLevel;
  const nextLevelXP = xpPerLevel;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100));

  return {
    level,
    currentLevelXP,
    nextLevelXP,
    progressPercent,
  };
}

/**
 * Calculates the current daily streak from an array of activity date strings (YYYY-MM-DD or ISO).
 */
export function calculateStreak(activityDates: string[]): number {
  if (!activityDates || activityDates.length === 0) return 0;

  // Normalize dates to YYYY-MM-DD in local time
  const uniqueDates = Array.from(
    new Set(
      activityDates
        .filter(Boolean)
        .map((d) => {
          try {
            return new Date(d).toISOString().split('T')[0];
          } catch {
            return '';
          }
        })
        .filter(Boolean)
    )
  ).sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If latest activity is neither today nor yesterday, streak is broken
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevExpected = new Date(currentDate);
    prevExpected.setDate(prevExpected.getDate() - 1);
    const expectedStr = prevExpected.toISOString().split('T')[0];

    if (uniqueDates[i] === expectedStr) {
      streak++;
      currentDate = prevExpected;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates subject completion and progress percentage from topics count.
 */
export function calculateSubjectProgress(
  totalTopics: number,
  completedTopics: number
): {
  percentage: number;
  completedCount: number;
  totalCount: number;
  isMastered: boolean;
} {
  const total = Math.max(0, totalTopics);
  const completed = Math.min(total, Math.max(0, completedTopics));
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const isMastered = total > 0 && completed === total;

  return {
    percentage,
    completedCount: completed,
    totalCount: total,
    isMastered,
  };
}

/**
 * Calculates mastery level tier string and color from score percentage.
 */
export function calculateMastery(scorePercentage: number): {
  tier: 'Novice' | 'Apprentice' | 'Proficient' | 'Master' | 'Grandmaster';
  color: string;
  badgeClass: string;
} {
  const score = Math.max(0, Math.min(100, scorePercentage));
  if (score >= 95) {
    return { tier: 'Grandmaster', color: '#f59e0b', badgeClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
  }
  if (score >= 80) {
    return { tier: 'Master', color: '#10b981', badgeClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' };
  }
  if (score >= 65) {
    return { tier: 'Proficient', color: '#06b6d4', badgeClass: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' };
  }
  if (score >= 45) {
    return { tier: 'Apprentice', color: '#6366f1', badgeClass: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' };
  }
  return { tier: 'Novice', color: '#94a3b8', badgeClass: 'text-slate-400 bg-slate-400/10 border-slate-400/30' };
}

/**
 * Calculates weak topics from actual quiz attempt answer data.
 * Threshold: accuracy < 65% is flagged as a weak area.
 */
export function calculateWeakTopics(
  attemptAnswers: {
    topic_id: string;
    topic_name?: string;
    subject_id?: string;
    subject_name?: string;
    is_correct: boolean;
  }[]
): {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  accuracy: number;
  incorrectCount: number;
  totalAttempts: number;
}[] {
  const map = new Map<
    string,
    {
      topic_id: string;
      topic_name: string;
      subject_name: string;
      correct: number;
      total: number;
    }
  >();

  for (const ans of attemptAnswers) {
    if (!ans.topic_id) continue;
    const existing = map.get(ans.topic_id) || {
      topic_id: ans.topic_id,
      topic_name: ans.topic_name || 'Academic Concept',
      subject_name: ans.subject_name || 'General',
      correct: 0,
      total: 0,
    };
    existing.total++;
    if (ans.is_correct) existing.correct++;
    map.set(ans.topic_id, existing);
  }

  const weakList: {
    topic_id: string;
    topic_name: string;
    subject_name: string;
    accuracy: number;
    incorrectCount: number;
    totalAttempts: number;
  }[] = [];

  map.forEach((item) => {
    if (item.total >= 2) {
      const accuracy = Math.round((item.correct / item.total) * 100);
      if (accuracy < 65) {
        weakList.push({
          topic_id: item.topic_id,
          topic_name: item.topic_name,
          subject_name: item.subject_name,
          accuracy,
          incorrectCount: item.total - item.correct,
          totalAttempts: item.total,
        });
      }
    }
  });

  return weakList.sort((a, b) => a.accuracy - b.accuracy);
}

/**
 * Computes ranked leaderboard from a list of students with actual database points.
 */
export function calculateLeaderboard<T extends { id: string; full_name?: string; total_points?: number; current_streak?: number }>(
  students: T[],
  currentUserId?: string
): {
  rankedList: (T & { rank: number; isCurrentUser: boolean })[];
  currentUserRank: number | null;
} {
  const sorted = [...students].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

  let currentUserRank: number | null = null;
  const rankedList = sorted.map((st, index) => {
    const rank = index + 1;
    const isCurrentUser = st.id === currentUserId;
    if (isCurrentUser) {
      currentUserRank = rank;
    }
    return {
      ...st,
      rank,
      isCurrentUser,
    };
  });

  return { rankedList, currentUserRank };
}

/**
 * Evaluates whether a student has unlocked standard gamification achievements based on their real stats.
 */
export function evaluateAchievements(stats: StudentStats): AchievementEvaluation[] {
  const list: AchievementEvaluation[] = [
    {
      code: 'FIRST_STEP',
      name: 'First Step',
      criteria: 'Complete your first quiz or learning session',
      unlocked: stats.quizzesCompleted >= 1,
      progressPercent: stats.quizzesCompleted >= 1 ? 100 : 0,
      xpReward: 50,
    },
    {
      code: '7_DAY_STREAK',
      name: '7 Day Streak',
      criteria: 'Maintain a learning streak for 7 consecutive days',
      unlocked: stats.currentStreak >= 7,
      progressPercent: Math.min(100, Math.round((stats.currentStreak / 7) * 100)),
      xpReward: 150,
    },
    {
      code: 'MATH_MASTER',
      name: 'Math Master',
      criteria: 'Answer 50 questions correctly across Math modules',
      unlocked: stats.quizzesCompleted >= 5,
      progressPercent: Math.min(100, Math.round((stats.quizzesCompleted / 5) * 100)),
      xpReward: 200,
    },
    {
      code: 'SPEED_SOLVER',
      name: 'Speed Solver',
      criteria: 'Solve 10 questions in under 5 minutes',
      unlocked: stats.quizzesCompleted >= 2,
      progressPercent: Math.min(100, Math.round((stats.quizzesCompleted / 2) * 100)),
      xpReward: 100,
    },
    {
      code: 'PERFECT_SCORE',
      name: 'Perfect Score',
      criteria: 'Achieve 100% accuracy on any formal quiz',
      unlocked: stats.perfectQuizzes >= 1,
      progressPercent: stats.perfectQuizzes >= 1 ? 100 : 0,
      xpReward: 250,
    },
    {
      code: 'CONSISTENCY_PRO',
      name: 'Consistency Pro',
      criteria: 'Maintain an active study habit for 30 days',
      unlocked: stats.currentStreak >= 30,
      progressPercent: Math.min(100, Math.round((stats.currentStreak / 30) * 100)),
      xpReward: 500,
    },
    {
      code: 'SUBJECT_EXPLORER',
      name: 'Subject Explorer',
      criteria: 'Engage with at least 3 distinct academic subjects',
      unlocked: stats.subjectsExplored >= 3,
      progressPercent: Math.min(100, Math.round((stats.subjectsExplored / 3) * 100)),
      xpReward: 120,
    },
    {
      code: 'LEGEND',
      name: 'Cosmic Legend',
      criteria: 'Attain Level 10 and conquer all core subject worlds',
      unlocked: stats.totalPoints >= 5000,
      progressPercent: Math.min(100, Math.round((stats.totalPoints / 5000) * 100)),
      xpReward: 1000,
    },
  ];

  return list;
}
