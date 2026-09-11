// app/(dashboard)/student/learning/[subjectId]/[moduleId]/page.tsx
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
  BookOpen
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string; moduleId: string }>;
}) {
  const resolvedParams = await params;
  const { subjectId, moduleId } = resolvedParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/student/learning/${subjectId}/${moduleId}`);
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

  if (!subjectHierarchy || !currentModule) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white">
        <Navbar profile={profile} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-2xl font-black">Module Not Found</h2>
          <p className="text-sm text-slate-400">The requested learning module is not available.</p>
          <Link
            href={`/student/learning/${subjectId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subject
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
            <span className="text-white font-semibold">{currentModule.title}</span>
          </nav>

          {/* Module Hero */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 lg:p-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {subjectHierarchy.subject.name} • Module
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {currentModule.title}
                </h1>
                <p className="text-sm text-slate-400 max-w-2xl">
                  {currentModule.description || `Comprehensive units and hands-on topics in ${currentModule.title}.`}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-slate-400">Mastery</div>
                  <div className="text-xl font-black text-emerald-400">{currentModule.averageMasteryScore}%</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-xs text-slate-400">Chapters</div>
                  <div className="text-xl font-black text-white">{currentModule.chapters.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapters and Topics */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Chapters in this Module</span>
            </h2>

            <div className="space-y-6">
              {currentModule.chapters.map((chapter, chIdx) => (
                <div
                  key={chapter.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-indigo-400">Chapter {chIdx + 1}</span>
                      <h3 className="text-lg font-black text-white mt-0.5">{chapter.title}</h3>
                    </div>
                    <Link
                      href={`/student/learning/${subjectId}/${moduleId}/${chapter.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      <span>Chapter View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Topics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chapter.topics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/student/learning/${subjectId}/${moduleId}/${chapter.id}/${topic.id}`}
                        className="rounded-xl bg-slate-950/80 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 p-4 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-amber-400">
                            {Array.from({ length: topic.difficulty_level || 1 }).map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                            ))}
                          </div>
                          {topic.status === 'mastered' && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Mastered
                            </span>
                          )}
                          {topic.status === 'needs_practice' && (
                            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Practice
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {topic.name}
                        </h4>

                        {topic.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {topic.description}
                          </p>
                        )}
                      </Link>
                    ))}
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
        level={studentProfile?.level || 1}
        mode="floating"
      />
    </div>
  );
}
