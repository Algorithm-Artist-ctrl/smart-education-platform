// lib/learning-engine.ts
// Smart Education Adaptive Learning & Diagnostic Analysis Engine

import { SupabaseClient } from '@supabase/supabase-js';

export interface AssessmentSubmissionData {
  assessment_id: string;
  student_id: string;
  start_time: string;
  answers: {
    question_id: string;
    topic_id?: string | null;
    selected_option_index: number;
    time_spent_seconds: number;
  }[];
}

export async function processAssessmentEvaluation(
  supabase: SupabaseClient,
  submission: AssessmentSubmissionData
) {
  const { assessment_id, student_id, start_time, answers } = submission;

  // 1. Fetch questions for the assessment
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, topic_id, correct_option_index, marks, difficulty')
    .eq('assessment_id', assessment_id);

  if (qError || !questions) {
    throw new Error(`Failed to fetch questions: ${qError?.message}`);
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let totalScore = 0;
  let maxScore = 0;
  const detailedAnswers = [];
  const topicStats: Record<string, { total: number; correct: number }> = {};

  for (const ans of answers) {
    const q = questionMap.get(ans.question_id);
    if (!q) continue;

    const marks = q.marks || 1;
    maxScore += marks;
    const isCorrect = ans.selected_option_index === q.correct_option_index;
    if (isCorrect) {
      totalScore += marks;
    }

    detailedAnswers.push({
      question_id: ans.question_id,
      selected_option_index: ans.selected_option_index,
      is_correct: isCorrect,
      time_spent_seconds: ans.time_spent_seconds,
    });

    const topicId = ans.topic_id || q.topic_id;
    if (topicId) {
      if (!topicStats[topicId]) {
        topicStats[topicId] = { total: 0, correct: 0 };
      }
      topicStats[topicId].total += 1;
      if (isCorrect) topicStats[topicId].correct += 1;
    }
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const endTime = new Date().toISOString();

  // 2. Create quiz_attempt record
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

  // 3. Insert individual question responses
  const answerRows = detailedAnswers.map((a) => ({
    attempt_id: attempt.id,
    ...a,
  }));
  await supabase.from('quiz_attempt_answers').insert(answerRows);

  // 4. Analyze Weak Topics & Recommend Next Actions
  const weakTopicIds: string[] = [];
  const masteredTopicIds: string[] = [];

  for (const [topicId, stats] of Object.entries(topicStats)) {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    const incorrect = stats.total - stats.correct;

    // Check existing weak topic record
    const { data: existing } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('student_id', student_id)
      .eq('topic_id', topicId)
      .single();

    if (accuracy < 65) {
      weakTopicIds.push(topicId);
      const totalAttempts = (existing?.total_attempts || 0) + stats.total;
      const totalIncorrect = (existing?.incorrect_count || 0) + incorrect;
      const overallAccuracy = Math.round(((totalAttempts - totalIncorrect) / totalAttempts) * 100);

      await supabase.from('weak_topics').upsert({
        student_id,
        topic_id: topicId,
        accuracy_rate: overallAccuracy,
        total_attempts: totalAttempts,
        incorrect_count: totalIncorrect,
        status: 'active',
        last_evaluated_at: endTime,
      });

      // Find recommended learning content for this weak topic
      const { data: content } = await supabase
        .from('learning_content')
        .select('id, title')
        .eq('topic_id', topicId)
        .limit(1)
        .single();

      // Create a Revision Task
      await supabase.from('revision_tasks').insert({
        student_id,
        topic_id: topicId,
        reason: `Accuracy was ${accuracy}% on recent quiz. Practice recommended.`,
        recommended_content_id: content?.id || null,
        status: 'pending',
      });

      // Auto-schedule in Daily Study Plan for today/tomorrow
      const { data: topicData } = await supabase
        .from('topics')
        .select('name, subject_id')
        .eq('id', topicId)
        .single();

      const topicName = topicData?.name || 'Topic Revision';
      await supabase.from('study_plans').insert({
        student_id,
        plan_date: new Date().toISOString().split('T')[0],
        title: `Revise: ${topicName}`,
        description: `Targeted revision session to improve weak concept understanding (${accuracy}% score).`,
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

  // 5. Update Student Points & Streak
  const xpEarned = totalScore * 10 + (percentage >= 80 ? 50 : 20);

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('total_points, current_streak, level')
    .eq('id', student_id)
    .single();

  if (studentProfile) {
    const newPoints = (studentProfile.total_points || 0) + xpEarned;
    const newLevel = Math.floor(newPoints / 250) + 1;

    await supabase
      .from('student_profiles')
      .update({
        total_points: newPoints,
        level: newLevel,
        current_streak: Math.max(1, studentProfile.current_streak || 1),
        updated_at: endTime,
      })
      .eq('id', student_id);
  }

  // 6. Award Badges
  // Check FIRST_ASSESSMENT
  const { data: firstBadge } = await supabase
    .from('gamification_badges')
    .select('id')
    .eq('code', 'FIRST_ASSESSMENT')
    .single();

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
      .single();

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

  // 7. Push notification
  await supabase.from('notifications').insert({
    user_id: student_id,
    title: 'Quiz Results Ready',
    message: `You scored ${percentage}% on your assessment. Earned +${xpEarned} XP!`,
    type: 'quiz',
    link: `/student`,
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
