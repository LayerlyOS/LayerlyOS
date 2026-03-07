import type { PrintEntry } from '@/types';
import {
  type CalculatorState,
  type CalculatorSnapshot,
  getInitialCalculatorState,
  generateId,
  CUSTOM_CONFIGURATION,
} from './types';

/**
 * Maps a print entry (from DB) to calculator form state. Uses calculatorSnapshot when present for full restore (filaments, HW/PKG, labor, machine, vat, margin).
 */
export function printEntryToCalculatorState(entry: PrintEntry): CalculatorState {
  const defaults = getInitialCalculatorState();

  const filamentName = [entry.brand, entry.filament?.materialName ?? '', entry.color]
    .filter(Boolean)
    .join(' ')
    .trim() || entry.name;

  const filament = entry.filament as
    | { spoolPrice?: number; spoolWeight?: number }
    | undefined;
  const pricePerKg =
    filament?.spoolWeight && filament.spoolWeight > 0 && typeof filament.spoolPrice === 'number'
      ? (filament.spoolPrice / filament.spoolWeight) * 1000
      : 0;

  const adv = entry.advancedSettings;
  const workingHoursPerYear = 365 * 24 * 0.5;
  const printerLifespanYearsFromHours =
    adv && typeof adv.lifespanHours === 'number' && adv.lifespanHours > 0
      ? adv.lifespanHours / workingHoursPerYear
      : defaults.printerLifespanYears;

  let customMargin = defaults.customMargin;
  const totalCost = entry.totalCost ?? 0;
  const price = entry.price ?? 0;
  if (totalCost > 0 && price > 0) {
    const raw = ((price - totalCost) / totalCost) * 100;
    customMargin = Math.round(Math.min(200, Math.max(0, raw)) * 10) / 10;
  }
  const customPricePerUnit =
    entry.manualPrice != null && Number(entry.manualPrice) > 0
      ? Number(entry.manualPrice)
      : null;

  const snap = entry.calculatorSnapshot as CalculatorSnapshot | null | undefined;
  if (snap && Array.isArray(snap.filaments) && snap.filaments.length > 0) {
    return {
      ...defaults,
      projectName: entry.name || defaults.projectName,
      filaments: snap.filaments.map((f) => ({ ...f })),
      hardware: Array.isArray(snap.hardware) ? snap.hardware.map((h) => ({ ...h })) : [],
      packaging: Array.isArray(snap.packaging) ? snap.packaging.map((p) => ({ ...p })) : [],
      printTimeHours: entry.timeH ?? 0,
      printTimeMinutes: entry.timeM ?? 0,
      laborCostMode: snap.laborCostMode ?? defaults.laborCostMode,
      laborHourlyRate: typeof snap.laborHourlyRate === 'number' ? snap.laborHourlyRate : defaults.laborHourlyRate,
      laborTimeMinutes: typeof snap.laborTimeMinutes === 'number' ? snap.laborTimeMinutes : defaults.laborTimeMinutes,
      laborManualTotal: typeof snap.laborManualTotal === 'number' ? snap.laborManualTotal : defaults.laborManualTotal,
      isBatch: (entry.qty ?? 1) > 1,
      batchSize: Math.max(1, entry.qty ?? 1),
      showAdvanced: defaults.showAdvanced,
      vatRate: typeof snap.vatRate === 'number' ? snap.vatRate : defaults.vatRate,
      materialRiskPercentage: typeof snap.materialRiskPercentage === 'number' ? snap.materialRiskPercentage : defaults.materialRiskPercentage,
      complexityMultiplier: typeof snap.complexityMultiplier === 'number' ? snap.complexityMultiplier : defaults.complexityMultiplier,
      selectedPrinterPreset: CUSTOM_CONFIGURATION,
      printerPrice: typeof snap.printerPrice === 'number' ? snap.printerPrice : (adv?.printerPrice ?? defaults.printerPrice),
      printerStartupCosts: typeof snap.printerStartupCosts === 'number' ? snap.printerStartupCosts : defaults.printerStartupCosts,
      printerLifespanYears: typeof snap.printerLifespanYears === 'number' ? snap.printerLifespanYears : Math.max(0.1, Math.round(printerLifespanYearsFromHours * 100) / 100),
      printerMaintenanceYearly: typeof snap.printerMaintenanceYearly === 'number' ? snap.printerMaintenanceYearly : defaults.printerMaintenanceYearly,
      uptimePercentage: typeof snap.uptimePercentage === 'number' ? snap.uptimePercentage : defaults.uptimePercentage,
      energyConsumptionWatts: typeof snap.energyConsumptionWatts === 'number' ? snap.energyConsumptionWatts : defaults.energyConsumptionWatts,
      energyPricePerKwh: typeof snap.energyPricePerKwh === 'number' ? snap.energyPricePerKwh : defaults.energyPricePerKwh,
      customMargin: Number.isFinite(snap.customMargin) ? snap.customMargin : customMargin,
      customPricePerUnit,
    };
  }

  return {
    ...defaults,
    projectName: entry.name || defaults.projectName,
    filaments: [
      {
        id: generateId(),
        name: filamentName,
        pricePerKg,
        weightGrams: entry.weight ?? 0,
        filamentId: entry.filamentId ?? undefined,
        brand: entry.brand ?? undefined,
        color: entry.color ?? undefined,
      },
    ],
    hardware: [],
    packaging: [],
    printTimeHours: entry.timeH ?? 0,
    printTimeMinutes: entry.timeM ?? 0,
    laborCostMode: defaults.laborCostMode,
    laborHourlyRate: adv && typeof adv.hourlyRate === 'number' ? adv.hourlyRate : defaults.laborHourlyRate,
    laborTimeMinutes: adv && typeof adv.postProcessingMinutes === 'number' ? adv.postProcessingMinutes : defaults.laborTimeMinutes,
    laborManualTotal: defaults.laborManualTotal,
    isBatch: (entry.qty ?? 1) > 1,
    batchSize: Math.max(1, entry.qty ?? 1),
    showAdvanced: defaults.showAdvanced,
    vatRate: defaults.vatRate,
    materialRiskPercentage: defaults.materialRiskPercentage,
    complexityMultiplier: defaults.complexityMultiplier,
    selectedPrinterPreset: CUSTOM_CONFIGURATION,
    printerPrice: adv && typeof adv.printerPrice === 'number' ? adv.printerPrice : defaults.printerPrice,
    printerStartupCosts: defaults.printerStartupCosts,
    printerLifespanYears: Math.max(0.1, Math.round(printerLifespanYearsFromHours * 100) / 100),
    printerMaintenanceYearly: defaults.printerMaintenanceYearly,
    uptimePercentage: defaults.uptimePercentage,
    energyConsumptionWatts: defaults.energyConsumptionWatts,
    energyPricePerKwh: defaults.energyPricePerKwh,
    customMargin: Number.isFinite(customMargin) ? customMargin : defaults.customMargin,
    customPricePerUnit,
  };
}
