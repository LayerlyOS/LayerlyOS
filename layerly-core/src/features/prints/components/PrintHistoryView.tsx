'use client';

import {
  AlertCircle,
  Box,
  Calendar,
  CheckCircle,
  CopyPlus,
  Eye,
  FileText,
  Pencil,
  Printer as PrinterIcon,
  Scale,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SearchInput } from '@/components/ui/SearchInput';
import { PrintJobDetailsModal } from '@/features/prints/components/PrintJobDetailsModal';
import { formatCurrency } from '@/lib/format';
import type { PrintEntry, Printer, Settings } from '@/types';

type FilamentLike = {
  id: string;
  materialName?: string;
  brand: string;
  color: string;
  colorHex?: string | null;
  spoolPrice?: number;
  spoolWeight?: number;
};

interface PrintHistoryViewProps {
  printHistory: PrintEntry[];
  settings: Settings;
  printers: Printer[];
  filaments: FilamentLike[];
  onEdit: (id: string | number) => void;
  onRequestDelete: (id: string | number) => void;
  onDuplicate: (id: string | number) => void;
  onSaved?: () => void;
  operatorName?: string;
}

function formatDuration(timeH: number, timeM: number): string {
  const h = timeH ?? 0;
  const m = timeM ?? 0;
  if (h === 0 && m === 0) return '0h 0m';
  return `${h}h ${m}m`;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: 'success' | 'failed' | 'canceled' }) {
  const configs = {
    success: {
      icon: CheckCircle,
      text: 'Completed',
      colors: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    failed: {
      icon: AlertCircle,
      text: 'Failed',
      colors: 'bg-red-100 text-red-700 border-red-200',
    },
    canceled: {
      icon: XCircle,
      text: 'Canceled',
      colors: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };
  const cfg = configs[status] ?? configs.canceled;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${cfg.colors}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.text}
    </span>
  );
}

export function PrintHistoryView({
  printHistory,
  settings,
  printers,
  filaments,
  onEdit,
  onRequestDelete,
  onDuplicate,
  onSaved,
  operatorName,
}: PrintHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printerFilter, setPrinterFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedJob, setSelectedJob] = useState<PrintEntry | null>(null);

  const setLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateFrom(start.toISOString().slice(0, 10));
    setDateTo(end.toISOString().slice(0, 10));
  };

  const filtered = useMemo(() => {
    return printHistory.filter((job) => {
      const search = searchTerm.trim().toLowerCase();
      if (search) {
        const byId = String(job.id).toLowerCase().includes(search);
        const byName = (job.name || '').toLowerCase().includes(search);
        const byClient =
          (job.orderCustomerName || '').toLowerCase().includes(search) ||
          (job.orderTitle || '').toLowerCase().includes(search);
        if (!byId && !byName && !byClient) return false;
      }
      if (statusFilter !== 'all') {
        const s = job.status === 'failed' || job.status === 'canceled' ? job.status : 'success';
        if (s !== statusFilter) return false;
      }
      if (printerFilter !== 'all' && String(job.printerId) !== printerFilter) return false;
      const jobDate = job.date.slice(0, 10);
      if (dateFrom && jobDate < dateFrom) return false;
      if (dateTo && jobDate > dateTo) return false;
      return true;
    });
  }, [printHistory, searchTerm, statusFilter, printerFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const success = filtered.filter(
      (j) => (j.status !== 'failed' && j.status !== 'canceled') || !j.status
    ).length;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;
    const totalGrams = filtered.reduce((acc, j) => acc + (j.weight || 0) * (j.qty || 1), 0);
    const totalCost = filtered.reduce((acc, j) => acc + (j.totalCost ?? 0), 0);
    return {
      total,
      rate,
      totalKg: (totalGrams / 1000).toFixed(2),
      totalCostNum: totalCost,
    };
  }, [filtered]);

  const getPrinterName = (printerId: string | undefined) => {
    if (!printerId) return '—';
    const p = printers.find((x) => String(x.id) === String(printerId));
    return p?.name ?? '—';
  };

  const getClientLabel = (job: PrintEntry) =>
    job.orderCustomerName || job.orderTitle || 'Own';

  return (
    <div className="flex flex-col">
      {/* KPI cards – unified pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Jobs (filtered)</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Success rate</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.rate}%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Material used</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stats.totalKg} <span className="text-base font-bold text-slate-500">kg</span></p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total cost</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalCostNum)}</p>
          </div>
        </div>
      </div>

      {/* Filter bar – one row on desktop, clear spacing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex-1 min-w-0 sm:max-w-sm">
            <SearchInput
              placeholder="Search by ID, file name, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="md"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:flex-nowrap">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'success', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'canceled', label: 'Canceled' },
              ]}
              className="w-full sm:w-[180px]"
              size="md"
            />
            <CustomSelect
              value={printerFilter}
              onChange={setPrinterFilter}
              options={[
                { value: 'all', label: 'All machines' },
                ...printers.map((p) => ({ value: String(p.id), label: p.name })),
              ]}
              className="w-full sm:w-[200px]"
              size="md"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={setLast30Days}
              className="w-full sm:w-auto shrink-0 font-bold"
            >
              <Calendar className="w-4 h-4" />
              Last 30 days
            </Button>
          </div>
        </div>
      </div>

      {/* Table – UI Kit */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Task & Client
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Machine & Material
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Start time
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">
                  Cost
                </th>
                <th className="px-5 py-4 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((job) => {
                  const status =
                    job.status === 'failed' || job.status === 'canceled'
                      ? job.status
                      : 'success';
                  return (
                    <tr
                      key={String(job.id)}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 mb-0.5">
                            {String(job.id)}
                          </span>
                          <span
                            className="text-xs font-mono text-slate-500 truncate max-w-[200px]"
                            title={job.name}
                          >
                            {job.name}
                          </span>
                          <span className="text-xs font-medium text-indigo-600 mt-1">
                            {getClientLabel(job)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            <PrinterIcon className="w-3.5 h-3.5 text-slate-400" />{' '}
                            {getPrinterName(job.printerId)}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <div
                              className="w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0"
                              style={{
                                backgroundColor:
                                  (job.filament?.colorHex as string) || '#94a3b8',
                              }}
                            />
                            <span>
                              {job.filament?.materialName || job.brand || '—'} (
                              {job.weight * (job.qty || 1)}g)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">
                          {formatDateTime(job.date)}
                        </span>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          Duration: {formatDuration(job.timeH, job.timeM)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {formatCurrency(job.totalCost ?? 0)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(job.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicate(job.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Duplicate"
                          >
                            <CopyPlus className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDelete(job.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm font-medium text-slate-500"
                  >
                    No prints match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PrintJobDetailsModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onSaved={onSaved}
        settings={settings}
        printers={printers}
        filaments={filaments}
        operatorName={operatorName}
      />
    </div>
  );
}
