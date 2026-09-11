// app/(dashboard)/student/learning/page.tsx
// Central "My Learning" Hub — Curriculum Exploration + Smart Adaptive Path
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import LearningHubClient from '@/components/learning/LearningHubClient';
import { 
  getCurriculumHierarchy, 
  getStudentLearningPosition, 
  getPersonalizedLearningPath,
  getStudentWeakAreasDetailed,
  getStudentStrengthsDetailed 
} from '@/lib/learning-engine';
import { Profile, StudentProfile } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function LearningHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/student/learning');
  }

  // Fetch all real database data in parallel
  const [
    profileRes,
    studentProfileRes,
    aiProfileRes,
    hierarchy,
    learningPosition,
    personalizedPath,
    weakAreas,
    strengths,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_ai_profiles').select('*').eq('student_id', user.id).maybeSingle(),
    getCurriculumHierarchy(supabase, user.id),
    getStudentLearningPosition(supabase, user.id),
    getPersonalizedLearningPath(supabase, user.id),
    getStudentWeakAreasDetailed(supabase, user.id),
    getStudentStrengthsDetailed(supabase, user.id),
  ]);

  const profile = profileRes.data as Profile | null;
  const studentProfile = studentProfileRes.data as StudentProfile | null;
  const aiPartner = aiProfileRes.data;
  const partnerName = aiPartner?.ai_partner_name || studentProfile?.ai_partner_name || 'Nova';

  // Extract weak topic name for Nova context if available
  const weakTopicName = weakAreas.length > 0 ? weakAreas[0].topic_name : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      <Navbar profile={profile} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <SidebarRail />

        <main className="flex-1 min-w-0">
          <LearningHubClient
            hierarchy={hierarchy}
            learningPosition={learningPosition}
            personalizedPath={personalizedPath}
            weakAreas={weakAreas}
            strengths={strengths}
            partnerName={partnerName}
          />
        </main>
      </div>

      <MobileBottomNav />

      {/* Global Nova AI Companion */}
      <NovaAICompanion
        partnerName={partnerName}
        studentName={profile?.full_name?.split(' ')[0] || 'Cadet'}
        weakTopicName={weakTopicName}
        recommendedSubject={learningPosition?.subject?.name || 'Mathematics'}
        currentModule={learningPosition?.module?.title}
        currentChapter={learningPosition?.chapter?.title}
        currentTopic={learningPosition?.topic?.name}
        level={studentProfile?.level || 1}
        mode="floating"
      />
    </div>
  );
}
