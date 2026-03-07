'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Calculator,
  Layers,
  Clock,
  Package,
  Plus,
  Loader2,
} from 'lucide-react';
import type { Printer } from '@/types';
import { useCalculatorState } from '@/features/calculator/hooks/useCalculatorState';
import { printEntryToCalculatorState } from '@/features/calculator/adapter';
import { CUSTOM_CONFIGURATION, stateToCalculatorSnapshot, splitFilamentDisplayName } from '@/features/calculator/types';
import { CalculatorSectionProject } from '@/features/calculator/components/CalculatorSectionProject';
import { CalculatorSectionMaterials } from '@/features/calculator/components/CalculatorSectionMaterials';
import { CalculatorSectionTimeMachine } from '@/features/calculator/components/CalculatorSectionTimeMachine';
import { CalculatorSectionResults } from '@/features/calculator/components/CalculatorSectionResults';
import { PageHeader } from '@/components/ui/PageHeader';
import { FullPageLoader } from '@/components/ui/DataLoader';
import { useSession } from '@/hooks/useSession';
import type { PrintEntry } from '@/types';

const FilamentsModal = dynamic(
  () => import('@/features/filaments/components/FilamentsModal'),
  { ssr: false }
);

export default function CalculatorPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { data: session } = useSession();
  const operatorName = (session?.user as { name?: string } | undefined)?.name ?? undefined;

  const [resolvedInitialState, setResolvedInitialState] = useState<
    ReturnType<typeof printEntryToCalculatorState> | null
  >(null);
  const [editLoading, setEditLoading] = useState(!!editId);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [showFilamentModal, setShowFilamentModal] = useState(false);
  const [pendingFilamentRowId, setPendingFilamentRowId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const router = useRouter();

  const {
    state,
    updateField,
    addFilament,
    removeFilament,
    updateFilament,
    setFilamentFromCatalog,
    addLineItem,
    removeLineItem,
    updateLineItem,
    setPrinterPresetToCustom,
    setPrinterFromApi,
    metrics,
  } = useCalculatorState(resolvedInitialState ?? undefined);

  useEffect(() => {
    if (!editId) {
      setEditLoading(false);
      return;
    }
    let cancelled = false;
    setEditLoading(true);
    fetch(`/api/prints/${editId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PrintEntry | null) => {
        if (cancelled || !data) return;
        setResolvedInitialState(printEntryToCalculatorState(data));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const fetchPrinters = useCallback(async () => {
    try {
      const res = await fetch('/api/printers');
      if (res.ok) {
        const data = await res.json();
        setPrinters(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching printers:', e);
    }
  }, []);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  const handleOpenFilamentCatalog = useCallback((filamentRowId: string) => {
    setPendingFilamentRowId(filamentRowId);
    setShowFilamentModal(true);
  }, []);

  const handleFilamentSelected = useCallback(
    (
      filament: { id?: string; brand?: string; materialName?: string; color?: string; spoolPrice?: number; spoolWeight?: number },
      context?: { fromWarehouse?: boolean }
    ) => {
      if (pendingFilamentRowId) {
        const name = [filament.brand, filament.materialName, filament.color]
          .filter(Boolean)
          .join(' ');
        const pricePerKg =
          filament.spoolWeight && filament.spoolWeight > 0 && typeof filament.spoolPrice === 'number'
            ? (filament.spoolPrice / filament.spoolWeight) * 1000
            : 0;
        const brand = filament.brand ? [filament.brand, filament.materialName].filter(Boolean).join(' ') : undefined;
        const color = filament.color ?? undefined;
        const filamentId = context?.fromWarehouse && filament.id ? filament.id : undefined;
        setFilamentFromCatalog(pendingFilamentRowId, { filamentId, name, pricePerKg, brand, color });
      }
      setShowFilamentModal(false);
      setPendingFilamentRowId(null);
    },
    [pendingFilamentRowId, setFilamentFromCatalog]
  );

  const qty = state.isBatch ? state.batchSize : 1;
  const pricePerUnit =
    state.customPricePerUnit != null && state.customPricePerUnit > 0
      ? state.customPricePerUnit
      : metrics.prices.custom.gross / (qty > 0 ? qty : 1);
  const profit = metrics.prices.custom.net - metrics.totalCostNetto;

  const handleSavePrint = useCallback(async () => {
    setSaveLoading(true);
    try {
      const weight = state.filaments[0]?.weightGrams ?? 0;
      const manualPrice =
        state.customPricePerUnit != null && state.customPricePerUnit > 0
          ? state.customPricePerUnit
          : null;
      const calculatorSnapshot = stateToCalculatorSnapshot(state);
      const first = state.filaments[0];
      const saveBrand = (first?.brand ?? (first?.name ? splitFilamentDisplayName(first.name).brand : null)) || null;
      const saveColor = (first?.color ?? (first?.name ? splitFilamentDisplayName(first.name).color : null)) ?? null;
      const selectedPrinterId =
        state.selectedPrinterPreset === CUSTOM_CONFIGURATION
          ? undefined
          : printers.find((p) => p.name === state.selectedPrinterPreset)?.id ?? undefined;
      if (editId) {
        const body = {
          printerId: selectedPrinterId ?? null,
          name: state.projectName,
          filamentId: first?.filamentId ?? null,
          brand: saveBrand || null,
          color: saveColor,
          weight,
          timeH: state.printTimeHours,
          timeM: state.printTimeMinutes,
          qty,
          price: pricePerUnit,
          profit,
          totalCost: metrics.totalCostNetto,
          manualPrice,
          calculatorSnapshot,
          operatorName,
        };
        const res = await fetch(`/api/prints/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          router.push('/dashboard');
          return;
        }
      } else {
        const body = {
          printerId: selectedPrinterId ?? undefined,
          filamentId: first?.filamentId ?? null,
          orderId: null,
          name: state.projectName,
          brand: saveBrand || null,
          color: saveColor,
          weight,
          timeH: state.printTimeHours,
          timeM: state.printTimeMinutes,
          qty,
          price: pricePerUnit,
          profit,
          totalCost: metrics.totalCostNetto,
          manualPrice,
          calculatorSnapshot,
          operatorName,
        };
        const res = await fetch('/api/prints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          router.push('/dashboard');
          return;
        }
      }
    } catch (e) {
      console.error('Save print failed', e);
    } finally {
      setSaveLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router/state intentionally omitted to avoid callback churn
  }, [
    editId,
    state.projectName,
    state.filaments,
    state.printTimeHours,
    state.printTimeMinutes,
    state.isBatch,
    state.batchSize,
    state.customPricePerUnit,
    metrics.totalCostNetto,
    metrics.prices.custom.net,
    qty,
    pricePerUnit,
    profit,
    printers,
    state.selectedPrinterPreset,
  ]);

  if (editLoading) {
    return <FullPageLoader message="Loading…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculator"
        subtitle="Cost & pricing"
        icon={<Calculator className="w-6 h-6" />}
        actions={
          <button
            type="button"
            onClick={handleSavePrint}
            disabled={saveLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
          >
            {saveLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {saveLoading ? 'Saving…' : editId ? 'Save print' : 'Add to history'}
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left column */}
        <div className="xl:col-span-7 space-y-5">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Project</p>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Project details
            </h2>
            <CalculatorSectionProject state={state} onUpdate={updateField} />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Materials</p>
                <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Filaments
                </h3>
              </div>
              <button
                type="button"
                onClick={addFilament}
                className="bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 px-4 py-2 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <CalculatorSectionMaterials
              state={state}
              onRemoveFilament={removeFilament}
              onUpdateFilament={updateFilament}
              onOpenFilamentCatalog={handleOpenFilamentCatalog}
            />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Labour</p>
            <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              Time & labour
            </h3>
            <CalculatorSectionTimeMachine
              state={state}
              printers={printers}
              onUpdate={updateField}
              onSetPrinterPresetToCustom={setPrinterPresetToCustom}
              onSetPrinterFromApi={setPrinterFromApi}
              addLineItem={addLineItem}
              removeLineItem={removeLineItem}
              updateLineItem={updateLineItem}
            />
          </div>

          {/* Batch production – indigo card, single row when enabled */}
          <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-200 transition-all">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-100 shrink-0" />
                <span className="font-bold">Batch production</span>
              </div>
              {state.isBatch && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-indigo-100 uppercase tracking-widest whitespace-nowrap">
                    Quantity in batch
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={state.batchSize}
                    onChange={(e) =>
                      updateField('batchSize', Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-20 bg-white text-slate-900 font-bold rounded-xl px-3 py-2.5 text-center text-sm outline-none focus:ring-4 focus:ring-white/30 border-0"
                    aria-label="Quantity in batch"
                  />
                </div>
              )}
              <label className="relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={state.isBatch}
                  onChange={() => updateField('isBatch', !state.isBatch)}
                  aria-checked={state.isBatch}
                />
                <div className="absolute inset-0 bg-indigo-800 rounded-full peer-checked:bg-white transition-colors duration-300 shadow-inner" />
                <div className="absolute left-[2px] w-5 h-5 bg-indigo-400 rounded-full shadow border border-indigo-300 transition-transform duration-300 peer-checked:translate-x-5 peer-checked:bg-indigo-600 peer-checked:border-indigo-500" />
              </label>
            </div>
          </div>

          {/* Advanced settings */}
          <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
            <CalculatorSectionProject
              state={state}
              onUpdate={updateField}
              advancedOnly
              printers={printers}
              onSetPrinterPresetToCustom={setPrinterPresetToCustom}
              onSetPrinterFromApi={setPrinterFromApi}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="xl:col-span-5 space-y-6 xl:sticky xl:top-6">
          <CalculatorSectionResults
                metrics={metrics}
                customMargin={state.customMargin}
                onCustomMarginChange={(v) => updateField('customMargin', v)}
                customPricePerUnit={state.customPricePerUnit}
                onCustomPricePerUnitChange={(v) => updateField('customPricePerUnit', v)}
                projectName={state.projectName}
                isBatch={state.isBatch}
                batchSize={state.batchSize}
                vatRate={state.vatRate}
                filamentsSummary={state.filaments.map((f) => f.name).join(', ')}
              />
        </div>
      </div>

      <FilamentsModal
        isOpen={showFilamentModal}
        onClose={() => {
          setShowFilamentModal(false);
          setPendingFilamentRowId(null);
        }}
        onFilamentSelected={handleFilamentSelected}
        showSelectButton={true}
      />
    </div>
  );
}
