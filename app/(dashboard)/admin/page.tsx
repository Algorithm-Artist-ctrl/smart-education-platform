// app/(dashboard)/admin/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import { 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  FolderPlus,
  BarChart3,
  Calendar,
  Sparkles,
  Server,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { Profile, AcademicClass, Subject, Institution } from '@/types/database.types';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || (user.user_metadata?.role as string) || 'admin';

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/student');
  }

  const userProfile: Profile = profile || {
    id: user.id,
    email: user.email || '',
    full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Admin',
    role: role as any,
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  // Fetch real platform/institution data
  const [
    profilesRes,
    classesRes,
    subjectsRes,
    institutionsRes,
    assessmentsRes,
    studentsCountRes,
    teachersCountRes,
    attemptsCountRes
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('classes').select('*, institution:institutions(*)'),
    supabase.from('subjects').select('*'),
    supabase.from('institutions').select('*').limit(1),
    supabase.from('assessments').select('*'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
  ]);

  const allUsers = (profilesRes.data || []) as Profile[];
  const classes = (classesRes.data || []) as AcademicClass[];
  const subjects = (subjectsRes.data || []) as Subject[];
  const institution = institutionsRes.data?.[0] as Institution | undefined;
  const assessments = assessmentsRes.data || [];

  const studentsCount = studentsCountRes.count ?? allUsers.filter((u) => u.role === 'student').length;
  const teachersCount = teachersCountRes.count ?? allUsers.filter((u) => u.role === 'teacher').length;
  const totalAttempts = attemptsCountRes.count ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient cosmic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-950/20 via-purple-950/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Header matching Screen 12 */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {userProfile.full_name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Platform overview and key metrics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards matching Screen 12 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Students */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Students</span>
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {studentsCount}
            </div>
            <span className="text-[10px] text-blue-400 font-semibold mt-1 inline-block">
              Enrolled Cadets
            </span>
          </div>

          {/* Teachers */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Teachers</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {teachersCount}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              Faculty Members
            </span>
          </div>

          {/* Active Courses */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Active Courses</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {subjects.length}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold mt-1 inline-block">
              Curriculum Tracks
            </span>
          </div>

          {/* Platform Challenges */}
          <div className="cosmic-card p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Assessments</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {assessments.length}
            </div>
            <span className="text-[10px] text-amber-400 font-semibold mt-1 inline-block">
              {totalAttempts} Quizzes Taken
            </span>
          </div>
        </div>

        {/* User Management Directory */}
        <div className="cosmic-card rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>User Directory & Role Permissions</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time user accounts managed with PostgreSQL Row Level Security.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {allUsers.length} Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-black text-indigo-300">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <span>{u.full_name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border ${
                        u.role === 'admin' || u.role === 'super_admin'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : u.role === 'teacher'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : u.role === 'parent'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
