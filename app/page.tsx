// app/page.tsx
// Screen 1: Smart Edu Exact Starting Page matching user reference UI
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ExactLandingPage from '@/components/landing/ExactLandingPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const isPreview = params?.preview === 'true';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && !isPreview) {
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

  // Fetch verified counts from Supabase database
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

  return (
    <ExactLandingPage 
      stats={{ 
        studentsCount, 
        subjectsCount, 
        questionsCount 
      }} 
    />
  );
}
