// app/api/student/creativity/route.ts
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
    const { prompt, canvas_data, explanation_text, topic_id = null } = body;

    if (!prompt || !canvas_data || !explanation_text?.trim()) {
      return NextResponse.json(
        { error: 'Prompt, drawing canvas data, and explanation are required.' },
        { status: 400 }
      );
    }

    const xpEarned = 50;
    const coinsEarned = 15;

    // 1. Insert into creativity_submissions
    const { data: submission, error: subError } = await supabase
      .from('creativity_submissions')
      .insert({
        student_id: user.id,
        topic_id: topic_id || null,
        title: prompt || 'Creative Concept Diagram',
        submission_type: 'drawing',
        drawing_data: canvas_data,
        reasoning_text: explanation_text.trim(),
        content_text: explanation_text.trim(),
        creativity_score: 90,
        understanding_score: 90,
        xp_earned: xpEarned,
      })
      .select()
      .single();

    if (subError) {
      console.error('Error inserting creativity submission:', subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // 2. Award XP and Coins to student_profiles
    const { data: currentProfile } = await supabase
      .from('student_profiles')
      .select('xp, total_points, coins, level')
      .eq('id', user.id)
      .maybeSingle();

    if (currentProfile) {
      const newXp = (currentProfile.xp || currentProfile.total_points || 0) + xpEarned;
      const newCoins = (currentProfile.coins || 0) + coinsEarned;
      const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);

      await supabase
        .from('student_profiles')
        .update({
          xp: newXp,
          total_points: newXp,
          coins: newCoins,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    // 3. Log notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Creativity Milestone Unlocked! 🎨',
      message: `You earned +${xpEarned} XP and +${coinsEarned} Coins for submitting your visual explanation.`,
      type: 'achievement',
      link: '/student/creativity',
    });

    return NextResponse.json({
      success: true,
      submission,
      xpEarned,
      coinsEarned,
    });
  } catch (err: any) {
    console.error('API Creativity submission error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
