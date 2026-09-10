// app/api/student/wellbeing/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { feeling, sessionNotes } = await request.json();

    if (!feeling || !['good', 'okay', 'difficult', 'overwhelmed'].includes(feeling)) {
      return NextResponse.json(
        { success: false, error: 'Valid feeling signal required (good, okay, difficult, overwhelmed).' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('wellbeing_signals')
      .upsert({
        student_id: user.id,
        feeling,
        session_notes: sessionNotes || null,
        recorded_date: today,
        created_at: new Date().toISOString(),
      }, { onConflict: 'student_id,recorded_date' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('wellbeing_signals insert warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      feeling,
      message: 'Learning experience signal recorded.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
