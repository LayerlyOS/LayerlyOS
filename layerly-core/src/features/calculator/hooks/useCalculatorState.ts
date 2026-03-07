'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Printer } from '@/types';
import { calculateMetrics } from '../calculations';
import {
  type CalculatorState,
  type FilamentEntry,
  type LineItem,
  getInitialCalculatorState,
  generateId,
  CUSTOM_CONFIGURATION,
} from '../types';

/**
 * @param initialState - Optional initial state (e.g. from printEntryToCalculatorState when editing print).
 * When passed asynchronously (e.g. after fetch), it will be applied once after load.
 */
export function useCalculatorState(initialState?: CalculatorState | null) {
  const [state, setState] = useState<CalculatorState>(
    () => initialState ?? getInitialCalculatorState()
  );
  const hasAppliedInitialRef = useRef(false);

  useEffect(() => {
    if (initialState != null && !hasAppliedInitialRef.current) {
      hasAppliedInitialRef.current = true;
      setState(initialState);
    }
  }, [initialState]);

  const updateField = useCallback(
    <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addFilament = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filaments: [
        ...prev.filaments,
        {
          id: generateId(),
          name: '',
          pricePerKg: 0,
          weightGrams: 0,
        },
      ],
    }));
  }, []);

  const removeFilament = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      filaments: prev.filaments.filter((f) => f.id !== id),
    }));
  }, []);

  const updateFilament = useCallback(
    (
      id: string,
      field: keyof FilamentEntry,
      value: string | number
    ) => {
      setState((prev) => ({
        ...prev,
        filaments: prev.filaments.map((f) =>
          f.id === id ? { ...f, [field]: value } : f
        ),
      }));
    },
    []
  );

  /** Fills filament row with warehouse/catalog data (filament id from warehouse, name, pricePerKg, brand, color). Resets usage. */
  const setFilamentFromCatalog = useCallback(
    (
      filamentRowId: string,
      data: { filamentId?: string; name: string; pricePerKg: number; brand?: string; color?: string }
    ) => {
      setState((prev) => ({
        ...prev,
        filaments: prev.filaments.map((f) =>
          f.id === filamentRowId
            ? { ...f, filamentId: data.filamentId, name: data.name, pricePerKg: data.pricePerKg, brand: data.brand, color: data.color, weightGrams: 0 }
            : f
        ),
      }));
    },
    []
  );

  const addLineItem = useCallback((type: 'hardware' | 'packaging') => {
    const item: LineItem = {
      id: generateId(),
      name: 'Element',
      price: 0,
      qty: 1,
      perUnit: type === 'hardware',
    };
    setState((prev) => ({
      ...prev,
      [type]: [...prev[type], item],
    }));
  }, []);

  const removeLineItem = useCallback(
    (type: 'hardware' | 'packaging', id: string) => {
      setState((prev) => ({
        ...prev,
        [type]: prev[type].filter((i) => i.id !== id),
      }));
    },
    []
  );

  const updateLineItem = useCallback(
    (
      type: 'hardware' | 'packaging',
      id: string,
      field: keyof LineItem,
      value: string | number | boolean
    ) => {
      setState((prev) => ({
        ...prev,
        [type]: prev[type].map((i) =>
          i.id === id ? { ...i, [field]: value } : i
        ),
      }));
    },
    []
  );

  /** Sets "Custom config" (manual machine parameters). */
  const setPrinterPresetToCustom = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedPrinterPreset: CUSTOM_CONFIGURATION,
    }));
  }, []);

  /** Fills machine parameters from printer selected from DB (/api/printers). */
  const setPrinterFromApi = useCallback((printer: Printer | null) => {
    if (!printer) {
      setState((prev) => ({
        ...prev,
        selectedPrinterPreset: CUSTOM_CONFIGURATION,
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      selectedPrinterPreset: printer.name,
      energyConsumptionWatts: printer.power ?? prev.energyConsumptionWatts,
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(getInitialCalculatorState());
  }, []);

  const metrics = useMemo(() => calculateMetrics(state), [state]);

  return {
    state,
    setState,
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
    resetState,
  };
}
