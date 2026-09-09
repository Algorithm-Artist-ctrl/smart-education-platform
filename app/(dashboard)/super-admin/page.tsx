// app/(dashboard)/super-admin/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/shared/Navbar';
import EmptyState from '@/components/ui/EmptyState';
import { ShieldCheck, Server, Key, Database, Activity, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/super-admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    redirect('/student');
  }

  const [institutionsRes, auditLogsRes, profilesRes] = await Promise.all([
    supabase.from('institutions').select('*'),
    supabase.from('audit_logs').select('*, user:profiles(*)').order('created_at', { ascending: false }).limit(20),
    supabase.from('profiles').select('*'),
  ]);

  const institutions = institutionsRes.data || [];
  const auditLogs = auditLogsRes.data || [];
  const allUsers = profilesRes.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Platform-Level Governance</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Super Admin Command Center</h1>
            <p className="text-sm text-slate-500 mt-1">
              Global institutions, system telemetry, and tamper-resistant audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 bg-rose-50 text-rose-700 font-semibold rounded-xl border border-rose-100">
              System Administrator
            </span>
          </div>
        </div>

        {/* Global Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Institutions</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{institutions.length}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Platform Accounts</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{allUsers.length}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Audit Events</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{auditLogs.length}</div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">System Audit Trail</h3>
            </div>
            <span className="text-xs text-slate-400">Latest 20 recorded activities</span>
          </div>

          {auditLogs.length === 0 ? (
            <EmptyState
              title="No Audit Records"
              description="System actions, role elevations, and security events will be securely recorded here."
            />
          ) : (
            <>
              {/* Mobile Card List (< sm) */}
              <div className="block sm:hidden space-y-2.5">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Entity: <span className="font-mono text-slate-800">{log.entity}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>By: {log.user?.full_name || 'System / Service'}</span>
                      <span className="font-mono">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tablet/Desktop Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Target Entity</th>
                      <th className="pb-2">Triggered By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 text-slate-400 text-[10px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 font-semibold text-slate-900">{log.action}</td>
                        <td className="py-2.5 text-slate-600">{log.entity} ({log.entity_id || 'N/A'})</td>
                        <td className="py-2.5 text-slate-700">{log.user?.full_name || 'System / Service'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
