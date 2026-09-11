// app/(dashboard)/student/learning/[subjectId]/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { getCurriculumHierarchy, getStudentLearningPosition } from '@/lib/learning-engine';
import { Profile, StudentProfile } from '@/types/database.types';
import { 
  BookOpen, 
  ChevronRight, 
  ArrowLeft, 
  Layers, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  Star,
  Check,
  RotateCcw
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubjectCurriculumPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const resolvedParams = await params;
  const { subjectId } = resolvedParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/student/learning/${subjectId}`);
  }

  const [
    profileRes,
    studentProfileRes,
    aiProfileRes,
    hierarchies,
    learningPosition,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_profiles').select('*').eq('id', user.id).single(),
    supabase.from('student_ai_profiles').select('*').eq('student_id', user.id).maybeSingle(),
    getCurriculumHierarchy(supabase, user.id, subjectId),
    getStudentLearningPosition(supabase, user.id, subjectId),
  ]);

  const profile = profileRes.data as Profile | null;
  const studentProfile = studentProfileRes.data as StudentProfile | null;
  const aiPartner = aiProfileRes.data;
  const partnerName = aiPartner?.ai_partner_name || studentProfile?.ai_partner_name || 'Nova';

  const subjectHierarchy = hierarchies[0];

  if (!subjectHierarchy) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060913] text-white">
        <Navbar profile={profile} />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-2xl font-black">Subject Realm Not Found</h2>
          <p className="text-sm text-slate-400">The requested academic curriculum does not exist or has been relocated.</p>
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

  const { subject, modules, overallProgress, overallMastery, totalTopicsCount, masteredTopicsCount } = subjectHierarchy;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      <Navbar profile={profile} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <SidebarRail />

        <main className="flex-1 min-w-0 space-y-8 pb-16">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/student" className="hover:text-slate-200">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/student/learning" className="hover:text-slate-200">My Learning</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-semibold">{subject.name}</span>
          </nav>

          {/* Subject Hero Card */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 lg:p-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Curriculum Track
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {subject.name}
                </h1>
                <p className="text-sm text-slate-400 max-w-2xl">
                  {subject.description || `Explore structured modules, chapters, and topics in ${subject.name}. Build verified mastery with hands-on practice.`}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 shrink-0 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <div>
                  <div className="text-xs text-slate-400">Mastery Score</div>
                  <div className="text-xl font-black text-emerald-400">{overallMastery}%</div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-xs text-slate-400">Topics Mastered</div>
                  <div className="text-xl font-black text-white">{masteredTopicsCount} / {totalTopicsCount}</div>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Curriculum Completion</span>
                <span className="font-semibold text-indigo-300">{overallProgress}% Complete</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Structured Modules ({modules.length})</span>
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {modules.map((mod, modIdx) => (
                <div
                  key={mod.id}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">
                          Module {modIdx + 1}
                        </span>
                        <h3 className="text-lg font-black text-white">
                          {mod.title}
                        </h3>
                        {mod.status === 'mastered' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Mastered
                          </span>
                        )}
                      </div>
                      {mod.description && (
                        <p className="text-xs text-slate-400 mt-1">
                          {mod.description}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/student/learning/${subject.id}/${mod.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors shrink-0"
                    >
                      <span>Module Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Chapters Inside Module */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mod.chapters.map((ch, chIdx) => (
                      <div
                        key={ch.id}
                        className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">
                            Chapter {chIdx + 1}: {ch.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {ch.topics.length} topics
                          </span>
                        </div>

                        {/* Topic Pills */}
                        <div className="space-y-1.5 pt-1">
                          {ch.topics.map((t) => (
                            <Link
                              key={t.id}
                              href={`/student/learning/${subject.id}/${mod.id}/${ch.id}/${t.id}`}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-indigo-950/40 border border-transparent hover:border-indigo-500/30 transition-all text-xs group"
                            >
                              <span className="text-slate-300 group-hover:text-white font-medium line-clamp-1">
                                {t.name}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                {t.status === 'mastered' && (
                                  <span className="text-[10px] text-emerald-400 font-bold">
                                    Mastered
                                  </span>
                                )}
                                {t.status === 'needs_practice' && (
                                  <span className="text-[10px] text-rose-400 font-bold">
                                    Practice
                                  </span>
                                )}
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
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
        recommendedSubject={subject.name}
        level={studentProfile?.level || 1}
        mode="floating"
      />
    </div>
  );
}
