'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  Clock,
  Bell,
  Settings,
  RefreshCw,
  Activity,
  Zap,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { UptimeBars, type BarInterval, INTERVAL_META } from '@/features/status/UptimeBars';

// ─── Types ────────────────────────────────────────────────────────────────────

type MonitorGroup = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

type MonitorData = {
  id: string;
  name: string;
  status: string;
  responseTimeMs: number | null;
  lastCheckedAt: string | null;
  uptimePct30d: number | null;
  groupId: string | null;
};

type IncidentData = {
  id: string;
  title: string;
  status: string;
  severity: string;
  startedAt: string;
  resolvedAt: string | null;
};

type StatusData = {
  config: { name: string; description: string | null; logoUrl: string | null } | null;
  overallStatus: string;
  monitors: MonitorData[];
  recentIncidents: IncidentData[];
};

type CheckData = {
  [monitorId: string]: { status: string; checkedAt: string }[];
};

type MonitorCheck = {
  id: string;
  monitorId: string;
  status: string;
  responseTimeMs: number | null;
  checkedAt: string;
};

type MaintenanceWindow = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
};

// ─── Design tokens ──────────────────────────────────────────────────────────

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

const STATUS_DOT: Record<string, string> = {
  operational: 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
  degraded:    'bg-amber-500  shadow-[0_0_8px_rgba(251,191,36,0.6)]',
  down:        'bg-red-500    shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  maintenance: 'bg-slate-400',
};

const STATUS_LABEL: Record<string, string> = {
  operational: 'Operational', degraded: 'Degraded', down: 'Down',
  maintenance: 'Maintenance', investigating: 'Investigating',
  identified: 'Identified', monitoring: 'Monitoring', resolved: 'Resolved',
};

const OVERALL: Record<string, {
  heroBg: string;
  headingColor: string;
  label: string;
  sublabel: string;
  dotColor: string;
  badgeClass: string;
}> = {
  operational: {
    heroBg:       'from-emerald-50/60 to-transparent',
    headingColor: 'text-emerald-600',
    label:        'All Systems Operational',
    sublabel:     'All services are running normally.',
    dotColor:     'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    badgeClass:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  degraded: {
    heroBg:       'from-amber-50/60 to-transparent',
    headingColor: 'text-amber-600',
    label:        'Degraded Performance',
    sublabel:     'Some services are experiencing issues.',
    dotColor:     'bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    badgeClass:   'bg-amber-100 text-amber-700 border-amber-200',
  },
  down: {
    heroBg:       'from-red-50/60 to-transparent',
    headingColor: 'text-red-600',
    label:        'Service Outage',
    sublabel:     'We are actively investigating issues.',
    dotColor:     'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    badgeClass:   'bg-red-100 text-red-700 border-red-200',
  },
  maintenance: {
    heroBg:       'from-slate-100/60 to-transparent',
    headingColor: 'text-slate-700',
    label:        'Scheduled Maintenance',
    sublabel:     'Planned maintenance is in progress.',
    dotColor:     'bg-slate-400',
    badgeClass:   'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const SEVERITY_BORDER: Record<string, string> = {
  operational:  'border-l-emerald-500',
  degraded:     'border-l-amber-500',
  major_outage: 'border-l-red-500',
  maintenance:  'border-l-slate-300',
};

const ALL_INTERVALS: BarInterval[] = ['minute', 'hourly', '6h', 'daily'];

const INTERVAL_LABELS: Record<BarInterval, string> = {
  minute: '1 min',
  hourly: '1 hour',
  '6h':   '6h',
  daily:  '1 day',
};

// ─── Helper functions ────────────────────────────────────────────────────────

function groupStatus(monitors: MonitorData[]): string {
  if (monitors.some(m => m.status === 'down')) return 'down';
  if (monitors.some(m => m.status === 'degraded')) return 'degraded';
  if (monitors.some(m => m.status === 'maintenance')) return 'maintenance';
  return 'operational';
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.operational;
  const label = STATUS_LABEL[status] ?? 'Unknown';
  const Icon = ({
    operational: CheckCircle2, resolved: CheckCircle2,
    degraded: AlertTriangle, investigating: AlertTriangle,
    identified: AlertTriangle, monitoring: AlertTriangle,
    down: XCircle, maintenance: Wrench,
  } as Record<string, typeof CheckCircle2>)[status] ?? CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${badge}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function SparklineChart({ checks }: { checks: MonitorCheck[] }) {
  const ordered = [...checks].reverse(); // oldest → newest for left-to-right display
  if (ordered.length < 2) {
    return <p className="text-xs text-slate-400 text-center py-4">Not enough data yet.</p>;
  }

  const W = 600, H = 72;
  const responseTimes = ordered
    .filter(c => c.responseTimeMs != null && c.status === 'operational')
    .map(c => c.responseTimeMs as number);
  const minVal = responseTimes.length ? Math.min(...responseTimes) : 0;
  const maxVal = responseTimes.length ? Math.max(...responseTimes) : 1;
  const range = maxVal - minVal || 1;

  const toY = (ms: number | null, status: string) => {
    if (ms == null || status !== 'operational') return H - 4;
    return H - 8 - ((ms - minVal) / range) * (H - 18);
  };

  const pts = ordered.map((c, i) => ({
    x: (i / (ordered.length - 1)) * W,
    y: toY(c.responseTimeMs, c.status),
    isDown: c.status !== 'operational',
    check: c,
  }));

  const polylineStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${H} ${polylineStr} ${W},${H}`}
          fill="url(#sparkFill)"
        />
        <polyline
          points={polylineStr}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.filter(p => p.isDown).map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={H - 5} r="3.5" fill="#ef4444" opacity="0.8" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400 font-medium">{minVal}ms min</span>
        <span className="text-[10px] text-slate-400 font-medium">Response Time</span>
        <span className="text-[10px] text-slate-400 font-medium">{maxVal}ms max</span>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [checks, setChecks] = useState<CheckData>({});
  const [groups, setGroups] = useState<MonitorGroup[]>([]);
  const [activeMaintenance, setActiveMaintenance] = useState<MaintenanceWindow[]>([]);
  const [defaultInterval, setDefaultInterval] = useState<BarInterval>('hourly');
  const [activeInterval, setActiveInterval] = useState<BarInterval>('hourly');
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // #B — history modal
  const [historyMonitor, setHistoryMonitor] = useState<MonitorData | null>(null);
  const [historyChecks, setHistoryChecks] = useState<MonitorCheck[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // #D — animated status transitions
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const prevStatusesRef = useRef<Record<string, string>>({});

  const activeIntervalRef = useRef<BarInterval>('hourly');
  const userOverrideRef   = useRef(false);

  const fetchData = async () => {
    try {
      const [statusRes, checksRes, groupsRes, maintenanceRes] = await Promise.all([
        fetch('/api/status'),
        fetch(`/api/checks?interval=${activeIntervalRef.current}`),
        fetch('/api/admin/monitor-groups'),
        fetch('/api/maintenance-windows'),
      ]);

      if (statusRes.ok) {
        const newData: StatusData = await statusRes.json();
        // Track status changes for flash animation (#D)
        const changed = new Set<string>();
        for (const m of newData.monitors) {
          if (prevStatusesRef.current[m.id] && prevStatusesRef.current[m.id] !== m.status) {
            changed.add(m.id);
          }
          prevStatusesRef.current[m.id] = m.status;
        }
        if (changed.size > 0) {
          setAnimatingIds(changed);
          setTimeout(() => setAnimatingIds(new Set()), 1000);
        }
        setData(newData);
      }

      if (checksRes.ok) {
        const c = await checksRes.json();
        setChecks(c.checks ?? {});
        const def = (c.defaultInterval ?? c.barInterval ?? 'hourly') as BarInterval;
        setDefaultInterval(def);
        if (!userOverrideRef.current) {
          setActiveInterval(def);
          activeIntervalRef.current = def;
        }
      }

      if (groupsRes.ok) setGroups(await groupsRes.json());
      if (maintenanceRes.ok) setActiveMaintenance(await maintenanceRes.json());

      setLastUpdated(new Date());
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const switchInterval = async (iv: BarInterval) => {
    if (iv === activeIntervalRef.current || isSwitching) return;
    userOverrideRef.current   = true;
    activeIntervalRef.current = iv;
    setIsSwitching(true);
    setActiveInterval(iv);
    try {
      const res = await fetch(`/api/checks?interval=${iv}`);
      if (res.ok) setChecks((await res.json()).checks ?? {});
    } catch { /* silent */ }
    finally { setIsSwitching(false); }
  };

  const openHistory = async (m: MonitorData) => {
    setHistoryMonitor(m);
    setHistoryLoading(true);
    setHistoryChecks([]);
    try {
      const res = await fetch(`/api/monitors/${m.id}/history?limit=50`);
      if (res.ok) setHistoryChecks(await res.json());
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 60_000);
    return () => clearInterval(t);
  }, []);

  // ─── Derived values ────────────────────────────────────────────────────────

  const overallStatus    = data?.overallStatus ?? 'operational';
  const cfg              = OVERALL[overallStatus] ?? OVERALL.operational;
  const totalCount       = data?.monitors.length ?? 0;
  const operationalCount = data?.monitors.filter(m => m.status === 'operational').length ?? 0;
  const activeIncidents  = data?.recentIncidents.filter(i => i.status !== 'resolved') ?? [];
  const avgResponse = (() => {
    const w = data?.monitors.filter(m => m.responseTimeMs != null) ?? [];
    if (!w.length) return null;
    return Math.round(w.reduce((s, m) => s + (m.responseTimeMs ?? 0), 0) / w.length);
  })();

  // #A — group monitors
  const groupedSections = (() => {
    if (!data?.monitors.length) return [];
    const byGroup: Record<string, MonitorData[]> = {};
    const ungrouped: MonitorData[] = [];

    for (const m of data.monitors) {
      if (m.groupId) {
        if (!byGroup[m.groupId]) byGroup[m.groupId] = [];
        byGroup[m.groupId].push(m);
      } else {
        ungrouped.push(m);
      }
    }

    const result: { group: MonitorGroup | null; monitors: MonitorData[] }[] = [];
    const sortedGroups = [...groups].sort((a, b) =>
      a.displayOrder !== b.displayOrder
        ? a.displayOrder - b.displayOrder
        : a.name.localeCompare(b.name)
    );
    for (const g of sortedGroups) {
      if (byGroup[g.id]?.length) {
        result.push({ group: g, monitors: byGroup[g.id] });
      }
    }
    if (ungrouped.length) {
      result.push({ group: null, monitors: ungrouped });
    }
    return result;
  })();

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="bg-white sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div style={{ height: 36 }}>
            <Logo variant="dark" className="h-full w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/events"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              History
            </Link>
            <Link href="/subscribe">
              <Button variant="primary" size="sm" leftIcon={<Bell className="w-3.5 h-3.5" />}>
                Subscribe
              </Button>
            </Link>
            <Link
              href="/admin"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-1"
              title="Admin"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── #C MAINTENANCE BANNER ────────────────────────────────────────────── */}
      {activeMaintenance.length > 0 && (
        <div className="bg-slate-100 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <Wrench className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-800">
                {activeMaintenance.length === 1
                  ? `Scheduled Maintenance: ${activeMaintenance[0].title}`
                  : `${activeMaintenance.length} maintenance windows active`}
              </span>
              {activeMaintenance.length === 1 && activeMaintenance[0].description && (
                <span className="text-sm text-slate-600 ml-2 hidden sm:inline">
                  — {activeMaintenance[0].description}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500 shrink-0">
              Until {format(new Date(activeMaintenance[0].endsAt), 'HH:mm')}
            </span>
          </div>
        </div>
      )}

      {/* ── ACTIVE INCIDENT BANNER ───────────────────────────────────────────── */}
      {activeIncidents.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-amber-900">
                {activeIncidents.length === 1
                  ? activeIncidents[0].title
                  : `${activeIncidents.length} active incidents`}
              </span>
              {activeIncidents.length === 1 && (
                <span className="text-sm text-amber-700 ml-2 hidden sm:inline">
                  — We are actively investigating.
                </span>
              )}
            </div>
            <Link
              href="/events"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 shrink-0 transition-colors"
            >
              View details →
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO STATUS BAND ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 relative overflow-hidden">
        {/* #D — animated gradient transition on overall status change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={overallStatus}
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-indigo-100/50 rounded-full blur-[100px]" />
            <div className="absolute top-0 right-0 w-[400px] h-[250px] bg-blue-100/40 rounded-full blur-[90px]" />
          </motion.div>
        </AnimatePresence>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">

            {/* LEFT: Status heading */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dotColor} opacity-60`} />
                  <span className={`relative flex h-2 w-2 rounded-full ${cfg.dotColor}`} />
                </span>
                Live · Updated {format(lastUpdated, 'HH:mm')} UTC
              </p>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                {overallStatus === 'operational' ? (
                  <>All Systems <span className={cfg.headingColor}>Operational</span></>
                ) : (
                  <span className={cfg.headingColor}>{cfg.label}</span>
                )}
              </h1>
              <p className="text-slate-500 font-medium mt-3">{cfg.sublabel}</p>
            </div>

            {/* RIGHT: Stat chips */}
            <div className="flex sm:flex-col gap-3 flex-wrap">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[160px]">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Services up</p>
                  <p className="text-lg font-black text-slate-900 leading-tight">
                    {operationalCount}
                    <span className="text-slate-400 text-sm font-bold">/{totalCount}</span>
                  </p>
                </div>
              </div>

              {avgResponse != null && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[160px]">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg response</p>
                    <p className="text-lg font-black text-slate-900 leading-tight">
                      {avgResponse}
                      <span className="text-slate-400 text-sm font-bold">ms</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[160px]">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last checked</p>
                  <p className="text-lg font-black text-slate-900 leading-tight">
                    {format(lastUpdated, 'HH:mm')}
                    <span className="text-slate-400 text-sm font-bold"> UTC</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── SERVICES CARD ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Services</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {totalCount} {totalCount === 1 ? 'service' : 'services'} monitored
                {' · '}
                {INTERVAL_META[activeInterval].left} → now
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Interval switcher */}
              <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
                {ALL_INTERVALS.map(iv => (
                  <button
                    key={iv}
                    type="button"
                    onClick={() => switchInterval(iv)}
                    disabled={isSwitching}
                    title={iv === defaultInterval ? `${INTERVAL_LABELS[iv]} (default)` : INTERVAL_LABELS[iv]}
                    className={[
                      'relative text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all',
                      activeInterval === iv
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700',
                      isSwitching && activeInterval !== iv ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    {INTERVAL_LABELS[iv]}
                    {iv === defaultInterval && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setIsLoading(true); fetchData(); }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading || isSwitching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading services...</p>
            </div>

          /* Empty */
          ) : !data?.monitors.length ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Activity className="w-7 h-7 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">No monitors configured yet</p>
                <p className="text-xs text-slate-400 mt-1">Add monitors in the admin panel to see uptime data.</p>
              </div>
            </div>

          /* #A — Grouped monitor list */
          ) : (
            <div>
              {groupedSections.map(({ group, monitors: groupMonitors }) => (
                <div key={group?.id ?? '__ungrouped__'}>

                  {/* #A — Group header row */}
                  {group && (
                    <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-700">{group.name}</span>
                        {group.description && (
                          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                            — {group.description}
                          </span>
                        )}
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={groupStatus(groupMonitors)}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <StatusBadge status={groupStatus(groupMonitors)} />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Monitor rows */}
                  {groupMonitors.map((m) => {
                    const dot = STATUS_DOT[m.status] ?? STATUS_DOT.maintenance;
                    const monitorChecks = (checks[m.id] ?? []).map(c => ({
                      status:    c.status,
                      checkedAt: new Date(c.checkedAt),
                    }));
                    return (
                      /* #D — flash animation on status change, #B — clickable for history */
                      <motion.div
                        key={m.id}
                        animate={
                          animatingIds.has(m.id)
                            ? { backgroundColor: ['#ffffff', '#fef9c3', '#ffffff'] }
                            : {}
                        }
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                        className="px-6 py-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors cursor-pointer"
                        onClick={() => openHistory(m)}
                        title="View history"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {/* Glowing status dot */}
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              {m.status === 'operational' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40" />
                              )}
                              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dot}`} />
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">{m.name}</p>
                              <div className="hidden sm:flex items-center gap-2 mt-0.5">
                                {m.responseTimeMs != null && (
                                  <span className="text-xs text-indigo-600 font-bold">
                                    {m.responseTimeMs}ms
                                  </span>
                                )}
                                {m.uptimePct30d != null && (
                                  <>
                                    {m.responseTimeMs != null && (
                                      <span className="text-slate-300 text-xs">·</span>
                                    )}
                                    <span className={`text-xs font-bold ${
                                      m.uptimePct30d >= 99.5
                                        ? 'text-emerald-600'
                                        : m.uptimePct30d >= 95
                                        ? 'text-amber-600'
                                        : 'text-red-600'
                                    }`}>
                                      {m.uptimePct30d}% uptime
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* #D — animated status badge */}
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={m.status}
                                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.85, y: 4 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                              >
                                <StatusBadge status={m.status} />
                              </motion.div>
                            </AnimatePresence>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                        <UptimeBars checks={monitorChecks} interval={activeInterval} />
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RECENT INCIDENTS CARD ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Recent Incidents</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Last 7 days</p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!data?.recentIncidents.length ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">No incidents in the last 7 days</p>
                <p className="text-xs text-slate-400 mt-1">All systems have been running smoothly.</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentIncidents.slice(0, 5).map(inc => {
                const borderClass = SEVERITY_BORDER[inc.severity] ?? 'border-l-slate-300';
                return (
                  <li
                    key={inc.id}
                    className={`pl-5 pr-6 py-4 border-l-4 ${borderClass} hover:bg-slate-50/60 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm leading-snug">{inc.title}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Clock className="w-3 h-3 shrink-0" />
                          {format(new Date(inc.startedAt), 'MMM d, yyyy · HH:mm')}
                          {inc.resolvedAt && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-emerald-600 font-semibold">
                                Resolved {format(new Date(inc.resolvedAt), 'HH:mm')}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <StatusBadge status={inc.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer className="text-center py-4">
          <div className="inline-flex items-center gap-5 text-xs text-slate-400 font-medium">
            <Link href="/events" className="hover:text-slate-600 transition-colors">
              Incident history
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/subscribe" className="hover:text-slate-600 transition-colors">
              Subscribe to updates
            </Link>
            <span className="text-slate-300">·</span>
            <span>Powered by Layerly</span>
          </div>
        </footer>

      </main>

      {/* ── #B MONITOR HISTORY MODAL ─────────────────────────────────────────── */}
      <Modal
        isOpen={historyMonitor !== null}
        onClose={() => { setHistoryMonitor(null); setHistoryChecks([]); }}
        title={historyMonitor?.name ?? ''}
        icon={<Activity className="w-4 h-4" />}
        size="xl"
      >
        {historyLoading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading history...</p>
          </div>
        ) : historyChecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Activity className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 font-medium">No check history available yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sparkline chart */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Response Time — last {historyChecks.length} checks
              </p>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <SparklineChart checks={historyChecks} />
              </div>
            </div>

            {/* Checks table */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Recent Checks
              </p>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                <table className="w-full">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                        Status
                      </th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                        Response
                      </th>
                      <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3">
                        Checked At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyChecks.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-2.5 text-sm font-bold text-slate-700">
                          {c.responseTimeMs != null ? `${c.responseTimeMs}ms` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-400 font-medium">
                          {format(new Date(c.checkedAt), 'MMM d · HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
