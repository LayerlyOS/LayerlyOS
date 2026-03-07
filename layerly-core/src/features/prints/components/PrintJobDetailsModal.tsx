'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Printer,
  X,
  XCircle,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getBreakdown, formatMoney } from '@/features/prints/utils';
import type { CalculatorSnapshot } from '@/features/calculator/types';
import type { PrintEntry, Printer as PrinterType, Settings } from '@/types';

interface PrintJobDetailsModalProps {
  job: PrintEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  settings: Settings;
  printers: PrinterType[];
  filaments: {
    id: string;
    materialName?: string;
    brand: string;
    color: string;
    colorHex?: string | null;
    spoolPrice?: number;
    spoolWeight?: number;
  }[];
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

type JobStatus = 'success' | 'failed' | 'canceled';

function StatusPill({ status }: { status: JobStatus }) {
  const map = {
    success: {
      label: 'Completed',
      cls: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    failed: {
      label: 'Failed',
      cls: 'bg-red-500/10 text-red-600 ring-red-500/20',
      dot: 'bg-red-500',
    },
    canceled: {
      label: 'Canceled',
      cls: 'bg-slate-400/10 text-slate-500 ring-slate-400/20',
      dot: 'bg-slate-400',
    },
  };
  const cfg = map[status] ?? map.canceled;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function EditableField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
      {children}
    </p>
  );
}

function CostLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-2.5 ${!accent ? 'border-b border-slate-100' : ''}`}>
      <span className={`text-sm ${accent ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
        {label}
      </span>
      <span className={`font-bold tabular-nums ${accent ? 'text-lg text-indigo-600' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}

export function PrintJobDetailsModal({
  job,
  isOpen,
  onClose,
  onSaved,
  settings,
  printers,
  filaments,
  operatorName: operatorNameFallback = '—',
}: PrintJobDetailsModalProps) {
  const [notes, setNotes] = useState('');
  const [errorReason, setErrorReason] = useState('');
  const [operatorNameLocal, setOperatorNameLocal] = useState('');
  const [statusLocal, setStatusLocal] = useState<JobStatus>('success');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) {
      setNotes(job.notes ?? '');
      setErrorReason(job.errorReason ?? '');
      setOperatorNameLocal(job.operatorName ?? operatorNameFallback ?? '');
      setStatusLocal(
        job.status === 'failed' || job.status === 'canceled' ? job.status : 'success'
      );
    }
  }, [job, operatorNameFallback]);

  if (!isOpen || !job) return null;

  const breakdown = getBreakdown(job, settings, printers, filaments);
  const printer = printers.find((p) => String(p.id) === String(job.printerId));
  const clientLabel = job.orderCustomerName || job.orderTitle || 'Own';
  const snapshot = job.calculatorSnapshot as CalculatorSnapshot | null | undefined;
  const filamentColor = (job.filament?.colorHex as string) || '#94a3b8';
  const filamentName = job.filament?.materialName ?? job.brand ?? '—';
  const filamentBrand = job.filament?.brand ?? job.brand ?? '—';
  const filamentColorName = job.filament?.color ?? job.color ?? '—';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/prints/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: operatorNameLocal.trim() || null,
          status: statusLocal,
          notes: notes.trim() || null,
          errorReason: errorReason.trim() || null,
        }),
      });
      if (res.ok) {
        onSaved?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80">

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-7 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-0.5">
                <h2 className="text-base font-bold text-slate-900 leading-none">
                  Job #{String(job.id)}
                </h2>
                <StatusPill status={statusLocal} />
              </div>
              <p className="text-xs text-slate-400 font-mono truncate max-w-xs" title={job.name}>
                {job.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Error banner — only when status is failed/canceled AND reason exists */}
          {errorReason.trim() && statusLocal !== 'success' && (
            <div className={`mx-7 mt-5 rounded-xl border px-5 py-4 flex gap-3 items-start ${statusLocal === 'failed'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">
                  {statusLocal === 'failed' ? 'Failure reason' : 'Cancellation reason'}
                </p>
                <p className="text-sm leading-relaxed">{errorReason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

            {/* ── LEFT: read-only job data ── */}
            <div className="lg:col-span-3 px-7 py-6 space-y-7">

              {/* Job metadata */}
              <div>
                <SectionLabel>Job details</SectionLabel>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                  <ReadOnlyField label="Client" value={clientLabel} />
                  <ReadOnlyField label="Started" value={formatDateTime(job.date)} />
                  <ReadOnlyField
                    label="Machine"
                    value={printer ? `${printer.name} [${printer.type ?? 'FDM'}]` : '—'}
                  />
                  <ReadOnlyField label="Batch size" value={`${job.qty || 1}×`} />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Print time */}
              <div>
                <SectionLabel>Print time</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
                    <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                      Actual
                    </p>
                    <p className="text-2xl font-black text-indigo-700 tracking-tight">
                      {formatDuration(job.timeH, job.timeM)}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Estimated
                    </p>
                    <p className="text-2xl font-black text-slate-700 tracking-tight">
                      {breakdown.totalHours.toFixed(1)}
                      <span className="text-base font-semibold ml-1">h</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Material */}
              <div>
                <SectionLabel>Material</SectionLabel>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md shrink-0"
                    style={{ backgroundColor: filamentColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      {filamentName}{' '}
                      <span className="font-normal text-slate-400">· {filamentBrand}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{filamentColorName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Weight
                    </p>
                    <p className="text-lg font-black text-slate-800">
                      {job.weight * (job.qty || 1)}
                      <span className="text-sm font-semibold ml-0.5">g</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Costs */}
              <div>
                <SectionLabel>Cost breakdown</SectionLabel>
                <CostLine
                  label="Material cost"
                  value={breakdown.materialCostTotal != null ? formatMoney(breakdown.materialCostTotal) : '—'}
                />
                <CostLine
                  label="Electricity cost"
                  value={formatMoney(breakdown.energyCostTotal)}
                />
                <div className="pt-2">
                  <CostLine label="Total base cost" value={formatMoney(job.totalCost)} accent />
                </div>
              </div>
            </div>

            {/* ── RIGHT: editable fields ── */}
            <div className="lg:col-span-2 px-6 py-6 bg-slate-50/40 space-y-6">

              <div>
                <SectionLabel>Edit job</SectionLabel>
                <div className="space-y-4">
                  <EditableField label="Operator">
                    <Input
                      value={operatorNameLocal}
                      onChange={(e) => setOperatorNameLocal(e.target.value)}
                      placeholder="e.g. Jan Kowalski"
                      className="w-full bg-white border-slate-200 rounded-xl text-sm"
                    />
                  </EditableField>
                  <EditableField label="Status">
                    <CustomSelect
                      value={statusLocal}
                      onChange={(v) => setStatusLocal(v as JobStatus)}
                      options={[
                        { value: 'success', label: 'Completed' },
                        { value: 'failed', label: 'Failed' },
                        { value: 'canceled', label: 'Canceled' },
                      ]}
                      className="w-full"
                    />
                  </EditableField>
                  <EditableField label="Error / cancellation reason">
                    <Textarea
                      value={errorReason}
                      onChange={(e) => setErrorReason(e.target.value)}
                      placeholder="e.g. Warping, wrong G-code, stopped manually…"
                      rows={3}
                      className="w-full bg-white border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </EditableField>
                  <EditableField label="Operator notes">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes about this print…"
                      rows={4}
                      className="w-full bg-white border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </EditableField>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              {/* Slicer / snapshot data */}
              <div>
                <SectionLabel>Slicer data</SectionLabel>
                <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm space-y-3">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Device</p>
                    <p className="text-emerald-400 font-semibold">{printer?.name ?? '—'}</p>
                    <p className="text-slate-500 text-xs">[{printer?.type ?? 'FDM'}]</p>
                  </div>
                  {snapshot?.filaments?.length != null && snapshot.filaments.length > 0 && (
                    <>
                      <div className="h-px bg-slate-700" />
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                          Filaments
                        </p>
                        <p className="text-indigo-400 break-words leading-relaxed">
                          {snapshot.filaments
                            .map((f) => f.name || f.brand || '—')
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="shrink-0 px-7 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="Not available"
            className="opacity-50 cursor-not-allowed text-slate-400 border-slate-200"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Download G-Code
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 flex items-center gap-2 min-w-[140px] justify-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}