// app/(dashboard)/student/study-plan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { StudyPlan, Subject, Topic } from '@/types/database.types';
import { enqueueAction } from '@/lib/offline/db';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Trash2
} from 'lucide-react';

export default function StudyPlanPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [savingTask, setSavingTask] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const [subRes, topRes] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('topics').select('*'),
      ]);

      if (subRes.data) setSubjects(subRes.data);
      if (topRes.data) setTopics(topRes.data);
      if (subRes.data && subRes.data.length > 0) setSubjectId(subRes.data[0].id);

      // Load tasks for date
      const { data: planData } = await supabase
        .from('study_plans')
        .select('*, subject:subjects(*), topic:topics(*)')
        .eq('student_id', user.id)
        .eq('plan_date', selectedDate)
        .order('created_at', { ascending: true });

      if (planData) setPlans(planData as StudyPlan[]);
      setLoading(false);
    }

    loadData();
  }, [selectedDate, router, supabase]);

  const toggleTaskComplete = async (plan: StudyPlan) => {
    const newStatus = plan.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id ? { ...p, status: newStatus, completed_at: completedAt } : p
      )
    );

    if (navigator.onLine) {
      await supabase
        .from('study_plans')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', plan.id);
    } else {
      await enqueueAction({
        type: 'COMPLETE_STUDY_TASK',
        payload: { id: plan.id, completed_at: completedAt },
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title) return;
    setSavingTask(true);

    try {
      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          student_id: userId,
          plan_date: selectedDate,
          title,
          description: description || null,
          subject_id: subjectId || null,
          topic_id: topicId || null,
          duration_minutes: durationMinutes,
          priority,
          status: 'pending',
        })
        .select('*, subject:subjects(*), topic:topics(*)')
        .single();

      if (data) {
        setPlans((prev) => [...prev, data as StudyPlan]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSavingTask(false);
    }
  };

  const deleteTask = async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('study_plans').delete().eq('id', id);
  };

  const completedCount = plans.filter((p) => p.status === 'completed').length;
  const progressPercent = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Smart Daily Agenda</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Study Planner</h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete scheduled revision, homework, and practice modules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {plans.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:w-2/3">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Daily Completion Progress</span>
                <span className="text-indigo-600">
                  {completedCount} of {plans.length} Tasks ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {progressPercent === 100 ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> All tasks completed today!
                </span>
              ) : (
                <span>{plans.length - completedCount} tasks remaining</span>
              )}
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : plans.length === 0 ? (
            <EmptyState
              title="No Study Tasks Planned"
              description={`You have no tasks scheduled for ${selectedDate}. Plan your revision or add tasks.`}
              action={
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Study Task</span>
                </button>
              }
            />
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition flex items-center justify-between bg-white ${
                  plan.status === 'completed'
                    ? 'border-slate-200 bg-slate-50/70'
                    : 'border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleTaskComplete(plan)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition"
                  >
                    {plan.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-semibold ${
                          plan.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {plan.title}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          plan.priority === 'urgent' || plan.priority === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {plan.priority}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {plan.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {plan.duration_minutes} mins
                      </span>
                      {plan.subject?.name && <span>• {plan.subject.name}</span>}
                      {plan.topic?.name && <span>• {plan.topic.name}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(plan.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal: Create Task */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-4">Add Study Task</h3>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Practice Trigonometric Identities"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Solve 10 problems from notes"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">None / General</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTask}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    {savingTask && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Task</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
