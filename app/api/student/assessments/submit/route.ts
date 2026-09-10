// app/api/student/assessments/submit/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processAssessmentEvaluation } from '@/lib/learning-engine';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assessment_id, start_time, answers } = body;

    if (!assessment_id || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid submission data. assessment_id and answers are required.' },
        { status: 400 }
      );
    }

    // Process evaluation securely on the server with user's authenticated ID
    const evaluation = await processAssessmentEvaluation(supabase, {
      assessment_id,
      student_id: user.id,
      start_time: start_time || new Date().toISOString(),
      answers,
    });

    return NextResponse.json({
      success: true,
      ...evaluation,
    });
  } catch (err: any) {
    console.error('Assessment submission error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to evaluate assessment submission' },
      { status: 500 }
    );
  }
}
