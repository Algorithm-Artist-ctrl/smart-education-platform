// app/(dashboard)/student/learning/[subjectId]/[moduleId]/[chapterId]/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { getCurriculumHierarchy } from '@/lib/learning-engine';
import { Profile, StudentProfile } from '@/types/database.types';
import { 
  ChevronRight, 
  ArrowLeft, 
  Layers, 
  Star,
  Check,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Target,
  Clock
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string; moduleId: string; chapterId: string }>;
}) {
  const resolvedParams = await params;
  const { subjectId, moduleId, chapterId } = resolvedParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/student/learning/${subjectId}/${moduleId}/${chapterId}`);
  }

  const [
    profileRes,
    studentProfileRes,
    aiProfileRes,
    hierarchies,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_ai_profiles').select('*').eq('student_id', user.id).maybeSingle(),
    getCurriculumHierarchy(supabase, user.id, subjectId),
  ]);

  const profile = profileRes.data as Profile | null;
  const studentProfile = studentProfileRes.data as StudentProfile | null;
  const aiPartner = aiProfileRes.data;
  const partnerName = aiPartner?.ai_partner_name || studentProfile?.ai_partner_name || 'Nova';

  const subjectHierarchy = hierarchies[0];
  const currentModule = subjectHierarchy?.modules.find((m) => m.id === moduleId);
  const currentChapter = currentModule?.chapters.find((c) => c.id === chapterId);

  if (!subjectHierarchy || !currentModule || !currentChapter) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white">
        <Navbar profile={profile} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-2xl font-black">Chapter Not Found</h2>
          <p className="text-sm text-slate-400">The requested chapter could not be found.</p>
          <Link
            href={`/student/learning/${subjectId}/${moduleId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Module
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      <Navbar profile={profile} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <SidebarRail />

        <main className="flex-1 min-w-0 space-y-8 pb-16">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <Link href="/student" className="hover:text-slate-200">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/student/learning" className="hover:text-slate-200">My Learning</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/student/learning/${subjectId}`} className="hover:text-slate-200">
              {subjectHierarchy.subject.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/student/learning/${subjectId}/${moduleId}`} className="hover:text-slate-200">
              {currentModule.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-semibold">{currentChapter.title}</span>
          </nav>

          {/* Chapter Hero */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 lg:p-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentModule.title} • Chapter
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {currentChapter.title}
                </h1>
                <p className="text-sm text-slate-400 max-w-2xl">
                  {currentChapter.description || `Explore essential concepts and practice problems in ${currentChapter.title}.`}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-slate-400">Chapter Mastery</div>
                  <div className="text-xl font-black text-emerald-400">{currentChapter.averageMasteryScore}%</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-xs text-slate-400">Topics</div>
                  <div className="text-xl font-black text-white">{currentChapter.topics.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Topics in Chapter */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>Topics to Explore</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentChapter.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: topic.difficulty_level || 1 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {topic.estimated_minutes || 15}m
                        </span>
                      </div>

                      {topic.status === 'mastered' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Mastered
                        </span>
                      )}
                      {topic.status === 'needs_practice' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Needs Practice
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white">
                      {topic.name}
                    </h3>
                    {topic.description && (
                      <p className="text-xs text-slate-400">
                        {topic.description}
                      </p>
                    )}

                    {topic.learning_objectives && topic.learning_objectives.length > 0 && (
                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Learning Objectives:</span>
                        <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                          {topic.learning_objectives.slice(0, 2).map((obj, i) => (
                            <li key={i} className="line-clamp-1">{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <Link
                      href={`/student/learning/${subjectId}/${moduleId}/${chapterId}/${topic.id}?tab=learn`}
                      className="flex-1 text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      📖 Learn
                    </Link>
                    <Link
                      href={`/student/learning/${subjectId}/${moduleId}/${chapterId}/${topic.id}?tab=practice`}
                      className="flex-1 text-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                    >
                      📝 Practice
                    </Link>
                    <Link
                      href={`/student/learning/${subjectId}/${moduleId}/${chapterId}/${topic.id}?tab=quiz`}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                      title="Topic Quiz"
                    >
                      🎯 Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      <NovaAICompanion
        partnerName={partnerName}
        studentName={profile?.full_name?.split(' ')[0] || 'Cadet'}
        recommendedSubject={subjectHierarchy.subject.name}
        currentModule={currentModule.title}
        currentChapter={currentChapter.title}
        level={studentProfile?.level || 1}
        mode="floating"
      />
    </div>
  );
}
