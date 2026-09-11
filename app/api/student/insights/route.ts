// app/api/student/insights/route.ts
// Deterministically generates full student learning insights and progress reports from real database data
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRecommendedNextStep } from '@/lib/learning-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      profileRes,
      studentProfileRes,
      aiProfileRes,
      masteryRes,
      weakRes,
      attemptsRes,
      diagnosticRes,
      subjectsRes,
      nextStep,
    ] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
      supabase.from('student_profiles').select('level, total_points, xp, current_streak, streak_days, learning_preferences, support_signals, strengths, ai_partner_name, preferred_language').eq('id', user.id).single(),
      supabase.from('student_ai_profiles').select('*').eq('student_id', user.id).maybeSingle(),
      supabase.from('topic_mastery').select('mastery_score, accuracy, attempts, status, topic:topics(name, subject_id, subject:subjects(name))').eq('student_id', user.id),
      supabase.from('weak_topics').select('topic:topics(name, subject:subjects(name)), accuracy_rate').eq('student_id', user.id).eq('status', 'active'),
      supabase.from('quiz_attempts').select('score, percentage, passed, created_at, answers').eq('student_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('diagnostic_results').select('overall_score, subject_scores, identified_strengths, identified_support_signals, completed_at').eq('student_id', user.id).order('completed_at', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('subjects').select('id, name'),
      getRecommendedNextStep(supabase, user.id),
    ]);

    const sp = studentProfileRes.data;
    const ai = aiProfileRes.data;
    const partnerName = ai?.ai_partner_name || sp?.ai_partner_name || 'Nova';
    const masteries = (masteryRes.data || []) as any[];
    const weakTopics = (weakRes.data || []) as any[];
    const attempts = attemptsRes.data || [];
    const baseline = diagnosticRes.data;
    const subjects = subjectsRes.data || [];

    // 1. Overall Progress
    const totalXp = sp?.total_points || sp?.xp || 0;
    const level = sp?.level || 1;
    const streak = sp?.current_streak || sp?.streak_days || 0;
    const totalQuizzes = attempts.length;

    // 2. Subject Performance Aggregation
    const subjectPerformance = subjects.map((sub) => {
      const subMasteries = masteries.filter((m) => m.topic?.subject_id === sub.id || m.topic?.subject?.name?.toLowerCase() === sub.name.toLowerCase());
      const avgScore = subMasteries.length > 0
        ? Math.round(subMasteries.reduce((acc, m) => acc + (Number(m.mastery_score) || 0), 0) / subMasteries.length)
        : null;

      return {
        id: sub.id,
        name: sub.name,
        mastery: avgScore,
        topicsTracked: subMasteries.length,
      };
    });

    // 3. Topic Mastery Breakdown
    const topicMasteryList = masteries.map((m) => ({
      name: m.topic?.name || 'Topic',
      subject: m.topic?.subject?.name || 'General',
      mastery: Math.round(Number(m.mastery_score) || 0),
      status: m.status,
      attempts: m.attempts || 0,
    })).sort((a, b) => b.mastery - a.mastery);

    // 4. Strengths
    let strengths: string[] = [];
    if (sp?.strengths?.length) strengths.push(...sp.strengths);
    if (baseline?.identified_strengths?.length) strengths.push(...baseline.identified_strengths);
    // Add topics with high mastery >= 80
    masteries.filter((m) => Number(m.mastery_score) >= 80).forEach((m) => {
      if (m.topic?.name && !strengths.includes(m.topic.name)) {
        strengths.push(`${m.topic.name} Mastery`);
      }
    });
    if (streak >= 3) strengths.push('Consistent Study Habit');
    strengths = Array.from(new Set(strengths)).slice(0, 5);

    // 5. Needs More Practice
    let needsPractice: string[] = [];
    weakTopics.forEach((w) => {
      if (w.topic?.name) needsPractice.push(w.topic.name);
    });
    masteries.filter((m) => Number(m.mastery_score) < 60 || m.status === 'needs_support').forEach((m) => {
      if (m.topic?.name && !needsPractice.includes(m.topic.name)) {
        needsPractice.push(m.topic.name);
      }
    });
    needsPractice = Array.from(new Set(needsPractice)).slice(0, 5);

    // 6. Common Mistakes Detected
    const commonMistakes: string[] = [];
    if (ai?.learning_memory?.common_mistakes?.length) {
      commonMistakes.push(...ai.learning_memory.common_mistakes);
    }
    // Scan attempts for mistakes
    for (const att of attempts) {
      if (Array.isArray(att.answers)) {
        for (const ans of att.answers) {
          if (ans && ans.is_correct === false && ans.topic && !commonMistakes.includes(ans.topic)) {
            commonMistakes.push(`${ans.topic} conceptual slip`);
          }
        }
      }
    }

    // 7. Recent Improvement
    const improvements: Array<{ topic: string; before: number; now: number; change: number }> = [];
    if (baseline && baseline.subject_scores) {
      const baselineScores = baseline.subject_scores as Record<string, number>;
      for (const sub of subjectPerformance) {
        if (sub.mastery !== null && baselineScores[sub.name] !== undefined) {
          const change = sub.mastery - baselineScores[sub.name];
          improvements.push({
            topic: sub.name,
            before: baselineScores[sub.name],
            now: sub.mastery,
            change,
          });
        }
      }
    }

    // 8. Learning Style
    const habits = ai?.learning_memory?.learning_habits || [];
    const learningStyle = {
      preferredLanguage: ai?.preferred_language || sp?.preferred_language || 'en',
      conversationStyle: ai?.conversation_style || 'friendly',
      explanationStyle: ai?.explanation_style || 'examples',
      hintFirst: ai?.interaction_preferences?.hint_first !== false,
      habits: habits.length > 0 ? habits : ['Prefers examples and structured step-by-step guidance'],
    };

    return NextResponse.json({
      success: true,
      insights: {
        studentName: profileRes.data?.full_name || 'Cadet',
        partnerName,
        hasSufficientData: attempts.length > 0 || masteries.length > 0,
        overall: {
          xp: totalXp,
          level,
          streak,
          quizzesTaken: totalQuizzes,
        },
        subjectPerformance,
        topicMasteryList,
        strengths,
        needsPractice,
        commonMistakes: commonMistakes.slice(0, 4),
        improvements,
        learningStyle,
        nextBestAction: {
          title: nextStep.title,
          description: nextStep.description,
          reason: nextStep.reason,
          targetUrl: nextStep.targetUrl,
        },
      },
    });
  } catch (err: any) {
    console.error('[Insights API] Error:', err);
    return NextResponse.json({ error: 'Failed to generate learning insights' }, { status: 500 });
  }
}
