'use client';

import { forwardRef, useEffect, useImperativeHandle } from 'react';
import type { Printer } from '@/types';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { CalculatorSectionProject } from './CalculatorSectionProject';
import { CalculatorSectionMaterials } from './CalculatorSectionMaterials';
import { CalculatorSectionTimeMachine } from './CalculatorSectionTimeMachine';
import { CalculatorSectionResults } from './CalculatorSectionResults';

export interface CalculatorViewHandle {
  /** Fills filament row with data from stock/catalog (called after selection in FilamentsModal). */
  setFilamentFromCatalog: (
    filamentRowId: string,
    data: { filamentId?: string; name: string; pricePerKg: number; brand?: string; color?: string }
  ) => void;
}

interface CalculatorViewProps {
  /** When this changes (e.g. after clicking Clear in Sidebar), the form is reset. */
  clearTrigger?: number;
  /** User printers from /api/printers. */
  printers?: Printer[];
  /** Opens stock/catalog modal for a given filament row. */
  onOpenFilamentCatalog?: (filamentRowId: string) => void;
}

export const CalculatorView = forwardRef<
  CalculatorViewHandle,
  CalculatorViewProps
>(function CalculatorView(
  { clearTrigger = 0, printers = [], onOpenFilamentCatalog },
  ref
) {
  const {
    state,
    updateField,
    removeFilament,
    updateFilament,
    setFilamentFromCatalog,
    addLineItem,
    removeLineItem,
    updateLineItem,
    setPrinterPresetToCustom,
    setPrinterFromApi,
    metrics,
    resetState,
  } = useCalculatorState();

  useImperativeHandle(ref, () => ({
    setFilamentFromCatalog,
  }), [setFilamentFromCatalog]);

  useEffect(() => {
    if (clearTrigger > 0) resetState();
  }, [clearTrigger, resetState]);

  return (
    <div className="p-6 space-y-8 pb-24">
      <CalculatorSectionProject state={state} onUpdate={updateField} />

      <CalculatorSectionMaterials
        state={state}
        onRemoveFilament={removeFilament}
        onUpdateFilament={updateFilament}
        onOpenFilamentCatalog={onOpenFilamentCatalog}
      />

      <CalculatorSectionTimeMachine
        state={state}
        printers={printers}
        onUpdate={updateField}
        addLineItem={addLineItem}
        removeLineItem={removeLineItem}
        updateLineItem={updateLineItem}
        onSetPrinterPresetToCustom={setPrinterPresetToCustom}
        onSetPrinterFromApi={setPrinterFromApi}
      />

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
  );
});
