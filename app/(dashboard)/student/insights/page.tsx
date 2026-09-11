// app/(dashboard)/student/insights/page.tsx
// Screen: Student Insights & AI Learning Partner
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import SidebarRail from '@/components/design-system/SidebarRail';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import StudentInsightsClient from '@/components/gamification/StudentInsightsClient';
import { Profile } from '@/types/database.types';
import { Sparkles, ChevronRight, Home, Brain } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentInsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/student/insights');
  }

  // 1. Fetch user profile and student profile
  const [profileRes, studentProfileRes, aiProfileRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('student_profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('student_ai_profiles').select('ai_partner_name').eq('student_id', user.id).maybeSingle(),
  ]);

  const profile = profileRes.data;
  const role = profile?.role || (user.user_metadata?.role as string) || 'student';
  if (role !== 'student') {
    if (role === 'teacher') redirect('/teacher');
    if (role === 'parent') redirect('/parent');
    if (role === 'admin') redirect('/admin');
  }

  const userProfile: Profile = profile || {
    id: user.id,
    email: user.email || '',
    full_name: (user.user_metadata?.full_name as string) || 'Cadet',
    role: 'student',
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  const studentProfile = studentProfileRes.data;
  const partnerName = aiProfileRes.data?.ai_partner_name || studentProfile?.ai_partner_name || 'Nova';
  const studentName = userProfile.full_name?.split(' ')[0] || 'Cadet';

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 pb-20 md:pb-12 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar profile={userProfile} />

      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex gap-6">
        {/* Left Sidebar Rail */}
        <SidebarRail />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/student" className="hover:text-white transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-400 font-medium flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" />
              <span>AI Learning Insights</span>
            </span>
          </nav>

          {/* Client Interactive Insights Section */}
          <StudentInsightsClient initialPartnerName={partnerName} />
        </main>
      </div>

      {/* Floating AI Companion */}
      <NovaAICompanion
        partnerName={partnerName}
        studentName={studentName}
        mode="floating"
      />

      <MobileBottomNav />
    </div>
  );
}
