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
