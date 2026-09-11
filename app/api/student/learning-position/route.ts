// app/api/student/learning-position/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStudentLearningPosition, saveStudentLearningPosition } from '@/lib/learning-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId') || undefined;

    const position = await getStudentLearningPosition(supabase, user.id, subjectId);
    return NextResponse.json({ success: true, position });
  } catch (error: any) {
    console.error('Get learning position error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch learning position' }, { status: 500 });
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
    const { subject_id, module_id, chapter_id, topic_id, lesson_id, lesson_title, step_number, total_steps, status } = body;

    if (!subject_id) {
      return NextResponse.json({ error: 'subject_id is required' }, { status: 400 });
    }

    const savedPosition = await saveStudentLearningPosition(supabase, user.id, {
      subject_id,
      module_id,
      chapter_id,
      topic_id,
      lesson_id,
      lesson_title,
      step_number,
      total_steps,
      status,
    });

    return NextResponse.json({ success: true, position: savedPosition });
  } catch (error: any) {
    console.error('Save learning position error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save learning position' }, { status: 500 });
  }
}
