// app/(dashboard)/student/learning/[subjectId]/[moduleId]/[chapterId]/[topicId]/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import TopicStudioClient from '@/components/learning/TopicStudioClient';
import { Profile, StudentProfile, Topic, Question, TopicMastery } from '@/types/database.types';
import { BookOpen, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TopicStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string; moduleId: string; chapterId: string; topicId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await params;
  const { subjectId, moduleId, chapterId, topicId } = resolvedParams;
  const resolvedSearchParams = await searchParams;
  const initialTab = resolvedSearchParams.tab || 'learn';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/student/learning/${subjectId}/${moduleId}/${chapterId}/${topicId}`);
  }

  // Fetch all necessary data
  const [
    profileRes,
    studentProfileRes,
    aiProfileRes,
    subRes,
    modRes,
    chRes,
    topRes,
    masteryRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_ai_profiles').select('*').eq('student_id', user.id).maybeSingle(),
    supabase.from('subjects').select('*').eq('id', subjectId).maybeSingle(),
    supabase.from('modules').select('*').eq('id', moduleId).maybeSingle(),
    supabase.from('chapters').select('*').eq('id', chapterId).maybeSingle(),
    supabase.from('topics').select('*').eq('id', topicId).single(),
    supabase.from('topic_mastery').select('*').eq('student_id', user.id).eq('topic_id', topicId).maybeSingle(),
  ]);

  const profile = profileRes.data as Profile | null;
  const studentProfile = studentProfileRes.data as StudentProfile | null;
  const aiPartner = aiProfileRes.data;
  const partnerName = aiPartner?.ai_partner_name || studentProfile?.ai_partner_name || 'Nova';

  const subject = subRes.data || { id: subjectId, name: 'Subject Realm' };
  const moduleItem = modRes.data || { id: moduleId, title: 'Learning Module' };
  const chapter = chRes.data || { id: chapterId, title: 'Concept Chapter' };
  const topic = topRes.data as Topic | null;
  const mastery = masteryRes.data as TopicMastery | null;

  if (!topic) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white">
        <Navbar profile={profile} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-2xl font-black">Topic Not Found</h2>
          <p className="text-sm text-slate-400">The requested learning topic could not be located.</p>
          <Link
            href="/student/learning"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Hub
          </Link>
        </main>
      </div>
    );
  }

  // Fetch practice questions for this topic
  let { data: questions } = await supabase
    .from('questions')
    .select('id, assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks')
    .eq('topic_id', topicId)
    .limit(10);

  // If no questions attached directly, fetch fallback questions from the assessment pool
  if (!questions || questions.length === 0) {
    const { data: fallbackQuestions } = await supabase
      .from('questions')
      .select('id, assessment_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, marks')
      .limit(5);
    questions = fallbackQuestions || [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      <Navbar profile={profile} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <SidebarRail />

        <main className="flex-1 min-w-0">
          <TopicStudioClient
            topic={topic}
            subject={subject}
            moduleItem={moduleItem}
            chapter={chapter}
            questions={(questions as Question[]) || []}
            initialMastery={mastery}
            initialTab={initialTab}
            partnerName={partnerName}
          />
        </main>
      </div>

      <MobileBottomNav />

      {/* Floating Nova AI Companion with active topic and objective context */}
      <NovaAICompanion
        partnerName={partnerName}
        studentName={profile?.full_name?.split(' ')[0] || 'Cadet'}
        recommendedSubject={subject.name}
        currentModule={moduleItem.title}
        currentChapter={chapter.title}
        currentTopic={topic.name}
        learningObjectives={topic.learning_objectives}
        lessonPosition="Active Studio Concept"
        level={studentProfile?.level || 1}
        mode="floating"
      />
    </div>
  );
}
