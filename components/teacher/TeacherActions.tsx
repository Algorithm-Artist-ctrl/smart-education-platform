'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AcademicClass, Subject } from '@/types/database.types';
import { Plus, FileText, Upload, BookOpen, Loader2, CheckCircle2 } from 'lucide-react';

interface TeacherActionsProps {
  classes: AcademicClass[];
  subjects: Subject[];
  teacherId: string;
}

export default function TeacherActions({ classes, subjects, teacherId }: TeacherActionsProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'assignment' | 'lesson' | 'quiz' | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Assignment form state
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignClass, setAssignClass] = useState(classes[0]?.id || '');
  const [assignSubject, setAssignSubject] = useState(subjects[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState(100);

  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonSubject, setLessonSubject] = useState(subjects[0]?.id || '');
  const [lessonBody, setLessonBody] = useState('');

  const supabase = createClient();

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('assignments').insert({
        class_id: assignClass,
        subject_id: assignSubject,
        teacher_id: teacherId,
        title: assignTitle,
        description: assignDesc,
        due_date: new Date(dueDate).toISOString(),
        max_points: maxPoints,
      });

      if (!error) {
        setSuccessMsg('Assignment published to students!');
        setTimeout(() => {
          setSuccessMsg(null);
          setActiveModal(null);
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find or attach to first topic of selected subject
      const { data: topics } = await supabase
        .from('topics')
        .select('id')
        .eq('subject_id', lessonSubject)
        .limit(1);

      let topicId = topics?.[0]?.id;

      if (!topicId) {
        const { data: newTopic } = await supabase
          .from('topics')
          .insert({
            subject_id: lessonSubject,
            name: `${lessonTitle} Overview`,
            difficulty_level: 1,
          })
          .select()
          .single();
        topicId = newTopic?.id;
      }

      const { error } = await supabase.from('learning_content').insert({
        topic_id: topicId,
        title: lessonTitle,
        content_type: 'lesson',
        body_markdown: lessonBody,
        created_by: teacherId,
      });

      if (!error) {
        setSuccessMsg('Curriculum lesson published successfully!');
        setTimeout(() => {
          setSuccessMsg(null);
          setActiveModal(null);
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Teaching Actions & Tools</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish new class material directly to your students in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActiveModal('assignment')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>

          <button
            onClick={() => setActiveModal('lesson')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Publish Lesson Material</span>
          </button>
        </div>
      </div>

      {/* Modal: Create Assignment */}
      {activeModal === 'assignment' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Post New Assignment</h3>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Quadratic Formula Homework Problems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea
                  required
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  placeholder="Complete questions 1 to 5 from chapter 4..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={assignClass}
                    onChange={(e) => setAssignClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={assignSubject}
                    onChange={(e) => setAssignSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Publish Lesson */}
      {activeModal === 'lesson' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Publish Learning Material</h3>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Laws of Motion Summary Notes"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={lessonSubject}
                  onChange={(e) => setLessonSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Content (Markdown Supported)
                </label>
                <textarea
                  required
                  rows={6}
                  value={lessonBody}
                  onChange={(e) => setLessonBody(e.target.value)}
                  placeholder="# Key Concepts\n- Point 1\n- Point 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Lesson</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
