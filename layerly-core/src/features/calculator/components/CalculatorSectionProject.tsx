'use client';

import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomSlider } from '@/components/ui/CustomSlider';
import { formInputClass, formLabelClass } from '@/lib/form-classes';
import type { Printer } from '@/types';
import { CUSTOM_CONFIGURATION } from '../types';
import type { CalculatorState } from '../types';

interface CalculatorSectionProjectProps {
  state: CalculatorState;
  onUpdate: <K extends keyof CalculatorState>(
    key: K,
    value: CalculatorState[K]
  ) => void;
  /** Advanced settings block only (used on a separate card). */
  advancedOnly?: boolean;
  printers?: Printer[];
  onSetPrinterPresetToCustom?: () => void;
  onSetPrinterFromApi?: (printer: Printer | null) => void;
}

const CUSTOM_PRINTER_VALUE = '__custom__';

export function CalculatorSectionProject({
  state,
  onUpdate,
  advancedOnly = false,
  printers = [],
  onSetPrinterPresetToCustom,
  onSetPrinterFromApi,
}: CalculatorSectionProjectProps) {
  const selectedPrinterId =
    state.selectedPrinterPreset === CUSTOM_CONFIGURATION
      ? CUSTOM_PRINTER_VALUE
      : printers.find((p) => p.name === state.selectedPrinterPreset)?.id ?? CUSTOM_PRINTER_VALUE;

  if (advancedOnly) {
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
        <button
          type="button"
          onClick={() => onUpdate('showAdvanced', !state.showAdvanced)}
          className={`w-full p-4 flex justify-between items-center text-slate-700 font-bold hover:bg-slate-100 transition outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset ${
            state.showAdvanced ? 'rounded-t-xl' : 'rounded-xl'
          }`}
        >
          <span className="flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4 text-indigo-600" />
            Advanced settings
          </span>
          {state.showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        {state.showAdvanced && (
          <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-2">
            {/* BUSINESS — full width, at top */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 w-full">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Business
              </p>
              <CustomSlider
                label="VAT (%)"
                value={Math.min(100, Math.max(0, state.vatRate))}
                onChange={(v) => onUpdate('vatRate', Math.max(0, Math.min(100, v)))}
                min={0}
                max={100}
                step={1}
                valueSuffix="%"
              />
              <CustomSlider
                label="Risk (waste %)"
                value={Math.min(50, Math.max(0, state.materialRiskPercentage))}
                onChange={(v) =>
                  onUpdate('materialRiskPercentage', Math.max(0, Math.min(50, v)))
                }
                min={0}
                max={50}
                step={1}
                valueSuffix="%"
                helperText="Extra material for failed prints."
              />
              <CustomSlider
                label="Complexity factor"
                value={Math.min(3, Math.max(0.1, state.complexityMultiplier))}
                onChange={(v) =>
                  onUpdate(
                    'complexityMultiplier',
                    Math.max(0.1, Math.min(3, Math.round(v * 10) / 10))
                  )
                }
                min={0.1}
                max={3}
                step={0.1}
                helperText="1 = standard, higher = more time/margin."
              />
            </div>

            {/* MACHINE — full width, below Business */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 w-full">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Machine
              </p>

              {printers.length > 0 && onSetPrinterPresetToCustom && onSetPrinterFromApi && (
                <div>
                  <label className={formLabelClass}>Printer preset</label>
                  <CustomSelect
                    value={selectedPrinterId}
                    onChange={(v) => {
                      if (v === CUSTOM_PRINTER_VALUE) {
                        onSetPrinterPresetToCustom();
                      } else {
                        const p = printers.find((pr) => pr.id === v);
                        onSetPrinterFromApi(p ?? null);
                      }
                    }}
                    options={[
                      { value: CUSTOM_PRINTER_VALUE, label: CUSTOM_CONFIGURATION },
                      ...printers.map((p) => ({
                        value: p.id,
                        label: [p.name, p.model].filter(Boolean).join(' — '),
                      })),
                    ]}
                    placeholder="Select printer..."
                  />
                </div>
              )}

              <div>
                <label className={formLabelClass}>Printer cost</label>
                <input
                  type="number"
                  min={0}
                  value={state.printerPrice}
                  onChange={(e) =>
                    onUpdate('printerPrice', Math.max(0, Number(e.target.value) || 0))
                  }
                  className={formInputClass}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <label className={formLabelClass}>Startup costs</label>
                <input
                  type="number"
                  min={0}
                  value={state.printerStartupCosts}
                  onChange={(e) =>
                    onUpdate(
                      'printerStartupCosts',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3.5 font-medium text-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className={formLabelClass}>Maintenance (per year)</label>
                <input
                  type="number"
                  min={0}
                  value={state.printerMaintenanceYearly}
                  onChange={(e) =>
                    onUpdate(
                      'printerMaintenanceYearly',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className={formInputClass}
                />
              </div>

              <CustomSlider
                label="Uptime (%)"
                value={Math.min(100, Math.max(0, state.uptimePercentage))}
                onChange={(v) =>
                  onUpdate('uptimePercentage', Math.max(0, Math.min(100, v)))
                }
                min={0}
                max={100}
                step={5}
                valueSuffix="%"
                helperText="Share of time the printer is available."
              />

              <div>
                <label className={formLabelClass}>Lifespan (years)</label>
                <input
                  type="number"
                  min={0}
                  value={state.printerLifespanYears}
                  onChange={(e) =>
                    onUpdate(
                      'printerLifespanYears',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className={formInputClass}
                />
              </div>

              <div>
                <label className={formLabelClass}>Power (W)</label>
                <input
                  type="number"
                  min={0}
                  value={state.energyConsumptionWatts}
                  onChange={(e) =>
                    onUpdate(
                      'energyConsumptionWatts',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className={formInputClass}
                />
              </div>

              <div>
                <label className={formLabelClass}>Energy price (USD/kWh)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={state.energyPricePerKwh}
                  onChange={(e) =>
                    onUpdate(
                      'energyPricePerKwh',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className={formInputClass}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={state.projectName}
      onChange={(e) => onUpdate('projectName', e.target.value)}
      placeholder="Project name..."
      className={formInputClass}
    />
  );
}
