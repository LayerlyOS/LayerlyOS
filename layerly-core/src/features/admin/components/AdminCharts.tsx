'use client';

import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { formatCurrency, formatDate } from '@/lib/format';
import { type PrintEntry } from '@/types';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  createdAt: string | Date;
  [key: string]: unknown;
}

interface AdminChartsProps {
  users: User[];
  prints: (PrintEntry & {
    user?: {
      settings?: {
        language?: string;
      };
    };
  })[];
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 min-w-[150px] overflow-hidden">
        {label && (
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">{label}</span>
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
                {typeof entry.value === 'number' && entry.name !== 'Users'
                  ? formatCurrency(entry.value, currency)
                  : entry.value}
              </span>
            </div>
          ))}
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

export function AdminCharts({ users, prints }: AdminChartsProps) {
  const [activeCurrency, setActiveCurrency] = useState<string>('USD');

  // 1. User Growth (Cumulative)
  const userGrowthData = useMemo(() => {
    if (!users || users.length === 0) return [];

    const sortedUsers = [...users].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const data: { date: string; count: number; label: string }[] = [];

    // Group by month
    const grouped = new Map<string, number>();

    sortedUsers.forEach((user) => {
      const date = new Date(user.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    let cumulative = 0;
    // Sort keys
    Array.from(grouped.keys())
      .sort()
      .forEach((key) => {
        cumulative += grouped.get(key) || 0;
        const [year, month] = key.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
        data.push({
          date: key,
          label: formatDate(dateObj, { month: 'short', year: 'numeric' }),
          count: cumulative,
        });
      });

    return data;
  }, [users]);

  // 2. Revenue & Profit (Monthly) - Grouped by Currency
  const { financialDataMap, availableCurrencies } = useMemo(() => {
    if (!prints || prints.length === 0) return { financialDataMap: {}, availableCurrencies: [] };

    const dataByCurrency: Record<string, Map<string, { revenue: number; profit: number; label: string }>> = {};

    prints.forEach((print) => {
      // Determine currency based on user language
      // pl -> PLN, anything else -> USD (default)
      const userLang = print.user?.settings?.language || 'en';
      const currency = userLang === 'pl' ? 'PLN' : 'USD';

      if (!dataByCurrency[currency]) {
        dataByCurrency[currency] = new Map();
      }

      const date = new Date(print.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = formatDate(date, { month: 'short', year: 'numeric' });

      const current = dataByCurrency[currency].get(key) || { revenue: 0, profit: 0, label };

      const price = (print.price || 0) * (print.qty || 1);
      const profit = print.profit || 0;

      dataByCurrency[currency].set(key, {
        ...current,
        revenue: current.revenue + price,
        profit: current.profit + profit,
      });
    });

    const processedData: Record<string, any[]> = {};
    const currencies = Object.keys(dataByCurrency);

    currencies.forEach((curr) => {
      processedData[curr] = Array.from(dataByCurrency[curr].entries())
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([_, val]) => val);
    });

    return { 
      financialDataMap: processedData, 
      availableCurrencies: currencies.sort() // Sort alphabetically (PLN, USD)
    };
  }, [prints]);

  // Set initial active currency if not set or invalid
  useMemo(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(activeCurrency)) {
      // Prefer USD as default, otherwise first available
      if (availableCurrencies.includes('USD')) {
        setActiveCurrency('USD');
      } else {
        setActiveCurrency(availableCurrencies[0]);
      }
    }
  }, [availableCurrencies, activeCurrency]);

  // 3. Filament Brands Distribution (by weight used in prints)
  const filamentData = useMemo(() => {
    if (!prints || prints.length === 0) return [];

    const map = new Map<string, number>();

    prints.forEach((print) => {
      if (print.filament?.brand) {
        const brand = print.filament.brand;
        const weight = (print.weight || 0) * (print.qty || 1);
        map.set(brand, (map.get(brand) || 0) + weight);
      }
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 brands
  }, [prints]);

  const hasFinancialData = availableCurrencies.length > 0;
  const hasUserData = userGrowthData.length > 0;
  const hasFilamentData = filamentData.length > 0;

  if (!hasFinancialData && !hasUserData && !hasFilamentData) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-8 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No analytics data</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          Charts will appear here once users start adding prints and using the system.
        </p>
      </div>
    );
  }

  const currentFinancialData = financialDataMap[activeCurrency] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <style>{`
        .recharts-wrapper *:focus {
          outline: none !important;
        }
      `}</style>

      {/* Revenue & Profit Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Finanse</h3>
            <p className="text-sm text-slate-500">Revenue and profit over time</p>
          </div>
          
          {/* Currency Switcher */}
          {availableCurrencies.length > 1 && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {availableCurrencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setActiveCurrency(curr)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    activeCurrency === curr 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          )}

          {/* Single Currency Label if only one exists */}
          {availableCurrencies.length === 1 && (
             <div className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
               {availableCurrencies[0]}
             </div>
          )}
        </div>
        {hasFinancialData ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentFinancialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value as number, activeCurrency)}
                />
                <Tooltip content={<CustomTooltip currency={activeCurrency} />} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  name="Revenue"
                  dataKey="revenue"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  name="Profit"
                  dataKey="profit"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart icon={BarChart3} label="No financial data" />
        )}
      </div>

      {/* User Growth Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">User growth</h3>
            <p className="text-sm text-slate-500">Total number of registered accounts</p>
          </div>
        </div>
        {hasUserData ? (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={userGrowthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                {/* biome-ignore lint/suspicious/noExplicitAny: Recharts tooltip props */}
                <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                <Area
                  name="Users"
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart icon={TrendingUp} label="No user data" />
        )}
      </div>

      {/* Filament Brands Distribution */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Brand popularity</h3>
            <p className="text-sm text-slate-500">By material usage (weight)</p>
          </div>
        </div>
        {hasFilamentData ? (
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filamentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {filamentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${((Number(value) || 0) / 1000).toFixed(1)} kg`,
                    'Usage',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart icon={PieChartIcon} label="No filament data" />
        )}
      </div>
    </div>
  );
}
