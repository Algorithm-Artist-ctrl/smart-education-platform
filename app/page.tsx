// app/page.tsx
// Screen 1: Smart Edu Exact Starting Page matching user reference UI
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import ExactLandingPage from '@/components/landing/ExactLandingPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const getCachedStats = unstable_cache(
  async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
    const supabase = createSupabaseClient(url, anonKey);

    let subjectsCount = 3;
    let questionsCount = 9;
    let studentsCount = 1;

    try {
      const [subRes, qRes, pRes] = await Promise.all([
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      ]);
      if (subRes.count) subjectsCount = subRes.count;
      if (qRes.count) questionsCount = qRes.count;
      if (pRes.count) studentsCount = pRes.count;
    } catch {}

    return { subjectsCount, questionsCount, studentsCount };
  },
  ['landing-public-stats'],
  { revalidate: 300 }
);

export default async function HomePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const isPreview = params?.preview === 'true';

  // Fast-path: Check cookies directly before making any network calls
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasAuthCookie = allCookies.some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  if (hasAuthCookie && !isPreview) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const role = profile?.role || (user.user_metadata?.role as string) || 'student';
        if (role === 'teacher') redirect('/teacher');
        if (role === 'parent') redirect('/parent');
        if (role === 'admin') redirect('/admin');
        if (role === 'super_admin') redirect('/super-admin');
        redirect('/student');
      }
    } catch {
      // If auth check fails or redirects, allow standard flow
    }
  }

  // Fetch cached stats (0ms if cached, revalidated every 5 minutes)
  const stats = await getCachedStats();

  return <ExactLandingPage stats={stats} />;
}

