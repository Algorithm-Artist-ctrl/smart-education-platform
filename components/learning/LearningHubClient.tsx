'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  ArrowRight, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Award, 
  Zap, 
  RotateCcw, 
  Compass, 
  Search, 
  Layers,
  Star,
  Check,
  BrainCircuit,
  Filter
} from 'lucide-react';
import { 
  SubjectCurriculumHierarchy, 
  StudentLearningPosition, 
  PersonalizedPathStep, 
  WeakAreaDetailed, 
  StrengthDetailed 
} from '@/types/database.types';

interface LearningHubClientProps {
  hierarchy: SubjectCurriculumHierarchy[];
  learningPosition: StudentLearningPosition | null;
  personalizedPath: PersonalizedPathStep[];
  weakAreas: WeakAreaDetailed[];
  strengths: StrengthDetailed[];
  partnerName?: string;
}

export default function LearningHubClient({
  hierarchy,
  learningPosition,
  personalizedPath,
  weakAreas,
  strengths,
  partnerName = 'Nova',
}: LearningHubClientProps) {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'path' | 'insights'>('curriculum');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Filter hierarchy
  const filteredHierarchy = hierarchy.filter((item) => {
    if (selectedSubjectId !== 'all' && item.subject.id !== selectedSubjectId) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesSubj = item.subject.name.toLowerCase().includes(query);
    const matchesMod = item.modules.some((m) => m.title.toLowerCase().includes(query));
    const matchesTopic = item.modules.some((m) =>
      m.chapters.some((c) => c.topics.some((t) => t.name.toLowerCase().includes(query)))
    );
    return matchesSubj || matchesMod || matchesTopic;
  });

  // Calculate high-level stats
  const totalTopics = hierarchy.reduce((acc, h) => acc + h.totalTopicsCount, 0);
  const masteredTopics = hierarchy.reduce((acc, h) => acc + h.masteredTopicsCount, 0);
  const completedTopics = hierarchy.reduce((acc, h) => acc + h.completedTopicsCount, 0);
  const averageMastery = hierarchy.length > 0 
    ? Math.round(hierarchy.reduce((acc, h) => acc + h.overallMastery, 0) / hierarchy.length) 
    : 0;

  // Continue Learning position target URL
  const resumeUrl = learningPosition && learningPosition.topic_id
    ? `/student/learning/${learningPosition.subject_id}/${learningPosition.module_id || 'core'}/${learningPosition.chapter_id || 'foundation'}/${learningPosition.topic_id}`
    : hierarchy[0]?.modules[0]?.chapters[0]?.topics[0]
      ? `/student/learning/${hierarchy[0].subject.id}/${hierarchy[0].modules[0].id}/${hierarchy[0].modules[0].chapters[0].id}/${hierarchy[0].modules[0].chapters[0].topics[0].id}`
      : '/student';

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            Structured Curriculum & Adaptive Intelligence
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            My Learning Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Freely explore the full academic curriculum or follow your personalized adaptive next steps recommended by {partnerName}.
          </p>
        </div>

        {/* Quick Stat Chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400">Mastered</div>
              <div className="text-sm font-bold text-white">{masteredTopics} / {totalTopics}</div>
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs text-slate-400">Avg Mastery</div>
              <div className="text-sm font-bold text-white">{averageMastery}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Active Anchor: "Continue Learning" */}
      {learningPosition && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-indigo-500/30 p-6 shadow-xl backdrop-blur-md">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <RotateCcw className="w-3 h-3 animate-spin-slow" />
                  Continue Where You Left Off
                </span>
                <span className="text-xs text-slate-400">
                  {learningPosition.subject?.name || 'Academic Path'}
                </span>
              </div>

              <div>
                <h2 className="text-xl lg:text-2xl font-black text-white flex items-center gap-2">
                  {learningPosition.topic?.name || learningPosition.lesson_title || 'Active Concept'}
                </h2>
                <p className="text-xs lg:text-sm text-slate-300 mt-1">
                  {learningPosition.module?.title ? `${learningPosition.module.title} • ` : ''}
                  {learningPosition.chapter?.title ? `${learningPosition.chapter.title} • ` : ''}
                  Step {learningPosition.step_number || 1} of {learningPosition.total_steps || 4}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Current Lesson Flow</span>
                  <span className="text-indigo-300 font-semibold">
                    {Math.round(((learningPosition.step_number || 1) / (learningPosition.total_steps || 4)) * 100)}% Complete
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(((learningPosition.step_number || 1) / (learningPosition.total_steps || 4)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={resumeUrl}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continue Learning</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'curriculum'
              ? 'border-indigo-500 text-white bg-indigo-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Explore Curriculum</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            Self-Directed
          </span>
        </button>

        <button
          onClick={() => setActiveTab('path')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'path'
              ? 'border-indigo-500 text-white bg-indigo-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Smart Personalized Path</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Adaptive AI
          </span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'insights'
              ? 'border-indigo-500 text-white bg-indigo-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <span>Diagnostic Focus & Strengths</span>
          {weakAreas.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {weakAreas.length} Areas
            </span>
          )}
        </button>
      </div>

      {/* 4. TAB CONTENT: 🗺️ Structured Curriculum */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Controls: Search and Subject Pills */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, formulas, chapters..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Subject Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedSubjectId('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSubjectId === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Subjects
              </button>
              {hierarchy.map((h) => (
                <button
                  key={h.subject.id}
                  onClick={() => setSelectedSubjectId(h.subject.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedSubjectId === h.subject.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {h.subject.name}
                </button>
              ))}
            </div>
          </div>

          {/* Hierarchy Display */}
          <div className="space-y-8">
            {filteredHierarchy.map((subHierarchy) => (
              <div
                key={subHierarchy.subject.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 space-y-6"
              >
                {/* Subject Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {subHierarchy.subject.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white">
                          {subHierarchy.subject.name}
                        </h3>
                        <Link
                          href={`/student/learning/${subHierarchy.subject.id}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
                        >
                          <span>View Overview</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {subHierarchy.modules.length} Modules • {subHierarchy.totalTopicsCount} Topics • {subHierarchy.masteredTopicsCount} Mastered
                      </p>
                    </div>
                  </div>

                  {/* Progress Ring / Percentage */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Mastery Progress</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {subHierarchy.overallMastery}% Mastery
                      </div>
                    </div>
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${subHierarchy.overallProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Modules Accordion */}
                <div className="space-y-4">
                  {subHierarchy.modules.map((module) => {
                    const isExpanded = expandedModules[module.id] ?? true;

                    return (
                      <div
                        key={module.id}
                        className="rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden"
                      >
                        {/* Module Header Bar */}
                        <div
                          onClick={() => toggleModule(module.id)}
                          className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <button className="text-slate-400 hover:text-white">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-white">
                                  {module.title}
                                </span>
                                {module.status === 'mastered' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Mastered
                                  </span>
                                )}
                                {module.status === 'needs_practice' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Needs Practice
                                  </span>
                                )}
                              </div>
                              {module.description && (
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                  {module.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{module.chapters.length} Chapters</span>
                            <span className="font-semibold text-slate-300">
                              {module.completionPercentage}% Done
                            </span>
                          </div>
                        </div>

                        {/* Chapters & Topics List */}
                        {isExpanded && (
                          <div className="border-t border-slate-800/80 divide-y divide-slate-850 bg-slate-900/30">
                            {module.chapters.map((chapter) => (
                              <div key={chapter.id} className="p-4 pl-10 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-400" />
                                    <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                                      Chapter: {chapter.title}
                                    </h4>
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {chapter.topics.length} topics
                                  </span>
                                </div>

                                {/* Topics Grid / List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  {chapter.topics.map((topic) => {
                                    const status = topic.status;
                                    const score = topic.mastery?.mastery_score || 0;

                                    return (
                                      <div
                                        key={topic.id}
                                        className="rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-3.5 transition-all flex flex-col justify-between gap-3 group"
                                      >
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                              {/* Difficulty Stars */}
                                              <div className="flex items-center text-amber-400">
                                                {Array.from({ length: topic.difficulty_level || 1 }).map((_, i) => (
                                                  <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                                                ))}
                                              </div>
                                              <span className="text-[10px] text-slate-500">
                                                • {topic.estimated_minutes || 15}m
                                              </span>
                                            </div>

                                            {/* Status Badge */}
                                            {status === 'mastered' && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                <Check className="w-3 h-3" />
                                                Mastered {score ? `(${Math.round(score)}%)` : ''}
                                              </span>
                                            )}
                                            {status === 'needs_practice' && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                <AlertCircle className="w-3 h-3" />
                                                Needs Practice
                                              </span>
                                            )}
                                            {status === 'in_progress' && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                <RotateCcw className="w-3 h-3" />
                                                In Progress {score ? `(${Math.round(score)}%)` : ''}
                                              </span>
                                            )}
                                            {status === 'not_started' && (
                                              <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                                                Not Started
                                              </span>
                                            )}
                                          </div>

                                          <h5 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                            {topic.name}
                                          </h5>
                                          {topic.description && (
                                            <p className="text-xs text-slate-400 line-clamp-2">
                                              {topic.description}
                                            </p>
                                          )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                                          <Link
                                            href={`/student/learning/${subHierarchy.subject.id}/${module.id}/${chapter.id}/${topic.id}?tab=learn`}
                                            className="flex-1 text-center py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 transition-colors"
                                          >
                                            📖 Learn
                                          </Link>
                                          <Link
                                            href={`/student/learning/${subHierarchy.subject.id}/${module.id}/${chapter.id}/${topic.id}?tab=practice`}
                                            className="flex-1 text-center py-1.5 px-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-[11px] font-bold text-white transition-colors"
                                          >
                                            📝 Practice
                                          </Link>
                                          <Link
                                            href={`/student/learning/${subHierarchy.subject.id}/${module.id}/${chapter.id}/${topic.id}?tab=quiz`}
                                            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
                                            title="Topic Quiz"
                                          >
                                            🎯 Quiz
                                          </Link>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: ⚡ Smart Personalized Path */}
      {activeTab === 'path' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/20 p-6 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Dynamic Adaptive Roadmap
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white">
              Your Real-Time Learning Sequence
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              This path dynamically updates as you complete practice sessions and quizzes. It connects your mastered foundations directly into targeted revision and next unlocking concepts.
            </p>
          </div>

          {/* 5-Step Sequence Cards */}
          <div className="space-y-4">
            {personalizedPath.map((step) => {
              const badgeColors: Record<string, string> = {
                emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                sky: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
              };

              const actionLabels: Record<string, string> = {
                mastered: 'Foundation Ready',
                revise: 'Targeted Revision',
                practice: 'Active Practice',
                next_concept: 'Next Concept',
                challenge: 'Mastery Challenge',
              };

              return (
                <div
                  key={step.step_order}
                  className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black flex items-center justify-center shrink-0">
                      #{step.step_order}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 font-semibold">
                          {step.subject_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors[step.badge_color] || badgeColors.sky}`}>
                          {step.status_badge}
                        </span>
                        <span className="text-xs text-slate-500">
                          • {actionLabels[step.action_type] || 'Action Step'}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white">
                        {step.topic_name}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {step.rationale}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={step.target_url}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                    >
                      <span>Launch Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: 🎯 Diagnostic Focus & Strengths */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Focus Areas (Weak Topics) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-black text-base">
                <AlertCircle className="w-5 h-5" />
                <span>Focus Areas Requiring Revision</span>
              </div>
              <span className="text-xs text-slate-400">Zero Shaming Policy</span>
            </div>

            {weakAreas.length === 0 ? (
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Critical Weak Areas Detected</h4>
                <p className="text-xs text-slate-400">
                  Your accuracy across attempted concepts is above benchmark. Keep exploring new modules!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {weakAreas.map((wa) => (
                  <div
                    key={wa.topic_id}
                    className="rounded-xl bg-slate-900/90 border border-rose-500/20 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-rose-400">
                          {wa.subject_name} • {wa.module_title || 'Core'}
                        </span>
                        <h4 className="text-base font-black text-white mt-0.5">
                          {wa.topic_name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-rose-400">{wa.accuracy}% Accuracy</div>
                        <div className="text-[10px] text-slate-400">{wa.attempts} attempts</div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-200">
                      <span className="font-semibold">Observation: </span>
                      {wa.primary_mistake_reason}
                    </div>

                    {/* 5-Step Action Plan */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-300">
                        Targeted Remediation Plan:
                      </div>
                      <div className="space-y-1 text-xs text-slate-400 pl-2">
                        {wa.remediation_steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/student/learning?topicId=${wa.topic_id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition-colors"
                      >
                        <span>Start Targeted Practice</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Demonstrated Strengths */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
              <Award className="w-5 h-5" />
              <span>Mastery Superpowers & Strengths</span>
            </div>

            {strengths.length === 0 ? (
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-2">
                <BrainCircuit className="w-10 h-10 text-indigo-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Building Foundation Strengths</h4>
                <p className="text-xs text-slate-400">
                  Complete topic quizzes with 80%+ score to graduate concepts to your Strengths showcase.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {strengths.map((str) => (
                  <div
                    key={str.topic_id}
                    className="rounded-xl bg-slate-900/90 border border-emerald-500/20 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-400">
                          {str.subject_name}
                        </span>
                        <h4 className="text-base font-black text-white mt-0.5">
                          {str.topic_name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400">
                          {str.mastery_score}% Mastery
                        </div>
                        <div className="text-[10px] text-slate-400">{str.accuracy}% accuracy</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      {str.highlight_skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
