// app/api/student/practice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordPracticeAttempt } from '@/lib/learning-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    // 1. Fetch Topic details
    const { data: topic, error: tErr } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .eq('id', topicId)
      .single();

    if (tErr || !topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // 2. Fetch practice questions specifically for this topic
    let { data: questions } = await supabase
      .from('questions')
      .select('id, assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks')
      .eq('topic_id', topicId)
      .limit(10);

    // If no questions attached directly to topic, look for questions in the same subject
    if (!questions || questions.length === 0) {
      const { data: fallbackQuestions } = await supabase
        .from('questions')
        .select('id, assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks')
        .limit(5);
      questions = fallbackQuestions || [];
    }

    // 3. Fetch student's past attempts for this topic
    const { data: attempts } = await supabase
      .from('practice_attempts')
      .select('*')
      .eq('student_id', user.id)
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 4. Fetch current topic mastery
    const { data: mastery } = await supabase
      .from('topic_mastery')
      .select('*')
      .eq('student_id', user.id)
      .eq('topic_id', topicId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      topic,
      questions,
      attempts: attempts || [],
      mastery: mastery || null,
    });
  } catch (error: any) {
    console.error('Practice GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch practice data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic_id, question_id, selected_option_index, hints_used, time_spent_seconds } = body;

    if (!topic_id || !question_id || selected_option_index === undefined) {
      return NextResponse.json({ error: 'topic_id, question_id, and selected_option_index are required' }, { status: 400 });
    }

    const result = await recordPracticeAttempt(supabase, user.id, {
      topic_id,
      question_id,
      selected_option_index,
      hints_used: hints_used || 0,
      time_spent_seconds: time_spent_seconds || 15,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Practice POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit practice attempt' }, { status: 500 });
  }
}
