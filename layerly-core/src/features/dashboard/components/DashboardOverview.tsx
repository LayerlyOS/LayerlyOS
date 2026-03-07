'use client';

import {
  Activity,
  Briefcase,
  MoreVertical,
  Package,
  Plus,
  Printer,
  TrendingUp,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { getProfit } from '@/features/prints/utils';
import { formatCurrency } from '@/lib/format';
import type { Filament, OrderStatus } from '@/types';
import type { PrintEntry, Printer as PrinterType } from '@/types';

function formatCurrencyUSD(val: number) {
  return formatCurrency(val, 'USD');
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTE: 'Quote',
  IN_PRODUCTION: 'In production',
  READY: 'Ready',
  SHIPPED: 'Shipped',
};

function getStatusBadge(status: string) {
  const s = status || '';
  if (s.includes('Ready') || s.includes('Shipped'))
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (s.includes('production')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (s.includes('Quote')) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

type ChartRange = '7d' | '14d' | '30d' | 'month';

const CHART_RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
];

const MAX_LOW_STOCK_DISPLAY = 5;
const MAX_NAMES_IN_SUMMARY = 3;

interface DashboardOverviewProps {
  printHistory: PrintEntry[];
  printers: PrinterType[];
  /** Warehouse – for low stock detection. */
  filaments?: Filament[];
  /** Threshold % (0–100): notify when stock is below this % of a full spool. */
  lowStockAlertPercent?: number;
  loading?: boolean;
  onEdit: (id: string | number) => void;
  onOpenPrintersModal: () => void;
  onViewAllPrints?: () => void;
  /** Opens warehouse modal (Order filament). */
  onOpenFilamentModal?: () => void;
}

export function DashboardOverview({
  printHistory,
  printers,
  filaments = [],
  lowStockAlertPercent = 20,
  loading = false,
  onEdit,
  onOpenPrintersModal,
  onViewAllPrints,
  onOpenFilamentModal,
}: DashboardOverviewProps) {
  const [chartRange, setChartRange] = useState<ChartRange>('7d');
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const printsThisMonth = useMemo(
    () =>
      printHistory.filter((p) => {
        const d = new Date(p.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [printHistory, currentMonth, currentYear]
  );

  const revenueThisMonth = useMemo(
    () => printsThisMonth.reduce((acc, p) => acc + (p.price ?? 0) * (p.qty || 1), 0),
    [printsThisMonth]
  );

  const profitThisMonth = useMemo(
    () => printsThisMonth.reduce((acc, p) => acc + (getProfit(p) ?? 0), 0),
    [printsThisMonth]
  );

  const chartData = useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const points: { day: string; dayLabel: string; amount: number }[] = [];

    if (chartRange === 'month') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const todayDate = today.getDate();
      for (let day = 1; day <= Math.min(daysInMonth, todayDate); day++) {
        const d = new Date(currentYear, currentMonth, day);
        const dateKey = d.toISOString().split('T')[0];
        const amount = printHistory
          .filter((p) => new Date(p.date).toISOString().split('T')[0] === dateKey)
          .reduce((acc, p) => acc + (p.price ?? 0) * (p.qty || 1), 0);
        points.push({
          day: dateKey,
          dayLabel: String(day),
          amount,
        });
      }
    } else {
      const daysCount = chartRange === '7d' ? 7 : chartRange === '14d' ? 14 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        const amount = printHistory
          .filter((p) => new Date(p.date).toISOString().split('T')[0] === dateKey)
          .reduce((acc, p) => acc + (p.price ?? 0) * (p.qty || 1), 0);
        const label =
          daysCount <= 7
            ? dayLabels[d.getDay()]
            : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        points.push({
          day: dateKey,
          dayLabel: label,
          amount,
        });
      }
    }
    return points;
  }, [printHistory, chartRange, currentMonth, currentYear]);

  const maxRevenue = useMemo(
    () => (chartData.length ? Math.max(...chartData.map((d) => d.amount), 1) : 1),
    [chartData]
  );

  const recentPrints = useMemo(
    () => [...printHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
    [printHistory]
  );

  const lowStockItems = useMemo(() => {
    const threshold = Math.min(100, Math.max(0, lowStockAlertPercent));
    return filaments
      .map((f) => {
        const remaining = f.remainingWeight ?? 0;
        const full = f.spoolWeight && f.spoolWeight > 0 ? f.spoolWeight : 1;
        const percent = (remaining / full) * 100;
        const label = [f.brand, f.materialName, f.color].filter(Boolean).join(' ');
        return { ...f, percent, label: label || f.materialName || 'Filament' };
      })
      .filter((f) => f.percent < threshold)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, MAX_LOW_STOCK_DISPLAY);
  }, [filaments, lowStockAlertPercent]);

  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isToday = (dayKey: string) => dayKey === todayKey;

  const hasData = printHistory.length > 0 || printers.length > 0;

  return (
    <div className="relative space-y-8">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Revenue (month)</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrencyUSD(revenueThisMonth)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Quotes this month</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {printsThisMonth.length} <span className="text-sm font-medium text-slate-400">items</span>
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Profit (month)</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrencyUSD(profitThisMonth)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Machines</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{printers.length}</h3>
              <p className="text-xs font-medium text-emerald-600 mb-1.5 bg-emerald-50 px-2 rounded">
                in fleet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low stock – single block with aggregation */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-600 to-slate-800 text-white shadow-lg overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-1">Low stock</h3>
                <p className="text-sm text-white/90">
                  {lowStockItems.length === 1
                    ? `System detected that ${lowStockItems[0].label} stock is below ${lowStockAlertPercent}% of spool capacity based on warehouse state.`
                    : lowStockItems.length <= MAX_NAMES_IN_SUMMARY
                      ? `${lowStockItems.length} materials below ${lowStockAlertPercent}%: ${lowStockItems.map((i) => i.label).join(', ')}.`
                      : `${lowStockItems.length} materials below ${lowStockAlertPercent}% spool capacity. E.g.: ${lowStockItems.slice(0, MAX_NAMES_IN_SUMMARY).map((i) => i.label).join(', ')} and others.`}
                </p>
              </div>
            </div>
            {onOpenFilamentModal && (
              <button
                type="button"
                onClick={onOpenFilamentModal}
                className="shrink-0 w-full sm:w-auto py-2.5 px-5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-white/95 transition-colors"
              >
                Order filament
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6 xl:space-y-8">
        {/* Revenue chart */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Revenue
            </h3>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value as ChartRange)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
            >
              {CHART_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="p-5 sm:p-6 bg-slate-50/80 relative">
            {/* Y-axis: 0 and max */}
            <div className="absolute left-5 top-6 bottom-20 w-10 flex flex-col justify-between text-[10px] font-medium text-slate-400 pointer-events-none">
              <span>{formatCurrencyUSD(maxRevenue)}</span>
              <span>0</span>
            </div>
            {/* Chart area with baseline and light grid */}
            <div className="ml-12 h-48 relative border-b-2 border-slate-200">
              {/* Horizontal grid lines */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-slate-100"
                  style={{ top: `${(i / 4) * 100}%` }}
                />
              ))}
              <div className="h-full flex items-end justify-between gap-2 sm:gap-3 overflow-x-auto overflow-y-visible pt-1 pb-0">
                {chartData.map((item) => {
                  const heightPercent = (item.amount / maxRevenue) * 100;
                  const today = isToday(item.day);
                  return (
                    <div
                      key={item.day}
                      className="flex flex-col items-center gap-2 flex-1 min-w-[32px] sm:min-w-[40px] h-full justify-end group shrink-0"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm mb-1 pointer-events-none whitespace-nowrap z-10">
                        {item.amount.toFixed(0)} USD
                      </div>
                      <div
                        className="w-full relative flex justify-center min-h-[8px]"
                        style={{ height: `${Math.max(heightPercent, 3)}%` }}
                      >
                        <div
                          className={`absolute bottom-0 w-7 sm:w-9 rounded-t-lg transition-all duration-300 ${
                            today ? 'bg-indigo-500 shadow-md shadow-indigo-200/50' : 'bg-indigo-200 group-hover:bg-indigo-300'
                          }`}
                          style={{ height: '100%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Day labels below baseline */}
            <div className="ml-12 mt-2 flex justify-between gap-2 sm:gap-3 overflow-x-auto">
              {chartData.map((item) => (
                <span
                  key={item.day}
                  className={`flex-1 min-w-[32px] sm:min-w-[40px] text-[11px] sm:text-xs font-semibold text-center whitespace-nowrap shrink-0 ${isToday(item.day) ? 'text-indigo-600' : 'text-slate-500'}`}
                  title={item.dayLabel}
                >
                  {item.dayLabel}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent quotes – full width */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Recent quotes
              </h3>
              {onViewAllPrints ? (
                <button
                  type="button"
                  onClick={onViewAllPrints}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  View all
                </button>
              ) : (
                <a
                  href="/dashboard"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  View all
                </a>
              )}
            </div>
            <div className="overflow-x-auto">
              {recentPrints.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No quotes yet. Add your first quote from the calculator.
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Project & Customer</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentPrints.map((project) => {
                      const statusLabel =
                        project.orderStatus != null
                          ? ORDER_STATUS_LABELS[project.orderStatus]
                          : '—';
                      const dateStr = new Date(project.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });
                      const amount = (project.price ?? 0) * (project.qty || 1);
                      return (
                        <tr
                          key={project.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => onEdit(project.id)}
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{project.name}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {project.orderCustomerName || '—'} · {String(project.id).slice(0, 8)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getStatusBadge(statusLabel)}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-medium">{dateStr}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-800">
                            {formatCurrencyUSD(amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-200 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(project.id);
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
        </div>

        {/* Machine fleet */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full">
          <div className="p-5 sm:p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-500" /> Machine fleet
            </h3>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md">
              {printers.length} machines
            </span>
          </div>
          <div className="p-3">
            {printers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No machines added. Add a printer to track quotes.
              </div>
            ) : (
              printers.map((printer) => (
                <div
                  key={printer.id}
                  className="p-4 hover:bg-slate-50 rounded-xl transition-colors mb-1 cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {printer.name}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      Ready
                    </span>
                  </div>
                  <div className="ml-5 mt-1">
                    <p className="text-xs text-slate-400">
                      {printer.model || 'No model'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 pt-4 pb-5 bg-slate-50/50 border-t border-slate-100">
            <button
              type="button"
              className="add-machine-btn w-full py-2.5 rounded-xl text-sm font-bold text-slate-500 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 appearance-none"
              style={{ outline: 'none', boxShadow: 'none', ['--tw-ring-shadow' as string]: '0 0 #0000', ['--tw-ring-offset-shadow' as string]: '0 0 #0000' }}
              onClick={onOpenPrintersModal}
            >
              <Plus className="w-4 h-4" /> Add machine to fleet
            </button>
          </div>
        </div>
      </div>
      {loading && hasData && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-sm font-bold text-slate-700 pr-2">Refreshing data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
