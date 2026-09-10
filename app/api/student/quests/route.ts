// app/api/student/quests/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch quests for this student
    const { data: studentQuests, error } = await supabase
      .from('quests')
      .select('*')
      .or(`student_id.eq.${user.id},student_id.is.null`)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ quests: studentQuests || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questId } = await request.json();

    if (!questId) {
      return NextResponse.json({ error: 'Missing questId' }, { status: 400 });
    }

    // 1. Retrieve the quest
    const { data: quest, error: qError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .maybeSingle();

    if (qError || !quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    if (quest.is_claimed) {
      return NextResponse.json({ error: 'Quest reward already claimed' }, { status: 400 });
    }

    const xpReward = quest.xp_reward || 50;
    const coinReward = quest.coin_reward ?? quest.coins_reward ?? 20;

    // 2. Fetch current student profile
    const { data: studentProfile, error: spError } = await supabase
      .from('student_profiles')
      .select('id, total_points, xp, coins, level')
      .eq('id', user.id)
      .maybeSingle();

    if (spError || !studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const newXp = (studentProfile.total_points ?? studentProfile.xp ?? 0) + xpReward;
    const newCoins = (studentProfile.coins ?? 100) + coinReward;

    // 3. Mark quest as completed and claimed
    const { error: updateQuestError } = await supabase
      .from('quests')
      .update({
        is_completed: true,
        is_claimed: true,
        status: 'completed',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', questId);

    if (updateQuestError) {
      return NextResponse.json({ error: updateQuestError.message }, { status: 500 });
    }

    // 4. Update student profile
    const { error: updateProfileError } = await supabase
      .from('student_profiles')
      .update({
        total_points: newXp,
        coins: newCoins,
      })
      .eq('id', user.id);

    if (updateProfileError) {
      return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      xpEarned: xpReward,
      coinsEarned: coinReward,
      totalXp: newXp,
      totalCoins: newCoins,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
