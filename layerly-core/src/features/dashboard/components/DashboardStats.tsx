'use client';

import { DataLoader } from '@/components/ui/DataLoader';
import { getProfit } from '@/features/prints/utils';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { PrintEntry, Printer } from '@/types';
import { RefreshCw } from 'lucide-react';

interface DashboardStatsProps {
  filtered: PrintEntry[];
  selectedPrinterId: string | number | null;
  printers: Printer[];
  loading?: boolean;
}

export function DashboardStats({
  filtered,
  selectedPrinterId,
  printers,
  loading = false,
}: DashboardStatsProps) {
  if (loading && filtered.length === 0) {
    return (
      <div className="mb-4 md:mb-8">
        <DataLoader className="min-h-[120px]" />
      </div>
    );
  }

  const selectedPrinter = selectedPrinterId
    ? printers.find((p) => String(p.id) === String(selectedPrinterId))
    : null;

  const totalTime = filtered.reduce((acc, i) => acc + (i.timeH + i.timeM / 60) * (i.qty || 1), 0);

  const totalProfit = filtered.reduce((acc, i) => acc + getProfit(i), 0);

  return (
    <div className="relative grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
      <div className="rounded-2xl shadow-sm border overflow-hidden p-3 md:p-6 bg-white border-slate-200">
        <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1 md:mb-2">
          Printer
        </h4>
        <div className="text-slate-800 font-semibold text-sm md:text-lg truncate">
          {selectedPrinter ? selectedPrinter.name : 'All'}
        </div>
        <div className="text-slate-500 text-[10px] md:text-sm truncate">
          {selectedPrinter ? selectedPrinter.model : 'Aggregate statistics'}
        </div>
      </div>
      <div className="rounded-2xl shadow-sm border overflow-hidden p-3 md:p-6 bg-white border-slate-200">
        <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1 md:mb-2">
          Print count
        </h4>
        <div className="text-slate-800 font-bold text-lg md:text-2xl">
          {formatNumber(filtered.length)}
        </div>
        <div className="text-slate-500 text-[10px] md:text-sm">Filtered</div>
      </div>
      <div className="rounded-2xl shadow-sm border overflow-hidden p-3 md:p-6 bg-white border-slate-200">
        <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1 md:mb-2">
          Total time
        </h4>
        <div className="text-slate-800 font-bold text-lg md:text-2xl">
          {formatNumber(totalTime, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}{' '}
          h
        </div>
        <div className="text-slate-500 text-[10px] md:text-sm">Total</div>
      </div>
      <div className="rounded-2xl shadow-sm border overflow-hidden p-3 md:p-6 bg-white border-slate-200">
        <h4 className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1 md:mb-2">
          Total profit
        </h4>
        <div className="text-green-600 font-bold text-lg md:text-2xl">
          {formatCurrency(totalProfit)}
        </div>
        <div className="text-slate-500 text-[10px] md:text-sm">Profit</div>
      </div>
      {loading && filtered.length > 0 && (
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
