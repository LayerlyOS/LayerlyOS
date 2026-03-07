'use client';

import { Trash2 } from 'lucide-react';
import type { CalculatorState, FilamentEntry } from '../types';

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all';

interface CalculatorSectionMaterialsProps {
  state: CalculatorState;
  onRemoveFilament: (id: string) => void;
  onUpdateFilament: (
    id: string,
    field: keyof FilamentEntry,
    value: string | number
  ) => void;
  onOpenFilamentCatalog?: (filamentRowId: string) => void;
}

export function CalculatorSectionMaterials({
  state,
  onRemoveFilament,
  onUpdateFilament,
  onOpenFilamentCatalog,
}: CalculatorSectionMaterialsProps) {
  const totalGrams = state.filaments.reduce(
    (s, f) => s + (Number(f.weightGrams) || 0),
    0
  );

  return (
    <section className="space-y-4">
      {state.filaments.length > 0 && (
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Total batch weight: {totalGrams.toFixed(2)}g
        </p>
      )}
      <div className="space-y-4">
        {state.filaments.map((f) => (
          <div
            key={f.id}
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative group"
          >
            {onOpenFilamentCatalog && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => onOpenFilamentCatalog(f.id)}
                  className="w-full text-left bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  From stock / catalog
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-10 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Material
                </label>
                <input
                  value={f.name}
                  onChange={(e) => onUpdateFilament(f.id, 'name', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Price / kg
                </label>
                <input
                  type="number"
                  min={0}
                  value={f.pricePerKg}
                  onChange={(e) =>
                    onUpdateFilament(f.id, 'pricePerKg', Number(e.target.value) || 0)
                  }
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Weight (g)
                </label>
                <input
                  type="number"
                  min={0}
                  value={f.weightGrams}
                  onChange={(e) =>
                    onUpdateFilament(f.id, 'weightGrams', Number(e.target.value) || 0)
                  }
                  className={inputClass}
                />
              </div>
            </div>
            {state.filaments.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveFilament(f.id)}
                className="absolute -top-2 -right-2 bg-white text-red-600 p-2 rounded-full shadow border border-slate-200 hover:bg-red-50 transition-opacity opacity-0 group-hover:opacity-100"
                title="Remove filament"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
