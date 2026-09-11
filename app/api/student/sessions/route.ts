// app/api/student/sessions/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import {
  generateSmartSessionPlan,
  createStudySession,
  completeStudySession,
} from '@/lib/learning-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const duration = parseInt(searchParams.get('duration') || '15', 10);

    const plan = await generateSmartSessionPlan(supabase, user.id, duration);

    // Also fetch recent sessions
    const { data: recentSessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      plan,
      recentSessions: recentSessions || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const durationMinutes = body.durationMinutes || 15;

    // Generate or use existing plan
    const plan = body.plan || (await generateSmartSessionPlan(supabase, user.id, durationMinutes));
    const session = await createStudySession(supabase, user.id, plan);

    return NextResponse.json({
      success: true,
      session,
      plan,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, xpEarned = 50 } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    const completed = await completeStudySession(supabase, sessionId, user.id, xpEarned);

    return NextResponse.json({
      success: completed,
      message: completed ? 'Study session completed and XP awarded!' : 'Session update skipped',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
