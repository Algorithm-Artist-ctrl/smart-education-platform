// app/api/student/missions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mission_id } = body;
    const notes = (body.observation_notes || body.reflection_text || '').trim();
    const media = body.media_url || body.evidence_url || null;

    if (!mission_id || !notes) {
      return NextResponse.json(
        { error: 'Mission ID and observation notes are required.' },
        { status: 400 }
      );
    }

    const xpEarned = 75;
    const coinsEarned = 20;

    // 1. Insert or update mission_submission
    const { data: submission, error: subError } = await supabase
      .from('mission_submissions')
      .upsert(
        {
          student_id: user.id,
          mission_id,
          observation_notes: notes,
          media_url: media,
          status: 'completed',
          xp_earned: xpEarned,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'mission_id,student_id' }
      )
      .select()
      .single();

    if (subError) {
      console.error('Error recording mission submission:', subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // 2. Award XP, coins and reinforce streak
    const { data: currentProfile } = await supabase
      .from('student_profiles')
      .select('xp, total_points, coins, current_streak, streak_days, level')
      .eq('id', user.id)
      .maybeSingle();

    if (currentProfile) {
      const newXp = (currentProfile.xp || currentProfile.total_points || 0) + xpEarned;
      const newCoins = (currentProfile.coins || 0) + coinsEarned;
      const newStreak = Math.max(1, (currentProfile.current_streak || currentProfile.streak_days || 0) + 1);
      const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);

      await supabase
        .from('student_profiles')
        .update({
          xp: newXp,
          total_points: newXp,
          coins: newCoins,
          current_streak: newStreak,
          streak_days: newStreak,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    // 3. Log notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Life Mission Completed! 🌍',
      message: `You completed a real-world learning mission! Earned +${xpEarned} XP and +${coinsEarned} Coins.`,
      type: 'achievement',
      link: '/student/missions',
    });

    return NextResponse.json({
      success: true,
      submission,
      xpEarned,
      coinsEarned,
    });
  } catch (err: any) {
    console.error('API Life Mission submission error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
