import { db } from '@/db';

export const dynamic = 'force-dynamic';
import { monitors, incidents } from '@/db/schema';
import { desc, ne, sql } from 'drizzle-orm';
import { Activity, AlertTriangle, CheckCircle2, Clock, Wifi } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { format } from 'date-fns';

const STATUS_BADGE: Record<string, string> = {
  investigating: 'bg-amber-100 text-amber-700 border-amber-200',
  identified:    'bg-amber-100 text-amber-700 border-amber-200',
  monitoring:    'bg-amber-100 text-amber-700 border-amber-200',
  resolved:      'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_LABEL: Record<string, string> = {
  investigating: 'Investigating',
  identified:    'Identified',
  monitoring:    'Monitoring',
  resolved:      'Resolved',
};

export default async function AdminDashboardPage() {
  const [monitorsCount, incidentsCount, recentIncidents] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(monitors),
    db.select({ count: sql<number>`count(*)` }).from(incidents).where(ne(incidents.status, 'resolved')),
    db.select().from(incidents).orderBy(desc(incidents.startedAt)).limit(5),
  ]);

  const totalMonitors  = Number(monitorsCount[0]?.count ?? 0);
  const activeIncidents = Number(incidentsCount[0]?.count ?? 0);
  const isHealthy      = activeIncidents === 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Status Page Overview"
        icon={<Activity className="w-6 h-6" />}
        actions={
          <Link href="/admin/monitors">
            <Button variant="primary" leftIcon={<Wifi className="w-4 h-4" />}>
              Add Monitor
            </Button>
          </Link>
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

        {/* Monitors */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Monitors
              </p>
              <p className="text-3xl font-black text-slate-900 leading-none">{totalMonitors}</p>
              <p className="text-xs text-slate-400 font-medium mt-1.5">Total configured</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Active incidents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Active Incidents
              </p>
              <p className={`text-3xl font-black leading-none ${activeIncidents > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {activeIncidents}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1.5">
                {activeIncidents > 0 ? 'Need attention' : 'None active'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${activeIncidents > 0 ? 'bg-amber-50' : 'bg-slate-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${activeIncidents > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
          </div>
        </div>

        {/* Overall status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                System Status
              </p>
              <p className={`text-xl font-black leading-tight mt-1 ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isHealthy ? 'All Operational' : 'Issues Detected'}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1.5">
                {isHealthy ? 'Everything is running smoothly' : 'Check active incidents'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isHealthy ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <CheckCircle2 className={`w-5 h-5 ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent incidents ── */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Recent Incidents</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Last 5 incidents
            </p>
          </div>
          <Link href="/admin/incidents">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {recentIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">No incidents yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Your systems are running smoothly.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentIncidents.map((inc) => {
              const badge = STATUS_BADGE[inc.status] ?? STATUS_BADGE.investigating;
              const label = STATUS_LABEL[inc.status] ?? inc.status;
              return (
                <li
                  key={inc.id}
                  className="px-6 py-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{inc.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {format(new Date(inc.startedAt), 'MMM d, yyyy · HH:mm')}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${badge}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
