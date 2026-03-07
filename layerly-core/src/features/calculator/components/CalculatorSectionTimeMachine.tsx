'use client';

import type { Printer } from '@/types';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Trash2 } from 'lucide-react';
import type { CalculatorState } from '../types';

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all';

interface CalculatorSectionTimeMachineProps {
  state: CalculatorState;
  printers: Printer[];
  onUpdate: <K extends keyof CalculatorState>(
    key: K,
    value: CalculatorState[K]
  ) => void;
  onSetPrinterPresetToCustom: () => void;
  onSetPrinterFromApi: (printer: Printer | null) => void;
  addLineItem: (type: 'hardware' | 'packaging') => void;
  removeLineItem: (type: 'hardware' | 'packaging', id: string) => void;
  updateLineItem: (
    type: 'hardware' | 'packaging',
    id: string,
    field: 'name' | 'price' | 'qty' | 'perUnit',
    value: string | number | boolean
  ) => void;
}

export function CalculatorSectionTimeMachine({
  state,
  onUpdate,
  addLineItem,
  removeLineItem,
  updateLineItem,
}: CalculatorSectionTimeMachineProps) {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            Print time (1 pc)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                value={state.printTimeHours}
                onChange={(e) =>
                  onUpdate('printTimeHours', Math.max(0, Number(e.target.value) || 0))
                }
                className={`${inputClass} pr-8`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                H
              </span>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                max={59}
                value={state.printTimeMinutes}
                onChange={(e) =>
                  onUpdate(
                    'printTimeMinutes',
                    Math.max(0, Math.min(59, Number(e.target.value) || 0))
                  )
                }
                className={`${inputClass} pr-10`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                MIN
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
              {state.laborCostMode === 'manual'
                ? 'Total labor cost'
                : 'Labor time / Rate'}
            </label>
            <button
              type="button"
              onClick={() =>
                onUpdate(
                  'laborCostMode',
                  state.laborCostMode === 'manual' ? 'calculated' : 'manual'
                )
              }
              className="text-xs text-indigo-600 font-bold hover:text-indigo-700 hover:underline"
            >
              Switch to {state.laborCostMode === 'manual' ? 'auto' : 'manual'}
            </button>
          </div>
          {state.laborCostMode === 'calculated' ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  value={state.laborTimeMinutes}
                  onChange={(e) =>
                    onUpdate(
                      'laborTimeMinutes',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className={`${inputClass} pr-10`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                  MIN
                </span>
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={state.laborHourlyRate}
                  onChange={(e) =>
                    onUpdate(
                      'laborHourlyRate',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className={`${inputClass} pr-12`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                  USD/h
                </span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                min={0}
                step={0.01}
                value={state.laborManualTotal}
                onChange={(e) =>
                  onUpdate('laborManualTotal', Number(e.target.value) || 0)
                }
                placeholder="e.g. 50.00"
                className={`${inputClass} pr-10`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold pointer-events-none">
                USD
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
          <p className="font-bold text-slate-700 mb-2 uppercase tracking-widest">Hardware and packaging</p>
          <ul className="space-y-1 list-disc list-inside text-slate-600">
            <li><strong>Name</strong> — item description (e.g. &quot;Box A4&quot;, &quot;M3 screws&quot;).</li>
            <li><strong>Per unit / Per batch</strong> — &quot;Per unit&quot;: cost × quantity in batch; &quot;Per batch&quot;: cost once per order.</li>
            <li><strong>Quantity</strong> — number of units (e.g. 1 box, 4 screws).</li>
            <li><strong>Price (USD)</strong> — price per unit (e.g. $5 per box, $0.50 per screw).</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => addLineItem('hardware')}
            className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-4 py-2 rounded-xl font-bold shadow-sm transition-all text-sm"
            title="e.g. screws, connectors"
          >
            + Hardware
          </button>
          <button
            type="button"
            onClick={() => addLineItem('packaging')}
            className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-4 py-2 rounded-xl font-bold shadow-sm transition-all text-sm"
            title="e.g. box, filler"
          >
            + Packaging
          </button>
        </div>
        {(state.hardware.length > 0 || state.packaging.length > 0) && (
          <div className="grid grid-cols-[2.5rem_1fr_8rem_4rem_5rem_2.5rem] gap-2 items-center px-0.5 mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span aria-hidden>Type</span>
            <span>Name</span>
            <span>Billing</span>
            <span className="text-center">Qty (pcs)</span>
            <span className="text-center">Price (USD)</span>
            <span className="w-8" aria-hidden />
          </div>
        )}
        <div className="space-y-2">
          {[...state.hardware, ...state.packaging].map((item) => {
            const isHardware = state.hardware.some((h) => h.id === item.id);
            const type = isHardware ? 'hardware' : 'packaging';
            const perUnit = item.perUnit ?? isHardware;
            return (
              <div
                key={item.id}
                className="grid grid-cols-[2.5rem_1fr_8rem_4rem_5rem_2.5rem] gap-2 items-center"
              >
                <span className="text-xs font-bold text-slate-500">
                  {isHardware ? 'HW' : 'PKG'}
                </span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    updateLineItem(type, item.id, 'name', e.target.value)
                  }
                  placeholder="Name (e.g. Box)"
                  aria-label="Item name"
                  className={`${inputClass} py-2.5 text-sm`}
                />
                <div className="min-w-[7.5rem]">
                  <CustomSelect
                    value={perUnit ? 'unit' : 'batch'}
                    onChange={(v) =>
                      updateLineItem(type, item.id, 'perUnit', v === 'unit')
                    }
                    options={[
                      { value: 'unit', label: 'Per unit' },
                      { value: 'batch', label: 'Per batch' },
                    ]}
                    placeholder="Per unit / batch"
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  value={item.qty}
                  onChange={(e) =>
                    updateLineItem(
                      type,
                      item.id,
                      'qty',
                      Number(e.target.value) || 0
                    )
                  }
                  aria-label="Quantity"
                  placeholder="pcs"
                  className={`${inputClass} py-2.5 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.price}
                  onChange={(e) =>
                    updateLineItem(
                      type,
                      item.id,
                      'price',
                      Number(e.target.value) || 0
                    )
                  }
                  aria-label="Price in USD"
                  placeholder="USD"
                  className={`${inputClass} py-2.5 text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
                <button
                  type="button"
                  onClick={() => removeLineItem(type, item.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
