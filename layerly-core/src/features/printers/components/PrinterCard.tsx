'use client';

import {
  MapPin,
  Pencil,
  Printer,
  Trash2,
  Wrench,
  Zap,
  DollarSign,
  Wifi,
} from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { Printer as PrinterType } from '@/types';

export type PrinterStatus = 'available' | 'in_use' | 'maintenance';

export interface PrinterCardData extends Omit<PrinterType, 'material'> {
  status?: PrinterStatus;
  location?: string | null;
  lastMaintenance?: string | null;
  material?: { type?: string; color: string; name?: string; materialName?: string; id?: string } | null;
  ip?: string | null;
}

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PrinterStatus, {
  label: string;
  badge: string;
  dot: string;
  pulse: boolean;
  iconBg: string;
  iconText: string;
}> = {
  available: {
    label: 'Available',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    pulse: true,
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-500',
  },
  in_use: {
    label: 'In use',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    pulse: false,
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-500',
  },
  maintenance: {
    label: 'Maintenance',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    pulse: false,
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-500',
  },
};

const TYPE_CONFIG: Record<string, string> = {
  FDM: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  SLA: 'bg-purple-50 text-purple-600 border-purple-100',
  SLS: 'bg-amber-50 text-amber-600 border-amber-100',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PrinterStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
      <span className={`relative flex h-1.5 w-1.5`}>
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
      </span>
      {cfg.label}
    </span>
  );
}

interface PrinterCardProps {
  printer: PrinterCardData;
  onManage: (printer: PrinterCardData) => void;
  onDelete?: (id: string | number) => void;
}

// ─── PrinterCard ─────────────────────────────────────────────────────────────

export function PrinterCard({ printer, onManage, onDelete }: PrinterCardProps) {
  const status: PrinterStatus = printer.status ?? 'available';
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  const typeLabel = printer.type ?? 'FDM';
  const typeClass = TYPE_CONFIG[typeLabel] ?? 'bg-slate-50 text-slate-500 border-slate-100';
  const lastMaintenanceRaw = printer.lastMaintenance ?? printer.purchaseDate;
  const lastMaintenance = lastMaintenanceRaw ? formatDate(lastMaintenanceRaw) : null;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col group
      ${status === 'maintenance' ? 'border-amber-200' : 'border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50'}
    `}>

      {/* ── Header ── */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">

          {/* Icon + name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${cfg.iconBg} border-slate-100`}>
              <Printer className={`w-5 h-5 ${cfg.iconText}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 leading-tight truncate">{printer.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-500 font-medium truncate">{printer.model}</span>
                <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeClass}`}>
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Power */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Power</p>
              <p className="text-sm font-black text-slate-800">
                {printer.power ? `${printer.power} W` : '—'}
              </p>
            </div>
          </div>

          {/* Cost per hour */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cost/h</p>
              <p className="text-sm font-black text-slate-800">
                {printer.costPerHour ? `$${printer.costPerHour.toFixed(2)}` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Info rows ── */}
        <div className="space-y-2 mb-4">
          {printer.location && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium truncate">{printer.location}</span>
            </div>
          )}
          {lastMaintenance && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium">Last check: <span className="text-slate-700">{lastMaintenance}</span></span>
            </div>
          )}
          {printer.ip && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-xs text-slate-500">{printer.ip}</span>
            </div>
          )}
        </div>

        {/* ── Notes ── */}
        {printer.notes && (
          <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-500 italic leading-relaxed">
            &ldquo;{printer.notes}&rdquo;
          </div>
        )}

        {/* ── Loaded material ── */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loaded material</p>
          {printer.material ? (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700 leading-tight">{printer.material.type ?? printer.material.name}</p>
                {printer.material.name && printer.material.type && printer.material.name !== printer.material.type && (
                  <p className="text-[10px] text-slate-500">{printer.material.name}</p>
                )}
              </div>
              <div
                className="w-7 h-7 rounded-full border-2 border-white shadow-md ring-1 ring-slate-200"
                style={{ backgroundColor: printer.material.color }}
              />
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              No spool
            </span>
          )}
        </div>
      </div>

      {/* ── Footer: actions ── */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onManage(printer)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(printer.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
