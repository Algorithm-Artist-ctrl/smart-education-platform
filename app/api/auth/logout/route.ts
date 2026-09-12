// app/api/auth/logout/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });
    response.cookies.delete('smartedu_role');
    response.cookies.delete('smartedu_onboarded');
    return response;
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
