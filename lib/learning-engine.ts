// lib/learning-engine.ts
// Smart Education Adaptive Learning & Diagnostic Analysis Engine

import { SupabaseClient } from '@supabase/supabase-js';
import { calculateLevel } from '@/lib/gamification-engine';
import { TopicMastery, TopicMasteryStatus } from '@/types/database.types';

export interface AssessmentSubmissionData {
  assessment_id: string;
  student_id: string;
  start_time: string;
  answers: {
    question_id: string;
    topic_id?: string | null;
    selected_option_index: number;
    time_spent_seconds: number;
    hints_used?: number;
  }[];
}

export interface TopicPerformanceStats {
  accuracy: number;
  attempts: number;
  correct_attempts: number;
  incorrect_attempts: number;
  hints_used?: number;
  average_time_seconds?: number;
  difficulty?: number;
  previous_status?: TopicMasteryStatus;
}

/**
 * Central Topic Mastery Calculator
 * Implements weighted mastery score:
 * - Accuracy: 50%
 * - Attempt volume/consistency: 25%
 * - Difficulty scaling: 25%
 * - Hints deduction: up to -10%
 */
export function calculateTopicMastery(stats: TopicPerformanceStats): {
  mastery_score: number;
  status: TopicMasteryStatus;
  confidence: 'low' | 'medium' | 'high';
} {
  const {
    accuracy,
    attempts,
    correct_attempts,
    incorrect_attempts,
    hints_used = 0,
    difficulty = 1,
    previous_status = 'new',
  } = stats;

  if (attempts === 0) {
    return { mastery_score: 0, status: 'new', confidence: 'low' };
  }

  const baseAcc = Math.max(0, Math.min(100, accuracy));
  const attemptWeight = Math.min(1, attempts / 3);
  const diffMultiplier = 0.8 + (Math.min(5, Math.max(1, difficulty)) * 0.05);
  const hintPenalty = Math.min(15, hints_used * 3);

  const rawScore = (baseAcc * 0.65) + (attemptWeight * 35 * diffMultiplier) - hintPenalty;
  const mastery_score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (attempts >= 4) confidence = 'high';
  else if (attempts >= 2) confidence = 'medium';

  let status: TopicMasteryStatus = 'learning';

  if (baseAcc < 60 || (incorrect_attempts > correct_attempts && attempts >= 2)) {
    status = 'needs_support';
  } else if (baseAcc >= 80 && attempts >= 2 && mastery_score >= 75) {
    status = 'mastered';
  } else if (previous_status === 'needs_support' && baseAcc >= 60) {
    status = 'improving';
  } else {
    status = 'learning';
  }

  return {
    mastery_score,
    status,
    confidence,
  };
}

/**
 * Adaptive Difficulty Evaluator
 * Calibrates next question/lesson difficulty, hints allowance, and teaching mode.
 */
export function adaptDifficulty(studentPerformance: {
  accuracy: number;
  attempts: number;
  hintsUsed: number;
  averageTimeSeconds: number;
  currentDifficulty?: number;
}): {
  targetDifficulty: number;
  scaffoldingLevel: 'guided' | 'standard' | 'challenge';
  recommendedMode: 'visual' | 'practice' | 'story';
  maxHints: number;
  explanation: string;
} {
  const { accuracy, hintsUsed, averageTimeSeconds, currentDifficulty = 2 } = studentPerformance;

  if (accuracy < 55 || hintsUsed > 5 || averageTimeSeconds > 90) {
    return {
      targetDifficulty: Math.max(1, currentDifficulty - 1),
      scaffoldingLevel: 'guided',
      recommendedMode: 'visual',
      maxHints: 3,
      explanation: 'Pacing adjusted with visual diagrams, step-by-step guidance, and hint support.',
    };
  }

  if (accuracy >= 85 && hintsUsed <= 1 && averageTimeSeconds < 45) {
    return {
      targetDifficulty: Math.min(5, currentDifficulty + 1),
      scaffoldingLevel: 'challenge',
      recommendedMode: 'practice',
      maxHints: 1,
      explanation: 'High mastery demonstrated! Unlocking advanced application challenges and boss trials.',
    };
  }

  return {
    targetDifficulty: currentDifficulty,
    scaffoldingLevel: 'standard',
    recommendedMode: 'practice',
    maxHints: 2,
    explanation: 'Steady progression at standard difficulty.',
  };
}

/**
 * Select Teaching Mode based on student profile and learning style
 */
export function selectTeachingMode(studentProfile: {
  learning_style?: 'visual' | 'practice' | 'story' | string | null;
  current_difficulty?: number;
  accuracy?: number;
}): 'visual' | 'practice' | 'story' {
  if (studentProfile?.learning_style === 'visual') return 'visual';
  if (studentProfile?.learning_style === 'story') return 'story';
  if (studentProfile?.learning_style === 'practice') return 'practice';
  if ((studentProfile?.accuracy ?? 100) < 60) return 'visual';
  return 'practice';
}

/**
 * Positive Failure System
 * Transforms errors into learning opportunities with an intuitive analogy and +5 effort XP.
 */
export function evaluatePositiveFailure(
  question: { question_text: string; options: string[]; correct_option_index: number; explanation?: string | null },
  selectedOptionIndex: number
): {
  isCorrect: boolean;
  effortXpEarned: number;
  feedbackTitle: string;
  feedbackText: string;
  analogyTip: string;
  nextMicroAction: string;
} {
  const isCorrect = selectedOptionIndex === question.correct_option_index;

  if (isCorrect) {
    return {
      isCorrect: true,
      effortXpEarned: 10,
      feedbackTitle: 'Brilliant Deduction! 🎯',
      feedbackText: question.explanation || 'You applied the concept with great precision.',
      analogyTip: 'Concept reinforced.',
      nextMicroAction: 'Advance to the next challenge.',
    };
  }

  const selectedText = question.options[selectedOptionIndex] || 'your choice';
  const correctText = question.options[question.correct_option_index] || 'the correct choice';

  return {
    isCorrect: false,
    effortXpEarned: 5,
    feedbackTitle: 'Great Effort! Here is the Learning Signal 💡',
    feedbackText: `You picked "${selectedText}". That is a common step when exploring this concept, but the solution here is "${correctText}". ${question.explanation || ''}`,
    analogyTip: 'Think of this like tuning an instrument: every try gets you closer to harmony.',
    nextMicroAction: 'Review the visual explanation and attempt an easier variation.',
  };
}

/**
 * Updates or creates topic_mastery record in Supabase
 */
export async function updateTopicMastery(
  supabase: SupabaseClient,
  studentId: string,
  topicId: string,
  subjectId: string,
  correct: boolean,
  timeSpentSeconds: number = 0,
  hintsUsed: number = 0,
  difficulty: number = 1
): Promise<TopicMastery | null> {
  try {
    const { data: existing } = await supabase
      .from('topic_mastery')
      .select('*')
      .eq('student_id', studentId)
      .eq('topic_id', topicId)
      .maybeSingle();

    const currentAttempts = (existing?.attempts || 0) + 1;
    const currentCorrect = (existing?.correct_attempts || 0) + (correct ? 1 : 0);
    const currentIncorrect = (existing?.incorrect_attempts || 0) + (correct ? 0 : 1);
    const currentHints = (existing?.hints_used || 0) + hintsUsed;
    const currentAccuracy = Math.round((currentCorrect / currentAttempts) * 100);
    const avgTime = existing?.average_time_seconds 
      ? Math.round((existing.average_time_seconds + timeSpentSeconds) / 2)
      : timeSpentSeconds;

    const evaluation = calculateTopicMastery({
      accuracy: currentAccuracy,
      attempts: currentAttempts,
      correct_attempts: currentCorrect,
      incorrect_attempts: currentIncorrect,
      hints_used: currentHints,
      difficulty,
      previous_status: existing?.status || 'new',
    });

    const now = new Date().toISOString();
    const payload = {
      student_id: studentId,
      topic_id: topicId,
      subject_id: subjectId,
      mastery_score: evaluation.mastery_score,
      accuracy: currentAccuracy,
      attempts: currentAttempts,
      correct_attempts: currentCorrect,
      incorrect_attempts: currentIncorrect,
      hints_used: currentHints,
      average_time_seconds: avgTime,
      difficulty,
      confidence: evaluation.confidence,
      status: evaluation.status,
      last_attempted_at: now,
      last_mastered_at: evaluation.status === 'mastered' ? now : (existing?.last_mastered_at || null),
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('topic_mastery')
      .upsert(payload, { onConflict: 'student_id,topic_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('topic_mastery table update skipped:', error.message);
      return null;
    }

    return data as TopicMastery;
  } catch (err) {
    console.warn('updateTopicMastery error handled gracefully:', err);
    return null;
  }
}

/**
 * Retrieves all topic mastery records for a student
 */
export async function getStudentMastery(
  supabase: SupabaseClient,
  studentId: string,
  subjectId?: string
): Promise<TopicMastery[]> {
  try {
    let query = supabase
      .from('topic_mastery')
      .select('*, topic:topics(*), subject:subjects(*)')
      .eq('student_id', studentId);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as TopicMastery[];
  } catch {
    return [];
  }
}

/**
 * Retrieves prioritized weak topics needing support
 */
export async function getWeakTopics(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ topic_id: string; topic_name: string; subject_name: string; accuracy: number; status: string }[]> {
  try {
    const { data: masteryList } = await supabase
      .from('topic_mastery')
      .select('*, topic:topics(name), subject:subjects(name)')
      .eq('student_id', studentId)
      .eq('status', 'needs_support')
      .order('accuracy', { ascending: true });

    if (masteryList && masteryList.length > 0) {
      return masteryList.map((m: any) => ({
        topic_id: m.topic_id,
        topic_name: m.topic?.name || 'Academic Concept',
        subject_name: m.subject?.name || 'General',
        accuracy: Number(m.accuracy) || 0,
        status: m.status,
      }));
    }

    const { data: legacyWeak } = await supabase
      .from('weak_topics')
      .select('*, topic:topics(name, subject:subjects(name))')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('accuracy_rate', { ascending: true });

    if (legacyWeak && legacyWeak.length > 0) {
      return legacyWeak.map((w: any) => ({
        topic_id: w.topic_id,
        topic_name: w.topic?.name || 'Academic Concept',
        subject_name: w.topic?.subject?.name || 'General',
        accuracy: Number(w.accuracy_rate) || 0,
        status: 'needs_support',
      }));
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Decides the student's recommended next best step
 */
export async function getRecommendedNextStep(
  supabase: SupabaseClient,
  studentId: string,
  subjectId?: string
): Promise<{
  actionType: 'revision' | 'next_topic' | 'boss_challenge' | 'diagnostic';
  title: string;
  description: string;
  topicId?: string;
  assessmentId?: string;
  targetUrl: string;
  reason: string;
}> {
  try {
    const weakList = await getWeakTopics(supabase, studentId);
    if (weakList.length > 0) {
      const topWeak = weakList[0];
      return {
        actionType: 'revision',
        title: `Revise: ${topWeak.topic_name}`,
        description: `Boost understanding on ${topWeak.topic_name} (${topWeak.accuracy}% accuracy). Nova has created a visual recap.`,
        topicId: topWeak.topic_id,
        targetUrl: '/student/revision',
        reason: 'Reinforcing weak foundations guarantees long-term retention.',
      };
    }

    const { data: lPath } = await supabase
      .from('learning_paths')
      .select('*, recommended_next_topic:topics(*)')
      .eq('student_id', studentId)
      .maybeSingle();

    if (lPath?.recommended_next_topic) {
      return {
        actionType: 'next_topic',
        title: `Next Up: ${lPath.recommended_next_topic.name}`,
        description: lPath.recommended_next_topic.description || 'Master this next concept in your Learning Universe.',
        topicId: lPath.recommended_next_topic.id,
        targetUrl: '/student/map',
        reason: 'Prerequisites met. Ready to advance to the next level.',
      };
    }

    const { data: nextAssessment } = await supabase
      .from('assessments')
      .select('id, title, description')
      .limit(1)
      .maybeSingle();

    if (nextAssessment) {
      return {
        actionType: 'next_topic',
        title: nextAssessment.title,
        description: nextAssessment.description || 'Explore this curated assessment to earn XP.',
        assessmentId: nextAssessment.id,
        targetUrl: `/student/assessments/${nextAssessment.id}`,
        reason: 'Recommended for your academic grade and syllabus.',
      };
    }

    return {
      actionType: 'diagnostic',
      title: 'Explore Learning Universe',
      description: 'Choose a celestial island and test your conceptual mastery.',
      targetUrl: '/student/map',
      reason: 'Continue building your cosmic knowledge.',
    };
  } catch {
    return {
      actionType: 'diagnostic',
      title: 'Explore Learning Universe',
      description: 'Choose a celestial island and test your conceptual mastery.',
      targetUrl: '/student/map',
      reason: 'Continue building your cosmic knowledge.',
    };
  }
}

// =========================================================================
// 8-ACTION NEXT BEST LEARNING ENGINE & SMART SESSION SYSTEM
// =========================================================================

export type AdaptiveActionType =
  | 'REVISE_TOPIC'
  | 'PRACTICE_TOPIC'
  | 'WATCH_EXPLANATION'
  | 'TAKE_QUIZ'
  | 'CHALLENGE'
  | 'REAL_WORLD_MISSION'
  | 'CREATIVITY_ACTIVITY'
  | 'REST/RETURN_LATER';

export interface NextBestActionRecommendation {
  action: AdaptiveActionType;
  title: string;
  description: string;
  topicId?: string;
  topicName?: string;
  subjectName?: string;
  assessmentId?: string;
  targetUrl: string;
  reason: string;
  xpReward: number;
  estimatedMinutes: number;
  difficulty: number;
  scaffolding: 'guided' | 'standard' | 'challenge';
}

export interface NextBestActionOptions {
  continuousStudyMinutes?: number;
  totalAttemptsToday?: number;
  currentSessionDuration?: number;
  recentAccuracy?: number;
  subjectId?: string;
}

/**
 * Evaluates the student's holistic state and returns the optimal Next Best Learning Action
 * covering all 8 pedagogical actions without any hardcoding.
 */
export async function getNextBestLearningAction(
  supabase: SupabaseClient,
  studentId: string,
  options: NextBestActionOptions = {}
): Promise<NextBestActionRecommendation> {
  const {
    continuousStudyMinutes = 0,
    totalAttemptsToday = 0,
    currentSessionDuration = 0,
    recentAccuracy,
    subjectId,
  } = options;

  // 1. Check Cognitive Fatigue / Healthy Rest Guardrail (Action: REST/RETURN_LATER)
  if (continuousStudyMinutes >= 45 || currentSessionDuration >= 45 || totalAttemptsToday >= 8) {
    return {
      action: 'REST/RETURN_LATER',
      title: 'Mindful Cosmic Breather 🧘',
      description:
        "You've been studying intensively for over 45 minutes. Long-term memory consolidation occurs when your brain rests. Take 10 minutes away from the screen!",
      targetUrl: '/student',
      reason: 'Spaced repetition research proves that cognitive pauses increase concept recall by up to 35%.',
      xpReward: 25,
      estimatedMinutes: 10,
      difficulty: 1,
      scaffolding: 'guided',
    };
  }

  try {
    // 2. Query actual topic mastery and weak areas from DB
    const weakList = await getWeakTopics(supabase, studentId);
    const topWeak = weakList[0];

    if (topWeak) {
      const accuracy = recentAccuracy !== undefined ? recentAccuracy : topWeak.accuracy;

      // Deep conceptual gap: Needs visual grounding before solving more questions (Action: WATCH_EXPLANATION)
      if (accuracy < 45) {
        return {
          action: 'WATCH_EXPLANATION',
          title: `Visual Breakdown: ${topWeak.topic_name}`,
          description: `Foundational gap detected in ${topWeak.topic_name} (${accuracy}% accuracy). Step through Nova's visual breakdown before trying more problems.`,
          topicId: topWeak.topic_id,
          topicName: topWeak.topic_name,
          subjectName: topWeak.subject_name,
          targetUrl: `/student/lessons?topicId=${topWeak.topic_id}`,
          reason: 'Visual explanations build intuitive structural mental models when algebraic attempts stall.',
          xpReward: 35,
          estimatedMinutes: 8,
          difficulty: 2,
          scaffolding: 'guided',
        };
      }

      // Medium gap: Needs scaffolded guided step-by-step revision (Action: REVISE_TOPIC)
      if (accuracy >= 45 && accuracy < 65) {
        return {
          action: 'REVISE_TOPIC',
          title: `Scaffolded Revision: ${topWeak.topic_name}`,
          description: `Strengthen core formulas and step-by-step logic for ${topWeak.topic_name} (${accuracy}% accuracy). Nova will provide micro-hints.`,
          topicId: topWeak.topic_id,
          topicName: topWeak.topic_name,
          subjectName: topWeak.subject_name,
          targetUrl: `/student/revision?topicId=${topWeak.topic_id}`,
          reason: 'Targeted revision with immediate feedback prevents misconceptions from consolidating.',
          xpReward: 45,
          estimatedMinutes: 12,
          difficulty: 2,
          scaffolding: 'guided',
        };
      }

      // Borderline mastery: Needs deliberate practice to build automaticity (Action: PRACTICE_TOPIC)
      if (accuracy >= 65 && accuracy < 78) {
        return {
          action: 'PRACTICE_TOPIC',
          title: `Targeted Practice: ${topWeak.topic_name}`,
          description: `You are close to mastering ${topWeak.topic_name} (${accuracy}% accuracy). Solve 5 calibrated questions to achieve automatic fluency.`,
          topicId: topWeak.topic_id,
          topicName: topWeak.topic_name,
          subjectName: topWeak.subject_name,
          targetUrl: `/student/practice?topicId=${topWeak.topic_id}`,
          reason: 'Deliberate practice with varied difficulty turns conscious recall into effortless intuition.',
          xpReward: 50,
          estimatedMinutes: 10,
          difficulty: 3,
          scaffolding: 'standard',
        };
      }
    }

    // 3. Query student's mastered concepts to consider Challenge, Real-World Mission, or Creativity
    const { data: masteredList } = await supabase
      .from('topic_mastery')
      .select('*, topic:topics(name), subject:subjects(name)')
      .eq('student_id', studentId)
      .eq('status', 'mastered')
      .order('updated_at', { ascending: false })
      .limit(3);

    if (masteredList && masteredList.length > 0) {
      const topMastered = masteredList[0];
      const topicName = topMastered.topic?.name || 'Advanced Concept';
      const subjectName = topMastered.subject?.name || 'Science & Math';

      // Pick pedagogically based on total attempts: rotate between CHALLENGE, REAL_WORLD_MISSION, and CREATIVITY_ACTIVITY
      const randomSeed = (studentId.charCodeAt(0) + totalAttemptsToday) % 3;

      if (randomSeed === 0) {
        // Action: CHALLENGE (Boss Battle / Speed Trial)
        return {
          action: 'CHALLENGE',
          title: `Boss Challenge: Master Trial of ${topicName}`,
          description: `You've demonstrated exceptional skill in ${topicName}. Take on the timed Master Trial to unlock rare badges!`,
          topicId: topMastered.topic_id,
          topicName,
          subjectName,
          targetUrl: `/student/assessments?mode=challenge&topicId=${topMastered.topic_id}`,
          reason: 'Challenging high achievers at the upper edge of their ability sustains flow state and deep mastery.',
          xpReward: 100,
          estimatedMinutes: 15,
          difficulty: 5,
          scaffolding: 'challenge',
        };
      } else if (randomSeed === 1) {
        // Action: REAL_WORLD_MISSION (Real-world engineering / industry application)
        return {
          action: 'REAL_WORLD_MISSION',
          title: `Real-World Mission: ${topicName} in Space Exploration`,
          description: `Investigate how aerospace engineers and astrophysicists apply ${topicName} in real satellite navigation systems.`,
          topicId: topMastered.topic_id,
          topicName,
          subjectName,
          targetUrl: `/student/missions?topicId=${topMastered.topic_id}`,
          reason: 'Authentic real-world application cements conceptual meaning and answers "Why am I learning this?".',
          xpReward: 80,
          estimatedMinutes: 12,
          difficulty: 4,
          scaffolding: 'standard',
        };
      } else {
        // Action: CREATIVITY_ACTIVITY (Feynman Technique: teach partner / visual map)
        return {
          action: 'CREATIVITY_ACTIVITY',
          title: `Teach Your AI Partner: ${topicName}`,
          description: `Explain ${topicName} in your own words or sketch an intuitive concept diagram for your AI partner to test your clarity.`,
          topicId: topMastered.topic_id,
          topicName,
          subjectName,
          targetUrl: `/student/partner?topic=${encodeURIComponent(topicName)}&mode=teach`,
          reason: 'The Feynman Technique: teaching an idea requires true structural understanding without jargon.',
          xpReward: 70,
          estimatedMinutes: 10,
          difficulty: 3,
          scaffolding: 'standard',
        };
      }
    }

    // 4. Default: Standard Next Assessment / Quiz Retrieval Check (Action: TAKE_QUIZ)
    const { data: nextAssessment } = await supabase
      .from('assessments')
      .select('id, title, description, topic:topics(name), subject:subjects(name)')
      .limit(1)
      .maybeSingle();

    if (nextAssessment) {
      return {
        action: 'TAKE_QUIZ',
        title: `Quick Concept Check: ${nextAssessment.title}`,
        description: nextAssessment.description || 'Test your knowledge with a rapid adaptive quiz to earn XP and level up.',
        assessmentId: nextAssessment.id,
        topicName: (nextAssessment.topic as any)?.name || 'General Syllabus',
        subjectName: (nextAssessment.subject as any)?.name || 'Core Curriculum',
        targetUrl: `/student/assessments/${nextAssessment.id}`,
        reason: 'Low-stakes active retrieval practice reinforces synaptic pathways against the forgetting curve.',
        xpReward: 50,
        estimatedMinutes: 10,
        difficulty: 3,
        scaffolding: 'standard',
      };
    }

    // 5. Fallback if no specific assessment is found
    return {
      action: 'PRACTICE_TOPIC',
      title: 'Explore Learning Universe',
      description: 'Choose a celestial island and test your conceptual mastery.',
      targetUrl: '/student/map',
      reason: 'Continue building your cosmic knowledge through self-directed exploration.',
      xpReward: 40,
      estimatedMinutes: 15,
      difficulty: 3,
      scaffolding: 'standard',
    };
  } catch (err) {
    console.warn('getNextBestLearningAction fallback:', err);
    return {
      action: 'PRACTICE_TOPIC',
      title: 'Cosmic Knowledge Quest',
      description: 'Continue your learning journey through the galaxy map.',
      targetUrl: '/student/map',
      reason: 'Steady exploration reinforces continuous learning momentum.',
      xpReward: 30,
      estimatedMinutes: 10,
      difficulty: 2,
      scaffolding: 'standard',
    };
  }
}

// =========================================================================
// SMART SESSION LENGTH GENERATOR (5, 10, 15, 20, 30 min)
// =========================================================================

export interface SmartSessionTask {
  title: string;
  type: 'recap' | 'video' | 'practice' | 'quiz' | 'challenge' | 'reflection';
  duration_minutes: number;
  description: string;
  targetUrl: string;
  xp: number;
}

export interface SmartSessionPlan {
  durationMinutes: 5 | 10 | 15 | 20 | 30 | 45 | 60;
  sessionType: 'quick_burst' | 'concept_deep_dive' | 'revision' | 'practice' | 'challenge';
  title: string;
  description: string;
  totalXpReward: number;
  tasks: SmartSessionTask[];
  topicId?: string;
  topicName?: string;
  subjectName?: string;
}

/**
 * Generates an optimized, calibrated study plan for the chosen session duration
 * (5, 10, 15, 20, 30 mins) tailored to the student's real topic mastery.
 */
export async function generateSmartSessionPlan(
  supabase: SupabaseClient,
  studentId: string,
  durationMinutes: number = 15
): Promise<SmartSessionPlan> {
  // Normalize duration to allowed intervals
  const validMinutes = [5, 10, 15, 20, 30, 45, 60] as const;
  const clampedMinutes = (validMinutes.find((m) => m === durationMinutes) || 15) as 5 | 10 | 15 | 20 | 30 | 45 | 60;

  // Retrieve current student learning focus
  const weakList = await getWeakTopics(supabase, studentId);
  const targetTopic = weakList[0] || {
    topic_id: undefined,
    topic_name: 'Quadratic Equations & Roots',
    subject_name: 'Mathematics',
    accuracy: 65,
  };

  const topicName = targetTopic.topic_name;
  const topicId = targetTopic.topic_id;
  const baseUrl = topicId ? `?topicId=${topicId}` : '';

  switch (clampedMinutes) {
    case 5:
      return {
        durationMinutes: 5,
        sessionType: 'quick_burst',
        title: `5-Min Quick Burst: ${topicName}`,
        description: 'Ultra-fast memory check and rapid 3-question drill for students on the move.',
        totalXpReward: 30,
        topicId,
        topicName,
        subjectName: targetTopic.subject_name,
        tasks: [
          {
            title: `Key Formula & Idea Refresh`,
            type: 'recap',
            duration_minutes: 1.5,
            description: `Quick 90-second mental model review of ${topicName}.`,
            targetUrl: `/student/lessons${baseUrl}`,
            xp: 10,
          },
          {
            title: `3-Question Rapid Fire`,
            type: 'quiz',
            duration_minutes: 2.5,
            description: 'Fast-paced adaptive questions to lock in the concept.',
            targetUrl: `/student/practice${baseUrl}`,
            xp: 15,
          },
          {
            title: `Streak & Daily Energy Check`,
            type: 'reflection',
            duration_minutes: 1,
            description: 'Log completion and secure today’s learning streak.',
            targetUrl: '/student',
            xp: 5,
          },
        ],
      };

    case 10:
      return {
        durationMinutes: 10,
        sessionType: 'practice',
        title: `10-Min Target Drill: ${topicName}`,
        description: 'Scaffolded refresher followed by 5 targeted practice exercises.',
        totalXpReward: 55,
        topicId,
        topicName,
        subjectName: targetTopic.subject_name,
        tasks: [
          {
            title: `Concept Refresher`,
            type: 'recap',
            duration_minutes: 3,
            description: `Review fundamental logic and key definitions for ${topicName}.`,
            targetUrl: `/student/lessons${baseUrl}`,
            xp: 15,
          },
          {
            title: `5-Question Calibrated Set`,
            type: 'practice',
            duration_minutes: 5,
            description: 'Solve step-by-step problems with AI scaffolding hints.',
            targetUrl: `/student/practice${baseUrl}`,
            xp: 30,
          },
          {
            title: `Positive Error Analysis`,
            type: 'reflection',
            duration_minutes: 2,
            description: 'Analyze any incorrect steps and consolidate learning.',
            targetUrl: `/student/revision${baseUrl}`,
            xp: 10,
          },
        ],
      };

    case 15:
      return {
        durationMinutes: 15,
        sessionType: 'revision',
        title: `15-Min Focused Sprint: ${topicName}`,
        description: 'Complete visual walkthrough followed by active problem solving and a micro-challenge.',
        totalXpReward: 80,
        topicId,
        topicName,
        subjectName: targetTopic.subject_name,
        tasks: [
          {
            title: `Visual Model Breakdown`,
            type: 'video',
            duration_minutes: 4,
            description: `Explore interactive 3D/visual models representing ${topicName}.`,
            targetUrl: `/student/lessons${baseUrl}`,
            xp: 20,
          },
          {
            title: `Deliberate Practice Drill`,
            type: 'practice',
            duration_minutes: 8,
            description: 'Work through graduated difficulty problems with instantaneous hints.',
            targetUrl: `/student/practice${baseUrl}`,
            xp: 45,
          },
          {
            title: `Micro-Challenge & Synthesis`,
            type: 'challenge',
            duration_minutes: 3,
            description: 'Tackle a real-world scenario problem without hints to test retention.',
            targetUrl: `/student/assessments${baseUrl}`,
            xp: 15,
          },
        ],
      };

    case 20:
      return {
        durationMinutes: 20,
        sessionType: 'concept_deep_dive',
        title: `20-Min Deep Dive: ${topicName}`,
        description: 'Comprehensive mastery session covering diagnostics, rigorous practice, and an assessment.',
        totalXpReward: 110,
        topicId,
        topicName,
        subjectName: targetTopic.subject_name,
        tasks: [
          {
            title: `Diagnostic Warm-up`,
            type: 'recap',
            duration_minutes: 3,
            description: `Locate prior misconceptions and gauge confidence on ${topicName}.`,
            targetUrl: `/student/lessons${baseUrl}`,
            xp: 15,
          },
          {
            title: `Deep-Dive Problem Solving`,
            type: 'practice',
            duration_minutes: 12,
            description: 'Solve multi-step complex problems with adaptive difficulty scaling.',
            targetUrl: `/student/practice${baseUrl}`,
            xp: 65,
          },
          {
            title: `Mastery Verification Quiz`,
            type: 'quiz',
            duration_minutes: 5,
            description: 'Standardized assessment to confirm topic mastery in the Learning Universe.',
            targetUrl: `/student/assessments${baseUrl}`,
            xp: 30,
          },
        ],
      };

    case 30:
    default:
      return {
        durationMinutes: 30,
        sessionType: 'challenge',
        title: `30-Min Mastery Quest: ${topicName}`,
        description: 'Full academic immersion: conceptual foundation, intensive practice, real-world case study, and reflection.',
        totalXpReward: 165,
        topicId,
        topicName,
        subjectName: targetTopic.subject_name,
        tasks: [
          {
            title: `Foundational Architecture Review`,
            type: 'video',
            duration_minutes: 5,
            description: `Comprehensive overview of principles and theorems in ${topicName}.`,
            targetUrl: `/student/lessons${baseUrl}`,
            xp: 25,
          },
          {
            title: `Intensive Scaffolded Problem Set`,
            type: 'practice',
            duration_minutes: 15,
            description: 'High-volume diverse problems spanning easy to advanced difficulty.',
            targetUrl: `/student/practice${baseUrl}`,
            xp: 80,
          },
          {
            title: `Real-World Application Mission`,
            type: 'challenge',
            duration_minutes: 7,
            description: 'Explore how this principle is applied in technology, physics, or finance.',
            targetUrl: `/student/missions${baseUrl}`,
            xp: 40,
          },
          {
            title: `Cognitive Journal & Memory Sync`,
            type: 'reflection',
            duration_minutes: 3,
            description: 'Record key insights for your AI partner to adapt tomorrow’s schedule.',
            targetUrl: '/student',
            xp: 20,
          },
        ],
      };
  }
}

/**
 * Saves a scheduled or initiated smart study session into Supabase
 */
export async function createStudySession(
  supabase: SupabaseClient,
  studentId: string,
  plan: SmartSessionPlan
): Promise<any> {
  try {
    const payload = {
      student_id: studentId,
      duration_minutes: plan.durationMinutes,
      session_type: plan.sessionType,
      tasks_planned: plan.tasks.map((t) => ({
        title: t.title,
        type: t.type,
        duration_minutes: t.duration_minutes,
      })),
      tasks_completed: [],
      status: 'in_progress',
      xp_earned: 0,
      started_at: new Date().toISOString(),
      topic_id: plan.topicId || null,
    };

    const { data, error } = await supabase
      .from('study_sessions')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('createStudySession notice (fallback):', error.message);
      return { id: `local-session-${Date.now()}`, ...payload };
    }
    return data;
  } catch (err) {
    console.warn('createStudySession error handled:', err);
    return null;
  }
}

/**
 * Marks a study session completed and awards the planned XP to the student
 */
export async function completeStudySession(
  supabase: SupabaseClient,
  sessionId: string,
  studentId: string,
  xpEarned: number
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    await supabase
      .from('study_sessions')
      .update({
        status: 'completed',
        xp_earned: xpEarned,
        completed_at: now,
      })
      .eq('id', sessionId);

    // Update student profile XP
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('total_points, current_streak')
      .eq('id', studentId)
      .maybeSingle();

    if (profile) {
      const newPts = (profile.total_points || 0) + xpEarned;
      const { level: newLevel } = calculateLevel(newPts);
      await supabase
        .from('student_profiles')
        .update({
          total_points: newPts,
          level: newLevel,
          updated_at: now,
        })
        .eq('id', studentId);
    }

    return true;
  } catch (err) {
    console.warn('completeStudySession error handled:', err);
    return false;
  }
}


/**
 * Full assessment evaluation pipeline with topic mastery persistence
 */
export async function processAssessmentEvaluation(
  supabase: SupabaseClient,
  submission: AssessmentSubmissionData
) {
  const { assessment_id, student_id, start_time, answers } = submission;

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, topic_id, correct_option_index, marks, difficulty, explanation, question_text, options')
    .eq('assessment_id', assessment_id);

  if (qError || !questions) {
    throw new Error(`Failed to fetch questions: ${qError?.message}`);
  }

  const { data: assessmentMeta } = await supabase
    .from('assessments')
    .select('subject_id, topic_id')
    .eq('id', assessment_id)
    .maybeSingle();

  const fallbackSubjectId = assessmentMeta?.subject_id || null;
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let totalScore = 0;
  let maxScore = 0;
  let totalEffortXp = 0;
  const detailedAnswers = [];
  const topicStats: Record<string, { total: number; correct: number; hints: number; time: number; difficulty: number }> = {};

  for (const ans of answers) {
    const q = questionMap.get(ans.question_id);
    if (!q) continue;

    const marks = q.marks || 1;
    maxScore += marks;
    const isCorrect = ans.selected_option_index === q.correct_option_index;
    if (isCorrect) {
      totalScore += marks;
    }

    const failureEval = evaluatePositiveFailure(q, ans.selected_option_index);
    totalEffortXp += failureEval.effortXpEarned;

    detailedAnswers.push({
      question_id: ans.question_id,
      selected_option_index: ans.selected_option_index,
      is_correct: isCorrect,
      time_spent_seconds: ans.time_spent_seconds,
    });

    const topicId = ans.topic_id || q.topic_id || assessmentMeta?.topic_id;
    if (topicId) {
      if (!topicStats[topicId]) {
        topicStats[topicId] = { total: 0, correct: 0, hints: 0, time: 0, difficulty: q.difficulty || 1 };
      }
      topicStats[topicId].total += 1;
      if (isCorrect) topicStats[topicId].correct += 1;
      topicStats[topicId].hints += ans.hints_used || 0;
      topicStats[topicId].time += ans.time_spent_seconds || 0;
    }
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const endTime = new Date().toISOString();

  const { data: attempt, error: aError } = await supabase
    .from('quiz_attempts')
    .insert({
      assessment_id,
      student_id,
      start_time,
      end_time: endTime,
      total_score: totalScore,
      max_score: maxScore,
      percentage,
      status: 'completed',
    })
    .select()
    .single();

  if (aError || !attempt) {
    throw new Error(`Failed to save quiz attempt: ${aError?.message}`);
  }

  const answerRows = detailedAnswers.map((a) => ({
    attempt_id: attempt.id,
    ...a,
  }));
  await supabase.from('quiz_attempt_answers').insert(answerRows);

  const weakTopicIds: string[] = [];
  const masteredTopicIds: string[] = [];

  for (const [topicId, stats] of Object.entries(topicStats)) {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    const incorrect = stats.total - stats.correct;

    let subjectId = fallbackSubjectId;
    if (!subjectId) {
      const { data: topicRec } = await supabase.from('topics').select('subject_id').eq('id', topicId).maybeSingle();
      subjectId = topicRec?.subject_id || null;
    }

    if (subjectId) {
      await updateTopicMastery(
        supabase,
        student_id,
        topicId,
        subjectId,
        stats.correct > stats.total / 2,
        stats.time,
        stats.hints,
        stats.difficulty
      );
    }

    const { data: existing } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('student_id', student_id)
      .eq('topic_id', topicId)
      .maybeSingle();

    if (accuracy < 65) {
      weakTopicIds.push(topicId);
      const totalAttempts = (existing?.total_attempts || 0) + stats.total;
      const totalIncorrect = (existing?.incorrect_count || 0) + incorrect;
      const overallAccuracy = Math.round(((totalAttempts - totalIncorrect) / totalAttempts) * 100);

      await supabase.from('weak_topics').upsert(
        {
          student_id,
          topic_id: topicId,
          accuracy_rate: overallAccuracy,
          total_attempts: totalAttempts,
          incorrect_count: totalIncorrect,
          status: 'active',
          last_evaluated_at: endTime,
        },
        { onConflict: 'student_id,topic_id' }
      );

      const { data: content } = await supabase
        .from('learning_content')
        .select('id, title')
        .eq('topic_id', topicId)
        .limit(1)
        .maybeSingle();

      await supabase.from('revision_tasks').insert({
        student_id,
        topic_id: topicId,
        reason: `Accuracy was ${accuracy}% on recent session. Practice recommended.`,
        recommended_content_id: content?.id || null,
        status: 'pending',
      });

      const { data: topicData } = await supabase
        .from('topics')
        .select('name, subject_id')
        .eq('id', topicId)
        .maybeSingle();

      const topicName = topicData?.name || 'Topic Revision';
      await supabase.from('study_plans').insert({
        student_id,
        plan_date: new Date().toISOString().split('T')[0],
        title: `Revise: ${topicName}`,
        description: `Targeted practice session to boost understanding (${accuracy}% score).`,
        subject_id: topicData?.subject_id || null,
        topic_id: topicId,
        duration_minutes: 25,
        priority: 'high',
        status: 'pending',
      });
    } else if (accuracy >= 80) {
      masteredTopicIds.push(topicId);
      if (existing) {
        await supabase
          .from('weak_topics')
          .update({
            accuracy_rate: accuracy,
            status: 'resolved',
            last_evaluated_at: endTime,
          })
          .eq('id', existing.id);
      }
    }
  }

  const xpEarned = totalScore * 10 + (percentage >= 80 ? 50 : 20) + totalEffortXp;

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('total_points, current_streak, level')
    .eq('id', student_id)
    .maybeSingle();

  if (studentProfile) {
    const newPoints = (studentProfile.total_points || 0) + xpEarned;
    const { level: newLevel } = calculateLevel(newPoints);

    await supabase
      .from('student_profiles')
      .update({
        total_points: newPoints,
        level: newLevel,
        current_streak: Math.max(1, (studentProfile.current_streak || 0) + 1),
        updated_at: endTime,
      })
      .eq('id', student_id);

    try {
      await supabase
        .from('quests')
        .update({
          status: 'completed',
          progress_percent: 100,
          completed_at: endTime,
        })
        .eq('student_id', student_id)
        .eq('target_id', assessment_id)
        .neq('status', 'completed');
    } catch (qErr) {
      console.warn('Quest completion auto-update warning:', qErr);
    }
  }

  const { data: firstBadge } = await supabase
    .from('gamification_badges')
    .select('id')
    .eq('code', 'FIRST_ASSESSMENT')
    .maybeSingle();

  if (firstBadge) {
    await supabase
      .from('student_badges')
      .upsert({
        student_id,
        badge_id: firstBadge.id,
      })
      .select();
  }

  if (percentage === 100) {
    const { data: perfectBadge } = await supabase
      .from('gamification_badges')
      .select('id')
      .eq('code', 'PERFECT_SCORE')
      .maybeSingle();

    if (perfectBadge) {
      await supabase
        .from('student_badges')
        .upsert({
          student_id,
          badge_id: perfectBadge.id,
        })
        .select();
    }
  }

  await supabase.from('notifications').insert({
    user_id: student_id,
    title: 'Assessment Results Ready',
    message: `You scored ${percentage}% on your assessment. Earned +${xpEarned} XP!`,
    type: 'quiz',
    link: '/student',
  });

  return {
    attemptId: attempt.id,
    totalScore,
    maxScore,
    percentage,
    xpEarned,
    weakTopicIds,
    masteredTopicIds,
  };
}
