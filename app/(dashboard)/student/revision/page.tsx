// app/(dashboard)/student/revision/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { WeakTopic, LearningContent, Assessment, Profile, StudentProfile } from '@/types/database.types';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import { 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  RefreshCw,
  FileText,
  Zap,
  RotateCw,
  Layers,
  Check,
  Brain,
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';

function RevisionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicFilter = searchParams.get('topic');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<WeakTopic | null>(null);
  const [contentList, setContentList] = useState<LearningContent[]>([]);
  const [topicAssessments, setTopicAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Revision Arena Tabs: weak-topics | flashcards | past-papers | mini-tests
  const [activeTab, setActiveTab] = useState<'weak-topics' | 'flashcards' | 'past-papers' | 'mini-tests'>('weak-topics');

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const sampleFlashcards = [
    {
      q: 'State Newton’s Second Law of Motion in equation form.',
      a: 'F = m · a (Force equals mass multiplied by acceleration, measured in Newtons).',
      topic: 'Physics • Mechanics',
    },
    {
      q: 'What is the quadratic formula used to solve ax² + bx + c = 0?',
      a: 'x = (-b ± √(b² - 4ac)) / (2a)',
      topic: 'Mathematics • Algebra',
    },
    {
      q: 'What is the time complexity of binary search on a sorted array?',
      a: 'O(log n) because the search range is halved with each step.',
      topic: 'Computer Science • Algorithms',
    },
    {
      q: 'Define Mitochondria and its primary biochemical role in cells.',
      a: 'The powerhouse of the cell, generating most of the chemical energy needed via ATP production.',
      topic: 'Biology • Cell Structure',
    },
  ];

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/revision');
        return;
      }

      const [profRes, studRes, wtRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('weak_topics')
          .select('*, topic:topics(*, subject:subjects(*))')
          .eq('student_id', user.id)
          .order('accuracy_rate', { ascending: true }),
      ]);

      if (profRes.data) setProfile(profRes.data as Profile);
      if (studRes.data) setStudentProfile(studRes.data as StudentProfile);

      if (wtRes.data && wtRes.data.length > 0) {
        setWeakTopics(wtRes.data as WeakTopic[]);
        const current = topicFilter
          ? wtRes.data.find((w: any) => w.topic_id === topicFilter) || wtRes.data[0]
          : wtRes.data[0];
        setSelectedTopic(current as WeakTopic);
      }
      setLoading(false);
    }

    loadData();
  }, [topicFilter, router, supabase]);

  // Load content & assessments for selected topic
  useEffect(() => {
    if (!selectedTopic) return;
    const currentTopicId = selectedTopic.topic_id;

    async function loadTopicDetails() {
      const [contentRes, assRes] = await Promise.all([
        supabase
          .from('learning_content')
          .select('*')
          .eq('topic_id', currentTopicId),
        supabase
          .from('assessments')
          .select('*')
          .eq('topic_id', currentTopicId)
          .eq('is_published', true),
      ]);

      if (contentRes.data) setContentList(contentRes.data as LearningContent[]);
      if (assRes.data) setTopicAssessments(assRes.data as Assessment[]);
    }

    loadTopicDetails();
  }, [selectedTopic, supabase]);

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % sampleFlashcards.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-rose-950/20 via-purple-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Gamification Bar */}
        <GamificationBar
          level={studentProfile?.level || 1}
          currentXp={studentProfile?.xp || 0}
          streakDays={studentProfile?.streak_days || 0}
          coins={studentProfile?.coins ?? 100}
          totalPoints={studentProfile?.total_points || 0}
        />

        {/* Hero Header matching Screen 8 */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="absolute -right-16 -top-16 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5 text-rose-400" />
                <span>Spaced Repetition & AI Revision</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Revision Arena
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Transform diagnostic weaknesses into high-mastery strengths with targeted drills and flashcards.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-2 text-xs font-bold text-slate-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{weakTopics.length} Flagged Topics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filters matching Screen 8 */}
        <div className="flex items-center gap-2 overflow-x-auto touch-scroll-x pb-2 pt-1">
          {[
            { id: 'weak-topics', label: 'Weak Topics', count: weakTopics.length },
            { id: 'flashcards', label: 'Flashcards', count: sampleFlashcards.length },
            { id: 'past-papers', label: 'Past Papers' },
            { id: 'mini-tests', label: 'Mini Drills' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: WEAK TOPICS */}
        {activeTab === 'weak-topics' && (
          <div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyzing Weak Topics...</span>
              </div>
            ) : weakTopics.length === 0 ? (
              <div className="cosmic-card rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-black text-white">No Weak Topics Detected!</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Outstanding work! You have either mastered all previous quiz questions or resolved all flagged topics.
                  </p>
                </div>
                <Link
                  href="/student/map"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Explore Learning Map</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Weak Topics List (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    Select Topic to Review
                  </h3>

                  <div className="space-y-3">
                    {weakTopics.map((wt) => {
                      const isSelected = selectedTopic?.id === wt.id;

                      return (
                        <button
                          key={wt.id}
                          onClick={() => setSelectedTopic(wt)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-slate-800/90 border-rose-500/80 shadow-lg shadow-rose-950/40 ring-1 ring-rose-400/50'
                              : 'bg-slate-900/70 border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                              {wt.topic?.subject?.name || 'Subject'}
                            </span>
                            <h4 className="text-sm font-bold text-white truncate mt-0.5">{wt.topic?.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {wt.incorrect_count} missed answers • {wt.accuracy_rate}% accuracy
                            </p>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            wt.accuracy_rate < 50
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {wt.accuracy_rate}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Featured Weak Topic Review Card matching Screen 8 (7 Cols) */}
                <div className="lg:col-span-7">
                  {selectedTopic && (
                    <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-rose-500/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                        <div>
                          <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                            {selectedTopic.topic?.subject?.name}
                          </span>
                          <h2 className="text-xl font-black text-white mt-1">
                            {selectedTopic.topic?.name}
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            {selectedTopic.topic?.description || 'Targeted review material to conquer this concept.'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-center shrink-0 self-start sm:self-auto">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                            Current Accuracy
                          </div>
                          <div className="text-2xl font-black text-rose-400 mt-0.5">
                            {selectedTopic.accuracy_rate}%
                          </div>
                        </div>
                      </div>

                      {/* Content Notes */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          <span>Revision Lesson Notes</span>
                        </h4>

                        {contentList.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 text-xs text-slate-400 italic">
                            No dedicated lesson file attached. Take the diagnostic practice challenge below to boost your accuracy.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {contentList.map((c) => (
                              <div key={c.id} className="p-4 rounded-2xl bg-slate-800/60 border border-white/5">
                                <h5 className="text-xs font-bold text-white mb-1">{c.title}</h5>
                                <div className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-2">
                                  {c.body_markdown}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Launch Practice Button */}
                      {topicAssessments.length > 0 ? (
                        <div className="pt-4 border-t border-white/10">
                          <Link
                            href={`/student/assessments/${topicAssessments[0].id}`}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-rose-900/30 flex items-center justify-center gap-2 transition"
                          >
                            <PlayCircle className="w-5 h-5" />
                            <span>Practice Now ({topicAssessments[0].title})</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-white/10">
                          <button
                            onClick={() => setActiveTab('flashcards')}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2 transition"
                          >
                            <Sparkles className="w-5 h-5" />
                            <span>Drill Flashcards for this Topic</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE FLASHCARDS */}
        {activeTab === 'flashcards' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                Flashcard {flashcardIndex + 1} of {sampleFlashcards.length}
              </span>
              <h3 className="text-xl font-black text-white">Active Recall Deck</h3>
              <p className="text-xs text-slate-400">Tap the card to reveal the answer, then rate your recall.</p>
            </div>

            {/* 3D Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer min-h-[260px] rounded-3xl p-8 border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 shadow-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-all group select-none relative"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-indigo-400">{sampleFlashcards[flashcardIndex].topic}</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-slate-300 transition">
                  <RotateCw className="w-3 h-3" /> Tap to Flip
                </span>
              </div>

              <div className="py-6 text-center">
                {isFlipped ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Answer</span>
                    <p className="text-base sm:text-lg font-bold text-emerald-300 leading-relaxed">
                      {sampleFlashcards[flashcardIndex].a}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Question</span>
                    <p className="text-base sm:text-lg font-black text-white leading-relaxed">
                      {sampleFlashcards[flashcardIndex].q}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-center text-[11px] text-slate-500">
                {isFlipped ? 'Great job! How confident were you?' : 'Try reciting the answer in your mind before flipping.'}
              </div>
            </div>

            {/* Rating Buttons */}
            {isFlipped && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleNextFlashcard}
                  className="py-3 px-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/30 transition"
                >
                  Again (+0 XP)
                </button>
                <button
                  onClick={handleNextFlashcard}
                  className="py-3 px-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition"
                >
                  Good (+10 XP)
                </button>
                <button
                  onClick={handleNextFlashcard}
                  className="py-3 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition"
                >
                  Easy (+25 XP)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3 & 4: PAST PAPERS & MINI TESTS */}
        {(activeTab === 'past-papers' || activeTab === 'mini-tests') && (
          <div className="cosmic-card p-8 rounded-3xl border border-white/10 bg-slate-900/60 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white capitalize">{activeTab.replace('-', ' ')}</h3>
              <p className="text-xs text-slate-400 mt-1">
                Exam-standard practice sets generated automatically from your school curriculum.
              </p>
            </div>
            <Link
              href="/student/map"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
            >
              <span>Explore All Sector Quizzes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      {/* Floating Nova AI Companion */}
      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />
    </div>
  );
}

export default function RevisionArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060913]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <RevisionContent />
    </Suspense>
  );
}
