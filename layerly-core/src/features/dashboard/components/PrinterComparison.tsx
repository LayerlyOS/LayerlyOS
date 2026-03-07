'use client';

import {
  BarChart3,
  Clock,
  Crown,
  Layers,
  Medal,
  Printer,
  RefreshCw,
  TrendingUp,
  Trophy,
  Weight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataLoader } from '@/components/ui/DataLoader';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/format';
import type { PrintEntry, Printer as PrinterType } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrinterStats {
  id: string;
  name: string;
  model: string;
  type: string;
  status: string;
  prints: number;
  hours: number;
  revenue: number;
  cost: number;
  profit: number;
  avgProfit: number;
  weight: number;
  margin: number;
  successRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStats(prints: PrintEntry[], printers: PrinterType[]): PrinterStats[] {
  return printers
    .map((p) => {
      const items = prints.filter((i) => String(i.printerId) === String(p.id));
      const total = items.length;
      const hours = items.reduce((acc, i) => acc + ((i.timeH || 0) + (i.timeM || 0) / 60) * (i.qty || 1), 0);
      // price is stored per-unit; profit & totalCost are stored as batch totals
      const cost = items.reduce((acc, i) => acc + (i.totalCost ?? 0), 0);
      const profit = items.reduce((acc, i) => acc + (i.profit ?? 0), 0);
      // Net revenue = cost + profit (avoids per-unit price * qty mismatch)
      const revenue = cost + profit;
      const weight = items.reduce((acc, i) => acc + (i.weight || 0) * (i.qty || 1), 0);
      const successful = items.filter((i) => (i as PrintEntry & { status?: string }).status !== 'failed' && (i as PrintEntry & { status?: string }).status !== 'canceled').length;

      return {
        id: String(p.id),
        name: p.name,
        model: p.model,
        type: p.type ?? 'FDM',
        status: p.status ?? 'available',
        prints: total,
        hours,
        revenue,
        cost,
        profit,
        avgProfit: total > 0 ? profit / total : 0,
        weight,
        // Gross margin: profit as % of net revenue
        margin: revenue > 0 ? (profit / revenue) * 100 : 0,
        successRate: total > 0 ? (successful / total) * 100 : 0,
      };
    })
    .filter((s) => s.prints > 0)
    .sort((a, b) => b.profit - a.profit);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 font-medium mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const RANK_CONFIG = [
  { icon: Trophy, bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-200', bar: '#f59e0b', label: '1st' },
  { icon: Medal, bg: 'bg-slate-100', text: 'text-slate-500', ring: 'ring-slate-200', bar: '#94a3b8', label: '2nd' },
  { icon: Medal, bg: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-200', bar: '#ea580c', label: '3rd' },
];

function PodiumCard({ stat, rank }: { stat: PrinterStats; rank: number }) {
  const cfg = RANK_CONFIG[rank] ?? {
    icon: Printer,
    bg: 'bg-indigo-50',
    text: 'text-indigo-500',
    ring: 'ring-indigo-100',
    bar: '#6366f1',
    label: `${rank + 1}th`,
  };
  const Icon = cfg.icon;

  return (
    <div
      className={`relative bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-3
        ${rank === 0 ? 'ring-2 ring-amber-200 shadow-amber-50' : ''}
      `}
    >
      {/* Rank badge */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.text} ring-2 ${cfg.ring}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.text} bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100`}>
          {cfg.label}
        </span>
      </div>

      {/* Name */}
      <div>
        <p className="text-base font-black text-slate-900 leading-tight">{stat.name}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.model}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profit</p>
          <p className="text-sm font-black text-emerald-600">{formatCurrency(stat.profit)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prints</p>
          <p className="text-sm font-black text-slate-800">{stat.prints}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hours</p>
          <p className="text-sm font-bold text-slate-700">{stat.hours.toFixed(1)} h</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margin</p>
          <p className="text-sm font-bold text-slate-700">{stat.margin.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = ['#f59e0b', '#94a3b8', '#ea580c', '#6366f1', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as PrinterStats;
  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700/60 text-sm min-w-[180px]">
      <p className="font-bold text-white mb-2 truncate">{d.name}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Profit</span>
          <span className="font-bold text-emerald-400">{formatCurrency(d.profit)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Revenue</span>
          <span className="font-semibold">{formatCurrency(d.revenue)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Prints</span>
          <span className="font-semibold">{d.prints}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Hours</span>
          <span className="font-semibold">{d.hours.toFixed(1)} h</span>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    FDM: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    SLA: 'bg-purple-50 text-purple-600 border-purple-100',
    SLS: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${map[type] ?? 'bg-slate-50 text-slate-500 border-slate-100'}`}>
      {type}
    </span>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

interface PrinterComparisonViewProps {
  printHistory: PrintEntry[];
  printers: PrinterType[];
  loading: boolean;
  onRefresh: () => void;
}

export function PrinterComparisonView({
  printHistory,
  printers,
  loading,
  onRefresh,
}: PrinterComparisonViewProps) {
  const stats = computeStats(printHistory, printers);

  const totalPrints = stats.reduce((a, s) => a + s.prints, 0);
  const totalHours = stats.reduce((a, s) => a + s.hours, 0);
  const totalProfit = stats.reduce((a, s) => a + s.profit, 0);
  const totalRevenue = stats.reduce((a, s) => a + s.revenue, 0);
  const maxProfit = stats[0]?.profit ?? 1;

  // ── Loading overlay ──────────────────────────────────────────────────────
  if (loading) {
    return <DataLoader message="Loading comparison data…" minHeight="full" />;
  }

  return (
    <>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        icon={<BarChart3 className="w-6 h-6" />}
        title="Printer Comparison"
        subtitle={`Performance ranking · ${printers.length} printer${printers.length !== 1 ? 's' : ''}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        }
      />

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-8">
        <KpiCard
          icon={Printer}
          label="Active Printers"
          value={String(stats.length)}
          sub={`of ${printers.length} total`}
          color="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          icon={Layers}
          label="Total Prints"
          value={String(totalPrints)}
          sub="across all machines"
          color="bg-slate-100 text-slate-500"
        />
        <KpiCard
          icon={Clock}
          label="Machine Hours"
          value={`${totalHours.toFixed(0)} h`}
          sub="cumulative print time"
          color="bg-violet-50 text-violet-600"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total Profit"
          value={formatCurrency(totalProfit)}
          sub={`from ${formatCurrency(totalRevenue)} net revenue`}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {stats.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No comparison data yet</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Start logging prints to your printers and the comparison will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Podium — top 3 ───────────────────────────────────────────────── */}
          {stats.length >= 2 && (
            <div className="mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5" /> Top performers
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.slice(0, 3).map((s, i) => (
                  <PodiumCard key={s.id} stat={s} rank={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── Chart ────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Profit by Printer</h3>
                <p className="text-xs text-slate-500 font-medium">Total profit across all recorded jobs</p>
              </div>
            </div>
            <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                  {stats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* ── Full Ranking Table ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Full Ranking</h3>
                  <p className="text-xs text-slate-500 font-medium">Sorted by total profit</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                {stats.length} printer{stats.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12">#</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Printer</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Prints</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Hours</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right hidden md:table-cell">Net Revenue</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Profit</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right hidden lg:table-cell">Avg / print</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right hidden lg:table-cell">
                      <span className="flex items-center gap-1 justify-end"><Weight className="w-3 h-3" /> Filament</span>
                    </th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32 hidden xl:table-cell">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.map((s, i) => {
                    const rankCfg = RANK_CONFIG[i];
                    const RankIcon = rankCfg?.icon ?? Printer;
                    const barPct = maxProfit > 0 ? (s.profit / maxProfit) * 100 : 0;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Rank */}
                        <td className="px-6 py-4">
                          {rankCfg ? (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rankCfg.bg} ${rankCfg.text}`}>
                              <RankIcon className="w-4 h-4" />
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-400 w-8 flex items-center justify-center">
                              {i + 1}
                            </span>
                          )}
                        </td>

                        {/* Printer name */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{s.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-xs text-slate-500">{s.model}</p>
                                <TypeBadge type={s.type} />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Prints */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            {s.prints}
                          </span>
                        </td>

                        {/* Hours */}
                        <td className="px-4 py-4 text-right font-mono text-sm text-slate-700 font-semibold">
                          {s.hours.toFixed(1)} h
                        </td>

                        {/* Revenue */}
                        <td className="px-4 py-4 text-right font-mono text-sm text-slate-600 hidden md:table-cell">
                          {formatCurrency(s.revenue)}
                        </td>

                        {/* Profit */}
                        <td className="px-4 py-4 text-right">
                          <span className={`font-mono text-sm font-black ${s.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(s.profit)}
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium text-right mt-0.5">
                            {s.margin.toFixed(1)}% margin
                          </p>
                        </td>

                        {/* Avg / print */}
                        <td className="px-4 py-4 text-right font-mono text-sm text-slate-600 hidden lg:table-cell">
                          {formatCurrency(s.avgProfit)}
                        </td>

                        {/* Filament weight */}
                        <td className="px-4 py-4 text-right text-sm text-slate-600 font-semibold hidden lg:table-cell">
                          {s.weight >= 1000
                            ? `${(s.weight / 1000).toFixed(2)} kg`
                            : `${s.weight.toFixed(0)} g`}
                        </td>

                        {/* Profit bar */}
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${barPct}%`,
                                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 w-8 text-right">
                              {barPct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Summary footer */}
                <tfoot>
                  <tr className="border-t-2 border-slate-100 bg-slate-50/60">
                    <td className="px-6 py-4" />
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-black text-indigo-600">{totalPrints}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-bold text-slate-700">
                      {totalHours.toFixed(1)} h
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm text-slate-600 hidden md:table-cell">
                      {formatCurrency(totalRevenue)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm font-black text-emerald-600">
                        {formatCurrency(totalProfit)}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell" />
                    <td className="px-4 py-4 hidden lg:table-cell" />
                    <td className="px-6 py-4 hidden xl:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Legacy compat export (used by Dashboard.tsx) ─────────────────────────────

interface LegacyPrinterComparisonProps {
  filtered: PrintEntry[];
  printers: PrinterType[];
  hydrated: boolean;
}

export function PrinterComparison({ filtered, printers, hydrated }: LegacyPrinterComparisonProps) {
  if (!hydrated) {
    return (
      <div className="rounded-2xl shadow-sm border overflow-hidden bg-white border-slate-200 mb-8 p-6">
        <p className="text-sm text-slate-500">Loading printers data…</p>
      </div>
    );
  }
  return (
    <PrinterComparisonView
      printHistory={filtered}
      printers={printers}
      loading={false}
      onRefresh={() => {}}
    />
  );
}
