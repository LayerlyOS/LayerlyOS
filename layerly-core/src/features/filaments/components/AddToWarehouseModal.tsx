'use client';

import { Loader2, Package } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';

const UIKIT_INPUT_CLASS =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all';

export interface GlobalFilamentForAdd {
  id: string;
  materialName: string;
  brand: string;
  color: string;
  colorHex?: string | null;
  spoolWeight?: number | null;
  density?: number | null;
  materialType?: string | null;
  printTempMin?: number | null;
  printTempMax?: number | null;
  bedTemp?: number | null;
}

interface AddToWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  filament: GlobalFilamentForAdd | null;
  onAdded: () => void;
}

export function AddToWarehouseModal({
  isOpen,
  onClose,
  filament,
  onAdded,
}: AddToWarehouseModalProps) {
  const { success, error: showError } = useToast();
  const [spoolPrice, setSpoolPrice] = useState('');
  const [spoolWeight, setSpoolWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setSpoolPrice('');
    setSpoolWeight('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filament) return;

    const priceNum = parseFloat(spoolPrice.replace(',', '.'));
    const weightVal = spoolWeight.trim();
    const weightNum = weightVal ? parseFloat(weightVal.replace(',', '.')) : (filament.spoolWeight ?? 1000);

    if (Number.isNaN(priceNum) || priceNum < 0) {
      showError('Enter a valid price');
      return;
    }
    if (weightNum <= 0) {
      showError('Spool weight must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/filaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialName: filament.materialName,
          brand: filament.brand,
          color: filament.color,
          colorHex: filament.colorHex?.split(',')[0] || undefined,
          spoolPrice: priceNum,
          spoolWeight: weightNum,
          density: filament.density ?? undefined,
          materialType: filament.materialType ?? undefined,
        }),
      });

      if (res.ok) {
        success('Added to warehouse');
        handleClose();
        onAdded();
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || 'Failed to add');
      }
    } catch {
      showError('Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!filament) return null;

  const defaultWeight = (filament.spoolWeight ?? 1000).toString();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add to warehouse"
      icon={<Package className="w-5 h-5" />}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-to-warehouse-form"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding…
              </>
            ) : (
              'Add to warehouse'
            )}
          </button>
        </>
      }
    >
      <form id="add-to-warehouse-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="font-bold text-slate-900">{filament.brand} – {filament.materialName}</p>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            <span
              className="w-3 h-3 rounded-full border border-slate-300"
              style={{ backgroundColor: filament.colorHex?.split(',')[0] || '#94a3b8' }}
            />
            {filament.color}
            {filament.materialType && (
              <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded">
                {filament.materialType}
              </span>
            )}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            Purchase price <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 85.00"
            value={spoolPrice}
            onChange={(e) => setSpoolPrice(e.target.value)}
            required
            className={UIKIT_INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            Spool weight (g)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder={`Default: ${defaultWeight}`}
            value={spoolWeight}
            onChange={(e) => setSpoolWeight(e.target.value)}
            className={UIKIT_INPUT_CLASS}
          />
        </div>
      </form>
    </Modal>
  );
}
