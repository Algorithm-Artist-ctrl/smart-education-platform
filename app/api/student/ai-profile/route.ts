// app/api/student/ai-profile/route.ts
// Handles fetching, setting up, and customizing the student's personal AI partner profile
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resetAILearningMemory } from '@/lib/ai/memory-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [aiProfileRes, studentProfileRes] = await Promise.all([
      supabase.from('student_ai_profiles').select('*').eq('student_id', user.id).maybeSingle(),
      supabase.from('student_profiles').select('ai_partner_name, preferred_language, level, total_points, current_streak').eq('id', user.id).maybeSingle(),
    ]);

    const aiData = aiProfileRes.data;
    const spData = studentProfileRes.data;

    const partnerName = aiData?.ai_partner_name || spData?.ai_partner_name || 'Nova';
    const preferredLang = aiData?.preferred_language || spData?.preferred_language || 'en';

    return NextResponse.json({
      success: true,
      profile: {
        student_id: user.id,
        ai_partner_name: partnerName,
        preferred_language: preferredLang,
        conversation_style: aiData?.conversation_style || 'friendly',
        explanation_style: aiData?.explanation_style || 'examples',
        interaction_preferences: aiData?.interaction_preferences || {
          hint_first: true,
          show_examples: true,
          challenge_mode: false,
        },
        learning_memory: aiData?.learning_memory || {
          common_mistakes: [],
          memorized_facts: [],
          focus_topics: [],
          learning_habits: [],
        },
        setup_completed: Boolean(aiData?.setup_completed),
        updated_at: aiData?.updated_at || new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[AI Profile GET] Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve AI partner profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      ai_partner_name,
      preferred_language,
      conversation_style,
      explanation_style,
      interaction_preferences,
      reset_memory,
      setup_completed,
    } = body;

    // Handle Safe Preference Reset (Section 20)
    if (reset_memory) {
      const resetResult = await resetAILearningMemory(supabase, user.id);
      return NextResponse.json(resetResult);
    }

    // Sanitize and prepare update payload
    const partnerName = (ai_partner_name || '').trim() || 'Nova';
    const lang = preferred_language === 'hi' || preferred_language === 'hinglish' ? preferred_language : 'en';
    const style = ['simple', 'friendly', 'hinglish', 'detailed', 'visual'].includes(conversation_style)
      ? conversation_style
      : 'friendly';

    const now = new Date().toISOString();

    // 1. Upsert student_ai_profiles
    const { data: updatedAI, error: aiErr } = await supabase
      .from('student_ai_profiles')
      .upsert(
        {
          student_id: user.id,
          ai_partner_name: partnerName,
          preferred_language: lang,
          conversation_style: style,
          explanation_style: explanation_style || 'examples',
          interaction_preferences: interaction_preferences || {
            hint_first: true,
            show_examples: true,
          },
          setup_completed: setup_completed !== undefined ? setup_completed : true,
          updated_at: now,
        },
        { onConflict: 'student_id' }
      )
      .select()
      .single();

    if (aiErr) {
      console.warn('[AI Profile POST] student_ai_profiles upsert note:', aiErr.message);
    }

    // 2. Synchronize ai_partner_name on student_profiles for rapid joins
    await supabase
      .from('student_profiles')
      .update({
        ai_partner_name: partnerName,
        preferred_language: lang === 'hi' ? 'hi' : 'en',
        updated_at: now,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      partnerName,
      profile: updatedAI,
      message: `Your AI partner is now named "${partnerName}".`,
    });
  } catch (err: any) {
    console.error('[AI Profile POST] Error:', err);
    return NextResponse.json({ error: 'Failed to update AI partner settings' }, { status: 500 });
  }
}
