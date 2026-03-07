'use client';

import { useId, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  Printer,
  MapPin,
  Wrench,
  Calendar,
  FileText,
  Zap,
  CreditCard,
  Box,
} from 'lucide-react';
import { formLabelClass, formInputClass, formTextareaClass } from '@/lib/form-classes';
import type { PrinterStatus, PrinterType } from '@/types';

export interface PrinterFormData {
  name: string;
  model: string;
  type: PrinterType;
  status: PrinterStatus;
  location: string;
  ipAddress: string;
  lastMaintenance: string;
  notes: string;
  currentMaterialId: string;
  power: number;
  costPerHour: string;
  purchaseDate: string;
}

const TYPE_OPTIONS: { value: PrinterType; label: string }[] = [
  { value: 'FDM', label: 'FDM' },
  { value: 'SLA', label: 'SLA' },
  { value: 'SLS', label: 'SLS' },
];

const STATUS_OPTIONS: { value: PrinterStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In use' },
  { value: 'maintenance', label: 'In maintenance' },
];

interface FilamentOption {
  id: string;
  materialName: string;
  materialType?: string | null;
  color: string;
  colorHex?: string | null;
}

interface PrinterFormProps {
  formData: PrinterFormData;
  setFormData: (data: PrinterFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSaving: boolean;
  isEditing: boolean;
}

export default function PrinterForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isSaving,
  isEditing,
}: PrinterFormProps) {
  const nameId = useId();
  const modelId = useId();
  const locationId = useId();
  const ipId = useId();
  const lastMaintId = useId();
  const notesId = useId();
  const powerId = useId();
  const costPerHourId = useId();
  const purchaseDateId = useId();

  const [filaments, setFilaments] = useState<FilamentOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/filaments?limit=500')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const list = Array.isArray(json) ? json : json?.data ?? [];
        if (!cancelled) {
          setFilaments(
            list.map((f: { id: string; materialName: string; materialType?: string | null; color: string; colorHex?: string | null }) => ({
              id: f.id,
              materialName: f.materialName,
              materialType: f.materialType,
              color: f.color,
              colorHex: f.colorHex,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const materialOptions = [
    { value: '', label: 'No spool' },
    ...filaments.map((f) => ({
      value: f.id,
      label: `${f.materialName} – ${f.color}`,
    })),
  ];

  const SectionHeader = ({
    icon: Icon,
    title,
  }: {
    icon: React.ElementType;
    title: string;
  }) => (
    <div className="flex items-center gap-2 pb-1.5 mb-3 border-b border-slate-100 text-slate-800">
      <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {title}
      </h4>
    </div>
  );

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-5">
        <section>
          <SectionHeader icon={Printer} title="Device identity" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={nameId} className={formLabelClass}>
                Printer name <span className="text-red-600">*</span>
              </label>
              <input
                id={nameId}
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Farm-1"
                className={formInputClass}
                required
              />
            </div>
            <div>
              <label htmlFor={modelId} className={formLabelClass}>
                Model
              </label>
              <input
                id={modelId}
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. Prusa MK4"
                className={formInputClass}
              />
            </div>
            <div>
              <CustomSelect
                id={`${nameId}-type`}
                label="Type"
                value={formData.type}
                onChange={(v) => setFormData({ ...formData, type: v as PrinterType })}
                options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                placeholder="Select type"
                icon={Box}
              />
            </div>
            <div>
              <CustomSelect
                id={`${nameId}-status`}
                label="Status"
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v as PrinterStatus })}
                options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                placeholder="Select status"
              />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={MapPin} title="Location & network" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={locationId} className={formLabelClass}>
                Location
              </label>
              <input
                id={locationId}
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Shelf A"
                className={formInputClass}
              />
            </div>
            <div>
              <label htmlFor={ipId} className={formLabelClass}>
                IP address
              </label>
              <input
                id={ipId}
                type="text"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="e.g. 192.168.1.100"
                className={formInputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={Wrench} title="Maintenance & loaded material" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={lastMaintId} className={formLabelClass}>
                Last maintenance
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id={lastMaintId}
                  type="date"
                  value={formData.lastMaintenance}
                  onChange={(e) =>
                    setFormData({ ...formData, lastMaintenance: e.target.value })
                  }
                  className={`${formInputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <CustomSelect
                id={`${nameId}-material`}
                label="Loaded material (spool)"
                value={formData.currentMaterialId}
                onChange={(v) => setFormData({ ...formData, currentMaterialId: v })}
                options={materialOptions}
                placeholder="No spool"
              />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={Zap} title="Power & economics" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={powerId} className={formLabelClass}>
                Power (W)
              </label>
              <input
                id={powerId}
                type="number"
                min={0}
                value={formData.power}
                onChange={(e) =>
                  setFormData({ ...formData, power: parseInt(e.target.value, 10) || 0 })
                }
                className={formInputClass}
              />
            </div>
            <div>
              <label htmlFor={costPerHourId} className={formLabelClass}>
                Additional cost per hour
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id={costPerHourId}
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPerHour}
                  onChange={(e) =>
                    setFormData({ ...formData, costPerHour: e.target.value })
                  }
                  placeholder="0.00"
                  className={`${formInputClass} pl-10`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                  / h
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Maintenance, depreciation, etc.</p>
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor={purchaseDateId} className={formLabelClass}>
              Purchase date
            </label>
            <div className="relative max-w-[200px]">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id={purchaseDateId}
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
                className={`${formInputClass} pl-10`}
              />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader icon={FileText} title="Notes" />
          <div>
            <label htmlFor={notesId} className={formLabelClass}>
              Notes
            </label>
            <textarea
              id={notesId}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Serial number, maintenance logs..."
              rows={2}
              className={formTextareaClass}
            />
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              isEditing ? 'Save changes' : 'Add printer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
