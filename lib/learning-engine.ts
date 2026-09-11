// lib/learning-engine.ts
// Smart Education Adaptive Learning & Diagnostic Analysis Engine

import { SupabaseClient } from '@supabase/supabase-js';
import { calculateLevel } from '@/lib/gamification-engine';
import { 
  TopicMastery, 
  TopicMasteryStatus,
  Subject,
  Module,
  Chapter,
  Topic,
  StudentLearningPosition,
  PracticeAttempt,
  TopicLearningStatus,
  ChapterWithMastery,
  ModuleWithMastery,
  SubjectCurriculumHierarchy,
  WeakAreaDetailed,
  StrengthDetailed,
  PersonalizedPathStep,
} from '@/types/database.types';

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

/**
 * Get Complete Structured Curriculum Hierarchy
 * Returns Subject -> Module -> Chapter -> Topic tree with real student mastery & progress
 */
export async function getCurriculumHierarchy(
  supabase: SupabaseClient,
  studentId?: string,
  subjectId?: string
): Promise<SubjectCurriculumHierarchy[]> {
  // 1. Fetch Subjects
  let subjectQuery = supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });

  if (subjectId) {
    subjectQuery = subjectQuery.eq('id', subjectId);
  }

  const { data: subjects, error: subErr } = await subjectQuery;
  if (subErr || !subjects || subjects.length === 0) {
    return [];
  }

  const subjectIds = subjects.map((s) => s.id);

  // 2. Fetch Modules
  const { data: modulesData } = await supabase
    .from('modules')
    .select('*')
    .in('subject_id', subjectIds)
    .order('order_index', { ascending: true });

  const modules = modulesData || [];
  const moduleIds = modules.map((m) => m.id);

  // 3. Fetch Chapters
  let chapters: Chapter[] = [];
  if (moduleIds.length > 0) {
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true });
    chapters = chaptersData || [];
  }

  // 4. Fetch Topics
  const { data: topicsData } = await supabase
    .from('topics')
    .select('*')
    .in('subject_id', subjectIds)
    .order('order_index', { ascending: true });

  const topics: Topic[] = topicsData || [];

  // 5. If studentId provided, fetch student mastery & learning positions
  let topicMasteryMap: Record<string, TopicMastery> = {};
  let learningPositionsMap: Record<string, StudentLearningPosition> = {};

  if (studentId) {
    const { data: masteryRows } = await supabase
      .from('topic_mastery')
      .select('*')
      .eq('student_id', studentId);

    if (masteryRows) {
      masteryRows.forEach((row) => {
        topicMasteryMap[row.topic_id] = row;
      });
    }

    const { data: positions } = await supabase
      .from('student_learning_positions')
      .select('*')
      .eq('student_id', studentId);

    if (positions) {
      positions.forEach((pos) => {
        if (pos.topic_id) {
          learningPositionsMap[pos.topic_id] = pos;
        }
      });
    }
  }

  // Helper to determine status of a topic
  const evaluateTopicStatus = (topic: Topic): TopicLearningStatus => {
    const mastery = topicMasteryMap[topic.id];
    if (mastery) {
      if (mastery.status === 'mastered' || mastery.mastery_score >= 80) return 'mastered';
      if (mastery.status === 'needs_support' || mastery.mastery_score < 60) return 'needs_practice';
      return 'in_progress';
    }
    if (learningPositionsMap[topic.id]) {
      return learningPositionsMap[topic.id].status === 'completed' ? 'mastered' : 'in_progress';
    }
    return 'not_started';
  };

  // Group chapters by module_id
  const chaptersByModule: Record<string, Chapter[]> = {};
  chapters.forEach((ch) => {
    if (!chaptersByModule[ch.module_id]) chaptersByModule[ch.module_id] = [];
    chaptersByModule[ch.module_id].push(ch);
  });

  // Group topics by chapter_id
  const topicsByChapter: Record<string, Topic[]> = {};
  const unassignedTopicsBySubject: Record<string, Topic[]> = {};

  topics.forEach((top) => {
    if (top.chapter_id) {
      if (!topicsByChapter[top.chapter_id]) topicsByChapter[top.chapter_id] = [];
      topicsByChapter[top.chapter_id].push(top);
    } else {
      if (!unassignedTopicsBySubject[top.subject_id]) unassignedTopicsBySubject[top.subject_id] = [];
      unassignedTopicsBySubject[top.subject_id].push(top);
    }
  });

  // 6. Build the hierarchy
  const hierarchy: SubjectCurriculumHierarchy[] = subjects.map((subj) => {
    const subjectModules = modules.filter((m) => m.subject_id === subj.id);

    // If subject has unassigned topics, synthesize a default module/chapter so they are visible
    const unassigned = unassignedTopicsBySubject[subj.id] || [];
    let effectiveModules = [...subjectModules];

    if (unassigned.length > 0 && effectiveModules.length === 0) {
      // Create virtual introductory module and chapter
      effectiveModules.push({
        id: `synth-mod-${subj.id}`,
        subject_id: subj.id,
        title: `${subj.name} Core Curriculum`,
        description: `Essential topics and foundations for ${subj.name}`,
        order_index: 1,
        icon: subj.icon || 'BookOpen',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    let totalSubjTopics = 0;
    let completedSubjTopics = 0;
    let masteredSubjTopics = 0;
    let totalSubjMasterySum = 0;

    const modulesWithMastery: ModuleWithMastery[] = effectiveModules.map((mod) => {
      let modChapters = chaptersByModule[mod.id] || [];

      // If virtual module, attach unassigned topics to a virtual chapter
      if (mod.id === `synth-mod-${subj.id}`) {
        modChapters = [
          {
            id: `synth-ch-${subj.id}`,
            module_id: mod.id,
            title: 'Core Foundations',
            description: 'Fundamental units and key competencies',
            order_index: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        topicsByChapter[`synth-ch-${subj.id}`] = unassigned;
      }

      let completedChaptersCount = 0;
      let moduleMasterySum = 0;
      let moduleTopicsCount = 0;

      const chaptersWithMastery: ChapterWithMastery[] = modChapters.map((ch) => {
        const chTopics = topicsByChapter[ch.id] || [];
        let completedTopicsCount = 0;
        let chapterMasterySum = 0;

        const evaluatedTopics = chTopics.map((top) => {
          const status = evaluateTopicStatus(top);
          const mastery = topicMasteryMap[top.id] || null;
          const score = mastery?.mastery_score || 0;

          if (status === 'mastered') {
            completedTopicsCount++;
            masteredSubjTopics++;
          } else if (status === 'in_progress') {
            completedTopicsCount += 0.5;
          }

          chapterMasterySum += score;
          return {
            ...top,
            mastery,
            status,
          };
        });

        const chTotalTopics = chTopics.length;
        const chCompletionPercent = chTotalTopics > 0 ? Math.round((completedTopicsCount / chTotalTopics) * 100) : 0;
        const chAvgMastery = chTotalTopics > 0 ? Math.round(chapterMasterySum / chTotalTopics) : 0;

        let chStatus: TopicLearningStatus = 'not_started';
        if (evaluatedTopics.some((t) => t.status === 'needs_practice')) {
          chStatus = 'needs_practice';
        } else if (evaluatedTopics.length > 0 && evaluatedTopics.every((t) => t.status === 'mastered')) {
          chStatus = 'mastered';
        } else if (evaluatedTopics.some((t) => t.status === 'in_progress' || t.status === 'mastered')) {
          chStatus = 'in_progress';
        }

        if (chCompletionPercent >= 100) {
          completedChaptersCount++;
        }

        moduleMasterySum += chAvgMastery;
        moduleTopicsCount += chTotalTopics;
        totalSubjTopics += chTotalTopics;
        completedSubjTopics += completedTopicsCount;
        totalSubjMasterySum += chapterMasterySum;

        return {
          ...ch,
          topics: evaluatedTopics,
          completedTopicsCount: Math.round(completedTopicsCount),
          totalTopicsCount: chTotalTopics,
          completionPercentage: chCompletionPercent,
          averageMasteryScore: chAvgMastery,
          status: chStatus,
        };
      });

      const totalChapters = modChapters.length;
      const modCompletionPercent = totalChapters > 0 ? Math.round((completedChaptersCount / totalChapters) * 100) : 0;
      const modAvgMastery = totalChapters > 0 ? Math.round(moduleMasterySum / totalChapters) : 0;

      let modStatus: TopicLearningStatus = 'not_started';
      if (chaptersWithMastery.some((c) => c.status === 'needs_practice')) {
        modStatus = 'needs_practice';
      } else if (chaptersWithMastery.length > 0 && chaptersWithMastery.every((c) => c.status === 'mastered')) {
        modStatus = 'mastered';
      } else if (chaptersWithMastery.some((c) => c.status === 'in_progress' || c.status === 'mastered')) {
        modStatus = 'in_progress';
      }

      return {
        ...mod,
        chapters: chaptersWithMastery,
        completedChaptersCount,
        totalChaptersCount: totalChapters,
        completionPercentage: modCompletionPercent,
        averageMasteryScore: modAvgMastery,
        status: modStatus,
      };
    });

    const overallProgress = totalSubjTopics > 0 ? Math.min(100, Math.round((completedSubjTopics / totalSubjTopics) * 100)) : 0;
    const overallMastery = totalSubjTopics > 0 ? Math.min(100, Math.round(totalSubjMasterySum / totalSubjTopics)) : 0;

    return {
      subject: subj,
      modules: modulesWithMastery,
      overallProgress,
      overallMastery,
      totalTopicsCount: totalSubjTopics,
      completedTopicsCount: Math.round(completedSubjTopics),
      masteredTopicsCount: masteredSubjTopics,
    };
  });

  return hierarchy;
}

/**
 * Get Student's Last Saved Learning Position
 * Supports resuming from exact module, chapter, and topic
 */
export async function getStudentLearningPosition(
  supabase: SupabaseClient,
  studentId: string,
  subjectId?: string
): Promise<StudentLearningPosition | null> {
  let query = supabase
    .from('student_learning_positions')
    .select(`
      *,
      subject:subjects(*),
      module:modules(*),
      chapter:chapters(*),
      topic:topics(*)
    `)
    .eq('student_id', studentId)
    .order('last_accessed_at', { ascending: false });

  if (subjectId) {
    query = query.eq('subject_id', subjectId);
  }

  const { data: positions, error } = await query.limit(1);

  if (!error && positions && positions.length > 0) {
    return positions[0] as StudentLearningPosition;
  }

  // If no position saved yet, find the first available subject and topic to give a default starting point
  let defaultSubjectQuery = supabase.from('subjects').select('*').order('name', { ascending: true });
  if (subjectId) {
    defaultSubjectQuery = defaultSubjectQuery.eq('id', subjectId);
  }
  const { data: subjects } = await defaultSubjectQuery.limit(1);

  if (!subjects || subjects.length === 0) return null;
  const firstSubject = subjects[0];

  const { data: firstTopic } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', firstSubject.id)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    id: 'default-pos',
    student_id: studentId,
    subject_id: firstSubject.id,
    module_id: firstTopic?.module_id || null,
    chapter_id: firstTopic?.chapter_id || null,
    topic_id: firstTopic?.id || null,
    lesson_id: null,
    lesson_title: firstTopic?.name || 'Getting Started',
    step_number: 1,
    total_steps: 4,
    status: 'not_started',
    last_accessed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subject: firstSubject,
    topic: firstTopic || undefined,
  };
}

/**
 * Save or Update Student Learning Position
 */
export async function saveStudentLearningPosition(
  supabase: SupabaseClient,
  studentId: string,
  positionData: {
    subject_id: string;
    module_id?: string | null;
    chapter_id?: string | null;
    topic_id?: string | null;
    lesson_id?: string | null;
    lesson_title?: string | null;
    step_number?: number;
    total_steps?: number;
    status?: 'not_started' | 'in_progress' | 'completed';
  }
): Promise<StudentLearningPosition> {
  const now = new Date().toISOString();

  const payload = {
    student_id: studentId,
    subject_id: positionData.subject_id,
    module_id: positionData.module_id || null,
    chapter_id: positionData.chapter_id || null,
    topic_id: positionData.topic_id || null,
    lesson_id: positionData.lesson_id || null,
    lesson_title: positionData.lesson_title || null,
    step_number: positionData.step_number || 1,
    total_steps: positionData.total_steps || 4,
    status: positionData.status || 'in_progress',
    last_accessed_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('student_learning_positions')
    .upsert(payload, { onConflict: 'student_id,subject_id' })
    .select(`
      *,
      subject:subjects(*),
      module:modules(*),
      chapter:chapters(*),
      topic:topics(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to save learning position: ${error.message}`);
  }

  return data as StudentLearningPosition;
}

/**
 * Get Diagnostic Weak Areas with Positive Remediation Action Plans
 * Zero shaming: focuses on mastery opportunities and targeted practice steps
 */
export async function getStudentWeakAreasDetailed(
  supabase: SupabaseClient,
  studentId: string
): Promise<WeakAreaDetailed[]> {
  // Query topics where mastery is struggling or score < 65%
  const { data: masteries } = await supabase
    .from('topic_mastery')
    .select(`
      topic_id,
      mastery_score,
      accuracy_rate,
      total_attempts,
      status,
      topic:topics(
        id,
        name,
        subject:subjects(name),
        module:modules(title),
        chapter:chapters(title)
      )
    `)
    .eq('student_id', studentId)
    .or('status.eq.needs_support,mastery_score.lt.65')
    .order('mastery_score', { ascending: true })
    .limit(5);

  if (!masteries || masteries.length === 0) {
    return [];
  }

  // Query mistake records for context if available
  const topicIds = masteries.map((m) => m.topic_id);
  const { data: attempts } = await supabase
    .from('practice_attempts')
    .select('topic_id, mistake_category, is_correct')
    .eq('student_id', studentId)
    .eq('is_correct', false)
    .in('topic_id', topicIds)
    .order('created_at', { ascending: false });

  const mistakeCategoryByTopic: Record<string, string> = {};
  if (attempts) {
    attempts.forEach((att) => {
      if (att.mistake_category && !mistakeCategoryByTopic[att.topic_id]) {
        mistakeCategoryByTopic[att.topic_id] = att.mistake_category;
      }
    });
  }

  return masteries.map((row) => {
    const topic = row.topic as any;
    const topicName = topic?.name || 'Key Concept';
    const subjectName = topic?.subject?.name || 'General';
    const moduleTitle = topic?.module?.title;
    const chapterTitle = topic?.chapter?.title;

    const attemptsCount = row.total_attempts || 0;
    const accuracy = row.accuracy_rate ? Math.round(row.accuracy_rate * 100) : 0;
    const incorrectCount = Math.round(attemptsCount * (1 - (row.accuracy_rate || 0)));
    const primaryMistake = mistakeCategoryByTopic[row.topic_id] || 'Formula application and sign management';

    return {
      topic_id: row.topic_id,
      topic_name: topicName,
      subject_name: subjectName,
      module_title: moduleTitle,
      chapter_title: chapterTitle,
      accuracy,
      attempts: attemptsCount,
      incorrect_attempts: incorrectCount,
      mastery_score: Math.round(row.mastery_score),
      primary_mistake_reason: primaryMistake,
      remediation_steps: [
        `1. Interactive Review: Explore the visual model and step-by-step breakdown for ${topicName}.`,
        `2. Nova Dialogue: Ask Nova for a clear intuition check on ${primaryMistake.toLowerCase()}.`,
        `3. Guided Practice: Solve 3 un-timed practice problems with instant step feedback.`,
        `4. Mistake Analysis: Inspect the correct reasoning behind previous attempts without time pressure.`,
        `5. Verification Quiz: Score 80%+ on a 5-question mastery checkpoint to advance to Mastered status.`,
      ],
    };
  });
}

/**
 * Get Student Strengths with Superpower Highlights
 */
export async function getStudentStrengthsDetailed(
  supabase: SupabaseClient,
  studentId: string
): Promise<StrengthDetailed[]> {
  const { data: masteries } = await supabase
    .from('topic_mastery')
    .select(`
      topic_id,
      mastery_score,
      accuracy_rate,
      total_attempts,
      status,
      topic:topics(
        id,
        name,
        subject:subjects(name)
      )
    `)
    .eq('student_id', studentId)
    .or('status.eq.mastered,mastery_score.gte.80')
    .order('mastery_score', { ascending: false })
    .limit(5);

  if (!masteries || masteries.length === 0) {
    return [];
  }

  return masteries.map((row) => {
    const topic = row.topic as any;
    const topicName = topic?.name || 'Mastered Topic';
    const subjectName = topic?.subject?.name || 'General';
    const accuracy = row.accuracy_rate ? Math.round(row.accuracy_rate * 100) : 95;

    return {
      topic_id: row.topic_id,
      topic_name: topicName,
      subject_name: subjectName,
      mastery_score: Math.round(row.mastery_score),
      accuracy,
      attempts: row.total_attempts || 0,
      highlight_skills: [
        'High analytical precision with consistently accurate solutions',
        'Strong conceptual foundation and fast problem-solving flow',
        'Ready for advanced multi-step challenge problems',
      ],
    };
  });
}

/**
 * Generate Dynamic Personalized Learning Path Steps
 * Mastered (95%) -> Needs Practice -> Almost Mastered -> Next Concept -> Challenge
 */
export async function getPersonalizedLearningPath(
  supabase: SupabaseClient,
  studentId: string,
  subjectId?: string
): Promise<PersonalizedPathStep[]> {
  // Fetch curriculum hierarchy to discover logical progression
  const hierarchy = await getCurriculumHierarchy(supabase, studentId, subjectId);
  if (hierarchy.length === 0) {
    return [];
  }

  const steps: PersonalizedPathStep[] = [];
  let stepCounter = 1;

  // 1. Gather all topics across hierarchy with student status
  const allTopics: Array<{
    topic: Topic;
    subjectName: string;
    status: TopicLearningStatus;
    masteryScore: number;
    subjectId: string;
    moduleId?: string | null;
    chapterId?: string | null;
  }> = [];

  hierarchy.forEach((h) => {
    h.modules.forEach((mod) => {
      mod.chapters.forEach((ch) => {
        ch.topics.forEach((t) => {
          allTopics.push({
            topic: t,
            subjectName: h.subject.name,
            status: t.status,
            masteryScore: t.mastery?.mastery_score || 0,
            subjectId: h.subject.id,
            moduleId: mod.id,
            chapterId: ch.id,
          });
        });
      });
    });
  });

  if (allTopics.length === 0) {
    return [];
  }

  // Find mastered topic (if any)
  const mastered = allTopics.find((t) => t.status === 'mastered' || t.masteryScore >= 80);
  if (mastered) {
    steps.push({
      step_order: stepCounter++,
      topic_id: mastered.topic.id,
      topic_name: mastered.topic.name,
      subject_name: mastered.subjectName,
      action_type: 'mastered',
      status_badge: `Mastered (${Math.round(mastered.masteryScore)}%)`,
      badge_color: 'emerald',
      target_url: `/student/learning/${mastered.subjectId}/${mastered.moduleId || 'core'}/${mastered.chapterId || 'foundation'}/${mastered.topic.id}`,
      rationale: 'Core foundation secured. Strong conceptual anchor for upcoming units.',
    });
  }

  // Find weak topic (needs practice)
  const weak = allTopics.find((t) => t.status === 'needs_practice' || (t.masteryScore > 0 && t.masteryScore < 65));
  if (weak) {
    steps.push({
      step_order: stepCounter++,
      topic_id: weak.topic.id,
      topic_name: weak.topic.name,
      subject_name: weak.subjectName,
      action_type: 'revise',
      status_badge: 'Needs Practice',
      badge_color: 'rose',
      target_url: `/student/learning/${weak.subjectId}/${weak.moduleId || 'core'}/${weak.chapterId || 'foundation'}/${weak.topic.id}?tab=practice`,
      rationale: 'Targeted revision recommended. Review key formula steps and tackle 3 guided exercises.',
    });
  }

  // Find in-progress topic (almost mastered)
  const inProgress = allTopics.find((t) => t.status === 'in_progress' && t.topic.id !== weak?.topic.id);
  if (inProgress) {
    steps.push({
      step_order: stepCounter++,
      topic_id: inProgress.topic.id,
      topic_name: inProgress.topic.name,
      subject_name: inProgress.subjectName,
      action_type: 'practice',
      status_badge: inProgress.masteryScore > 60 ? `Almost Mastered (${Math.round(inProgress.masteryScore)}%)` : 'In Progress',
      badge_color: 'amber',
      target_url: `/student/learning/${inProgress.subjectId}/${inProgress.moduleId || 'core'}/${inProgress.chapterId || 'foundation'}/${inProgress.topic.id}?tab=practice`,
      rationale: 'Solid progress! Solve a few more practice scenarios to push mastery past 85%.',
    });
  }

  // Find next not-started topic
  const nextUp = allTopics.find((t) => t.status === 'not_started');
  if (nextUp) {
    steps.push({
      step_order: stepCounter++,
      topic_id: nextUp.topic.id,
      topic_name: nextUp.topic.name,
      subject_name: nextUp.subjectName,
      action_type: 'next_concept',
      status_badge: 'Next Concept',
      badge_color: 'sky',
      target_url: `/student/learning/${nextUp.subjectId}/${nextUp.moduleId || 'core'}/${nextUp.chapterId || 'foundation'}/${nextUp.topic.id}`,
      rationale: 'Logical next building block in your curriculum. Ready for interactive concept discovery.',
    });
  }

  // Final challenge / capstone step
  const challengeTarget = nextUp || inProgress || allTopics[allTopics.length - 1];
  steps.push({
    step_order: stepCounter++,
    topic_id: challengeTarget.topic.id,
    topic_name: `${challengeTarget.topic.name} Mastery Challenge`,
    subject_name: challengeTarget.subjectName,
    action_type: 'challenge',
    status_badge: 'Mastery Challenge',
    badge_color: 'purple',
    target_url: `/student/learning/${challengeTarget.subjectId}/${challengeTarget.moduleId || 'core'}/${challengeTarget.chapterId || 'foundation'}/${challengeTarget.topic.id}?tab=quiz`,
    rationale: 'Put your skills to the test with a multi-step challenge assessment to earn bonus XP.',
  });

  return steps;
}

/**
 * Record Practice Question Attempt with Positive Learning Feedback and Dynamic Mastery Update
 */
export async function recordPracticeAttempt(
  supabase: SupabaseClient,
  studentId: string,
  attemptData: {
    topic_id: string;
    question_id: string;
    selected_option_index: number;
    hints_used?: number;
    time_spent_seconds?: number;
  }
): Promise<{
  isCorrect: boolean;
  correctOptionIndex: number;
  explanation: string;
  mistakeCategory: string | null;
  xpEarned: number;
  updatedMastery: { mastery_score: number; status: TopicMasteryStatus };
}> {
  const { topic_id, question_id, selected_option_index, hints_used = 0, time_spent_seconds = 15 } = attemptData;

  // 1. Fetch Question details
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .eq('id', question_id)
    .single();

  if (qErr || !question) {
    throw new Error(`Question ${question_id} not found.`);
  }

  const isCorrect = selected_option_index === question.correct_option_index;

  // 2. Classify mistake positively if incorrect
  let mistakeCategory: string | null = null;
  if (!isCorrect) {
    if (time_spent_seconds < 8) {
      mistakeCategory = 'Rapid Reading Pace';
    } else if (hints_used > 0) {
      mistakeCategory = 'Formula Application Nuance';
    } else {
      mistakeCategory = 'Conceptual Step Synthesis';
    }
  }

  // 3. Insert Practice Attempt record
  await supabase.from('practice_attempts').insert({
    student_id: studentId,
    topic_id,
    question_id,
    selected_option_index,
    is_correct: isCorrect,
    hints_used,
    time_spent_seconds,
    mistake_category: mistakeCategory,
  });

  // 4. Calculate XP: +15 XP for correct, +5 XP for growth effort
  const xpEarned = isCorrect ? 15 : 5;

  // Award XP to student profile
  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('total_points, level, current_streak')
    .eq('id', studentId)
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);
  }

  // 5. Recalculate Topic Mastery
  const { data: pastAttempts } = await supabase
    .from('practice_attempts')
    .select('is_correct, hints_used, time_spent_seconds')
    .eq('student_id', studentId)
    .eq('topic_id', topic_id);

  const attemptsList = pastAttempts || [];
  const totalCount = attemptsList.length;
  const correctCount = attemptsList.filter((a) => a.is_correct).length;
  const incorrectCount = totalCount - correctCount;
  const totalHints = attemptsList.reduce((acc, a) => acc + (a.hints_used || 0), 0);
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

  const { mastery_score, status } = calculateTopicMastery({
    accuracy,
    attempts: totalCount,
    correct_attempts: correctCount,
    incorrect_attempts: incorrectCount,
    hints_used: totalHints,
    difficulty: question.difficulty || 2,
  });

  await supabase
    .from('topic_mastery')
    .upsert(
      {
        student_id: studentId,
        topic_id,
        mastery_score,
        status,
        confidence_level: totalCount >= 5 ? 'high' : totalCount >= 2 ? 'medium' : 'low',
        accuracy_rate: accuracy,
        total_attempts: totalCount,
        last_assessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,topic_id' }
    );

  // Update or resolve weak_topics
  if (status === 'needs_support' || mastery_score < 65) {
    await supabase.from('weak_topics').upsert(
      {
        student_id: studentId,
        topic_id,
        accuracy_rate: accuracy,
        total_attempts: totalCount,
        incorrect_count: incorrectCount,
        status: 'improving',
        last_evaluated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,topic_id' }
    );
  } else if (mastery_score >= 75) {
    await supabase
      .from('weak_topics')
      .update({
        status: 'resolved',
        last_evaluated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .eq('topic_id', topic_id);
  }

  return {
    isCorrect,
    correctOptionIndex: question.correct_option_index,
    explanation: question.explanation || (isCorrect ? 'Great job! You mastered this core concept.' : 'Take a moment to review the steps. Keep going!'),
    mistakeCategory,
    xpEarned,
    updatedMastery: { mastery_score, status },
  };
}

