import { db } from '@/db';

export const dynamic = 'force-dynamic';
import { incidents, incidentUpdates } from '@/db/schema';
import { desc, asc } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  Clock,
  ArrowLeft,
  Calendar,
  Bell,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

// ─── Design tokens ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  operational:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  degraded:      'bg-amber-100 text-amber-700 border-amber-200',
  down:          'bg-red-100 text-red-700 border-red-200',
  maintenance:   'bg-slate-100 text-slate-600 border-slate-200',
  investigating: 'bg-amber-100 text-amber-700 border-amber-200',
  identified:    'bg-amber-100 text-amber-700 border-amber-200',
  monitoring:    'bg-blue-100 text-blue-700 border-blue-200',
  resolved:      'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_LABEL: Record<string, string> = {
  operational: 'Operational', degraded: 'Degraded', down: 'Down',
  maintenance: 'Maintenance', investigating: 'Investigating',
  identified: 'Identified', monitoring: 'Monitoring', resolved: 'Resolved',
};

const SEVERITY_STYLES: Record<string, { border: string; badge: string; label: string }> = {
  operational:  { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Operational'  },
  degraded:     { border: 'border-l-amber-500',   badge: 'bg-amber-100 text-amber-700 border-amber-200',       label: 'Degraded'     },
  major_outage: { border: 'border-l-red-500',     badge: 'bg-red-100 text-red-700 border-red-200',             label: 'Major Outage' },
  maintenance:  { border: 'border-l-slate-300',   badge: 'bg-slate-100 text-slate-600 border-slate-200',       label: 'Maintenance'  },
};

const FALLBACK_SEV = { border: 'border-l-slate-300', badge: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Unknown' };

// ─── Components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.operational;
  const label = STATUS_LABEL[status] ?? 'Unknown';
  const Icon = {
    operational: CheckCircle2, resolved: CheckCircle2,
    degraded: AlertTriangle, investigating: AlertTriangle,
    identified: AlertTriangle, monitoring: AlertTriangle,
    down: XCircle, maintenance: Wrench,
  }[status] ?? CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${badge}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function EventsPage() {
  const incidentsList = await db
    .select()
    .from(incidents)
    .orderBy(desc(incidents.startedAt));

  // Fetch all updates for all incidents in one query
  const allUpdates = incidentsList.length > 0
    ? await db
        .select()
        .from(incidentUpdates)
        .orderBy(asc(incidentUpdates.createdAt))
    : [];

  // Group updates by incidentId
  const updatesByIncident: Record<string, typeof allUpdates> = {};
  for (const u of allUpdates) {
    if (!updatesByIncident[u.incidentId]) updatesByIncident[u.incidentId] = [];
    updatesByIncident[u.incidentId].push(u);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Status
          </Link>
          <div style={{ height: 36 }}>
            <Logo variant="dark" className="h-full w-auto" />
          </div>
          <Link href="/subscribe">
            <Button variant="primary" size="sm" leftIcon={<Bell className="w-3.5 h-3.5" />}>
              Subscribe
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── PAGE HEADER — on bg-slate-50 (Layerly dashboard style) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Incident History</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              All events and incidents
            </p>
          </div>
        </div>
      </div>

      {/* ── INCIDENTS LIST ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {incidentsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-900 tracking-tight">No incidents recorded</p>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  All systems have been operating normally.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {incidentsList.map((inc) => {
                const sev = SEVERITY_STYLES[inc.severity] ?? FALLBACK_SEV;
                const isResolved = inc.status === 'resolved';
                const updates = updatesByIncident[inc.id] ?? [];
                return (
                  <li
                    key={inc.id}
                    className={`pl-5 pr-6 py-6 border-l-4 ${sev.border} hover:bg-slate-50/60 transition-colors`}
                  >
                    {/* Title + badges row */}
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-black text-slate-900 text-base leading-tight tracking-tight">
                        {inc.title}
                      </h2>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${sev.badge}`}>
                          {sev.label}
                        </span>
                        <StatusBadge status={inc.status} />
                      </div>
                    </div>

                    {/* Description */}
                    {inc.description && (
                      <p className="text-sm text-slate-500 mt-2.5 leading-relaxed font-medium">
                        {inc.description}
                      </p>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        Started {format(new Date(inc.startedAt), 'MMM d, yyyy · HH:mm')}
                      </span>
                      {inc.resolvedAt && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          Resolved {format(new Date(inc.resolvedAt), 'MMM d · HH:mm')}
                        </span>
                      )}
                      {!isResolved && (
                        <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          Ongoing
                        </span>
                      )}
                    </div>

                    {/* ── Updates Timeline ── */}
                    {updates.length > 0 && (
                      <div className="mt-5 ml-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                          Updates
                        </p>
                        <ol className="relative border-l border-slate-200 ml-1 space-y-0">
                          {updates.map((upd, idx) => {
                            const dotColor = {
                              investigating: 'bg-amber-400',
                              identified:    'bg-amber-400',
                              monitoring:    'bg-blue-400',
                              resolved:      'bg-emerald-500',
                            }[upd.status] ?? 'bg-slate-400';
                            const isLast = idx === updates.length - 1;
                            return (
                              <li key={upd.id} className={`ml-4 ${isLast ? 'pb-0' : 'pb-4'}`}>
                                {/* Dot */}
                                <span className={`absolute -left-[5px] flex items-center justify-center w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white`} />
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <StatusBadge status={upd.status} />
                                    <p className="text-sm text-slate-700 font-medium mt-1.5 leading-snug">
                                      {upd.message}
                                    </p>
                                  </div>
                                  <time className="text-xs text-slate-400 shrink-0 mt-0.5">
                                    {format(new Date(upd.createdAt), 'MMM d · HH:mm')}
                                  </time>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="text-center pt-8 pb-2">
          <div className="inline-flex items-center gap-5 text-xs text-slate-400 font-medium">
            <Link href="/" className="hover:text-slate-600 transition-colors">
              ← Back to status
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/subscribe" className="hover:text-slate-600 transition-colors">
              Subscribe to updates
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
