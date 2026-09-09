// app/(dashboard)/admin/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  FolderPlus,
  BarChart3,
  Calendar
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
    assessmentsRes
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('classes').select('*, institution:institutions(*)'),
    supabase.from('subjects').select('*'),
    supabase.from('institutions').select('*').limit(1),
    supabase.from('assessments').select('*'),
  ]);

  const allUsers = (profilesRes.data || []) as Profile[];
  const classes = (classesRes.data || []) as AcademicClass[];
  const subjects = (subjectsRes.data || []) as Subject[];
  const institution = institutionsRes.data?.[0] as Institution | undefined;
  const assessments = assessmentsRes.data || [];

  const studentsCount = allUsers.filter((u) => u.role === 'student').length;
  const teachersCount = allUsers.filter((u) => u.role === 'teacher').length;
  const parentsCount = allUsers.filter((u) => u.role === 'parent').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={userProfile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span>Institution Administration</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {institution?.name || 'Institution Governance'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Code: <span className="font-mono font-semibold text-slate-700">{institution?.code || 'N/A'}</span> • Manage curriculum, classes, and user roles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-xl border border-indigo-100">
              {userProfile.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Students</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{studentsCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Enrolled learners</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Teachers</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{teachersCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Faculty members</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Academic Classes</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{classes.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Configured cohorts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">Active Subjects</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{subjects.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Course subjects</div>
          </div>
        </div>

        {/* Two-Column Grid: Users & Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* User Directory */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Registered Users</h3>
              <span className="text-xs text-slate-400">{allUsers.length} listed</span>
            </div>

            {allUsers.length === 0 ? (
              <EmptyState title="No Users Found" description="New registrations will appear here." />
            ) : (
              <>
                {/* Mobile Card List (< sm) */}
                <div className="block sm:hidden space-y-2.5">
                  {allUsers.map((u) => (
                    <div key={u.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">{u.full_name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] shrink-0 ${
                            u.role === 'teacher'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.role === 'admin' || u.role === 'super_admin'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[180px]">{u.email}</span>
                        <span>{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet/Desktop Table (>= sm) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-2">User</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2.5">
                            <div className="font-semibold text-slate-900">{u.full_name}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                                u.role === 'teacher'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : u.role === 'admin' || u.role === 'super_admin'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 text-[10px]">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Academic Classes & Subjects */}
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Academic Classes</h3>
              {classes.length === 0 ? (
                <EmptyState title="No Classes Configured" description="Classes will be added via seed or migration." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classes.map((cls) => (
                    <div key={cls.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="text-xs font-bold text-slate-900">{cls.name}</div>
                      <div className="text-[10px] text-slate-500">Grade Level {cls.grade_level}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Curriculum Subjects</h3>
              {subjects.length === 0 ? (
                <EmptyState title="No Subjects Configured" description="Subjects will appear here once registered." />
              ) : (
                <div className="space-y-2">
                  {subjects.map((s) => (
                    <div key={s.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.description || 'Core subject'}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 rounded font-semibold text-slate-700">
                        {s.code}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
