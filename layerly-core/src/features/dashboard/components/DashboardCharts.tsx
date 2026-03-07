'use client';

import { BarChart3, PieChart as PieChartIcon, RefreshCw, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataLoader } from '@/components/ui/DataLoader';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import type { PrintEntry } from '@/types';

interface DashboardChartsProps {
  filteredData: PrintEntry[];
  loading?: boolean;
}

// -- Custom Tooltip Component (Shadcn UI style) --
const CustomTooltip = ({
  active,
  payload,
  label,
  unit = 'currency',
  costLabel,
  }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hasCost = unit === 'currency' && typeof data.cost === 'number';

    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 min-w-[150px] overflow-hidden">
        {label && (
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-2">
            <i className="fa-regular fa-calendar text-slate-400 text-xs"></i>
            <p className="text-xs font-semibold text-slate-700">{label}</p>
          </div>
        )}

        <div className="px-3 py-2 space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="block h-2.5 w-2.5 rounded-[2px] shadow-sm"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-slate-500 text-xs font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-slate-700 font-mono text-xs">
                {typeof entry.value === 'number'
                  ? unit === 'weight'
                    ? `${formatNumber(entry.value, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} g`
                    : formatCurrency(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}

          {hasCost && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="block h-2.5 w-2.5 rounded-[2px] bg-slate-300 shadow-sm" />
                <span className="text-slate-500 text-xs font-medium">{costLabel}</span>
              </div>
              <span className="font-bold text-slate-600 font-mono text-xs">
                {formatCurrency(data.cost)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const EmptyChart = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="h-[180px] w-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
    <div className="p-3 bg-white rounded-full shadow-sm mb-3">
      <Icon className="w-6 h-6 text-slate-300" />
    </div>
    <span className="text-sm font-medium text-slate-500">{label}</span>
  </div>
);

export function DashboardCharts({ filteredData, loading = false }: DashboardChartsProps) {

  // 1. Process Data for Area Chart (Profit over time - Daily)
  const dailyData = useMemo(() => {
    if (loading) return [];
    const map = new Map<string, { date: string; profit: number; cost: number }>();

    filteredData.forEach((item) => {
      const dateKey = new Date(item.date).toISOString().split('T')[0]; // YYYY-MM-DD
      const current = map.get(dateKey) || { date: dateKey, profit: 0, cost: 0 };

      const profit = item.profit ?? 0;
      const unitCost = item.totalCost ?? 0;
      const qty = item.qty || 1;
      const totalCost = unitCost * qty;

      map.set(dateKey, {
        date: current.date,
        profit: current.profit + profit,
        cost: current.cost + totalCost,
      });
    });

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        displayDate: formatDate(item.date, {
          day: 'numeric',
          month: 'short',
        }),
      }));
  }, [filteredData, loading]);

  // 2. Process Data for Bar Chart (Monthly Summary)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; revenue: number; cost: number }>();

    filteredData.forEach((item) => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`; // Unique month key
      const name = formatDate(date, {
        month: 'short',
        year: 'numeric',
      });

      const current = map.get(key) || { name, profit: 0, revenue: 0, cost: 0 };

      const profit = item.profit ?? 0;
      const unitCost = item.totalCost || 0;
      const qty = item.qty || 1;
      const totalCost = unitCost * qty;
      const revenue = totalCost + profit;

      map.set(key, {
        name,
        profit: current.profit + profit,
        revenue: current.revenue + revenue,
        cost: current.cost + totalCost,
      });
    });

    // Sort by key (chronologically) but return array
    return Array.from(map.entries())
      .sort(([keyA], [keyB]) => {
        const [yearA, monthA] = keyA.split('-').map(Number);
        const [yearB, monthB] = keyB.split('-').map(Number);
        return yearA !== yearB ? yearA - yearB : monthA - monthB;
      })
      .map(([_, val]) => val);
  }, [filteredData]);

  // 3. Process Data for Donut Chart (Material Usage)
  const materialData = useMemo(() => {
    const map: { [key: string]: number } = {};
    filteredData.forEach((i) => {
      const c = i.color || 'Other';
      map[c] = (map[c] || 0) + i.weight * i.qty;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Colors Palette
  const palette = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
  ];

  if (loading && filteredData.length === 0) {
    return (
      <div className="mb-8">
        <DataLoader />
      </div>
    );
  }

  const hasDailyData = dailyData.length > 0;
  const hasMonthlyData = monthlyData.length > 0;
  const hasMaterialData = materialData.length > 0;

  if (!loading && !hasDailyData && !hasMonthlyData && !hasMaterialData) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No analytical data</h3>
        <p className="text-slate-500 max-w-md mx-auto">Charts will appear here once you add your first prints.</p>
      </div>
    );
  }

  return (
    <FeatureGate feature="advancedAnalytics" mode="blur">
      <div className="relative space-y-6 mb-8">
        {/* Row 1: Profit Trend (Area Chart) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Profit Trend</h3>
              <p className="text-sm text-slate-500">Real-time profit analysis</p>
            </div>
          </div>
          {hasDailyData ? (
            <div
              className="h-[300px] w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none"
              tabIndex={-1}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="displayDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value as number)}
                  />
                  <Tooltip
                    content={(props) => (
                      <CustomTooltip
                        {...props}
                        unit="currency"
                        costLabel="Costs"
                      />
                    )}
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart icon={TrendingUp} label="No data to display trend" />
          )}
        </div>

        {/* Row 2: Grid for Monthly & Materials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Summary (Bar Chart) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Monthly summary</h3>
            <p className="text-sm text-slate-500 mb-6">Revenue, profit and costs by month</p>
            {hasMonthlyData ? (
              <div
                className="h-[250px] [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none"
                tabIndex={-1}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value as number)}
                    />
                    <Tooltip
                      content={(props) => (
                        <CustomTooltip
                          {...props}
                          unit="currency"
                          costLabel="Costs"
                        />
                      )}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="profit"
                      name="Profit"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart icon={BarChart3} label="No monthly data" />
            )}
          </div>

          {/* Material Usage (Donut Chart) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Material usage</h3>
            <p className="text-sm text-slate-500 mb-6">Material distribution by color</p>
            {hasMaterialData ? (
              <div
                className="h-[280px] [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none [&_.recharts-surface]:!overflow-visible"
                tabIndex={-1}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 18, right: 0, bottom: 52, left: 0 }}>
                    <Pie
                      data={materialData}
                      cx="50%"
                      cy="42%"
                      innerRadius={66}
                      outerRadius={86}
                      paddingAngle={2}
                      cornerRadius={6}
                      stroke="none"
                      dataKey="value"
                      nameKey="name"
                    >
                      {materialData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={palette[index % palette.length]}
                          strokeWidth={0}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={(props) => <CustomTooltip {...props} unit="weight" />} />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      formatter={(value, _) => (
                        <span className="text-slate-600 text-sm ml-2">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart icon={PieChartIcon} label="No material usage data" />
            )}
          </div>
        </div>
        {loading && filteredData.length > 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
              <span className="text-sm font-bold text-slate-700 pr-2">Refreshing data...</span>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
