// --- Types (Layerly Calculator spec) ---

export interface FilamentEntry {
  id: string;
  name: string;
  pricePerKg: number;
  weightGrams: number;
  /** Warehouse filament id when selected from catalog; sent to API so stock is updated correctly. */
  filamentId?: string;
  /** From warehouse/catalog selection; used when saving print for brand/color. */
  brand?: string;
  color?: string;
}

export interface LineItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  /** true = cost per piece (× batch qty), false = cost per batch (one-off). Default: HW true, PKG false. */
  perUnit?: boolean;
}

export type LaborCostMode = 'calculated' | 'manual';

export interface CalculatorState {
  projectName: string;
  filaments: FilamentEntry[];
  hardware: LineItem[];
  packaging: LineItem[];
  printTimeHours: number;
  printTimeMinutes: number;
  laborCostMode: LaborCostMode;
  laborHourlyRate: number;
  laborTimeMinutes: number;
  laborManualTotal: number;
  isBatch: boolean;
  batchSize: number;
  showAdvanced: boolean;
  vatRate: number;
  materialRiskPercentage: number;
  complexityMultiplier: number;
  selectedPrinterPreset: string;
  printerPrice: number;
  printerStartupCosts: number;
  printerLifespanYears: number;
  printerMaintenanceYearly: number;
  uptimePercentage: number;
  energyConsumptionWatts: number;
  energyPricePerKwh: number;
  customMargin: number;
  /** Custom gross price per piece. When set, used instead of margin-derived price. Stored in DB as price + manualPrice. */
  customPricePerUnit: number | null;
}

export interface MachineDetails {
  totalInvestment: number;
  totalLifecycleCost: number;
  workingHoursPerYear: number;
  amortizationPerHour: number;
  maintenancePerHour: number;
  energyPerHour: number;
  machineHourlyCost: number;
}

export interface PriceTier {
  margin: number;
  net: number;
  gross: number;
}

export interface LineItemBreakdown {
  id: string;
  name: string;
  type: 'hardware' | 'packaging';
  perUnit: boolean;
  qty: number;
  value: number;
}

export interface CalculationMetrics {
  qty: number;
  totalPrintHours: number;
  totalMaterialCost: number;
  totalHardwareCost: number;
  totalPackagingCost: number;
  totalMachineCost: number;
  totalLaborCost: number;
  machineDetails: MachineDetails;
  totalCostNetto: number;
  costPerUnit: number;
  lineItemsBreakdown: LineItemBreakdown[];
  prices: {
    competitive: PriceTier;
    standard: PriceTier;
    premium: PriceTier;
    luxury: PriceTier;
    custom: PriceTier;
  };
}

/** Stored in print_entry.calculatorSnapshot for full restore (filaments, HW/PKG, labor, machine, vat, margin). */
export interface CalculatorSnapshot {
  filaments: Array<{ id: string; name: string; pricePerKg: number; weightGrams: number; filamentId?: string; brand?: string; color?: string }>;
  hardware: Array<{ id: string; name: string; price: number; qty: number; perUnit?: boolean }>;
  packaging: Array<{ id: string; name: string; price: number; qty: number; perUnit?: boolean }>;
  laborCostMode: LaborCostMode;
  laborHourlyRate: number;
  laborTimeMinutes: number;
  laborManualTotal: number;
  vatRate: number;
  materialRiskPercentage: number;
  complexityMultiplier: number;
  printerPrice: number;
  printerStartupCosts: number;
  printerLifespanYears: number;
  printerMaintenanceYearly: number;
  uptimePercentage: number;
  energyConsumptionWatts: number;
  energyPricePerKwh: number;
  customMargin: number;
}

/**
 * Splits a full filament display name into brand (material type) and color.
 * Handles names like "Bambu Lab PLA Sunflower Yellow (10402)" → brand: "Bambu Lab PLA", color: "Sunflower Yellow (10402)".
 */
export function splitFilamentDisplayName(
  name: string
): { brand: string; color: string | null } {
  const trimmed = name.trim();
  if (!trimmed) return { brand: '', color: null };
  const m = trimmed.match(/^(.+) (.+ \(\d+\))$/);
  if (m) return { brand: m[1].trim(), color: m[2].trim() };
  return { brand: trimmed, color: null };
}

export function stateToCalculatorSnapshot(state: CalculatorState): CalculatorSnapshot {
  return {
    filaments: state.filaments.map((f) => ({ id: f.id, name: f.name, pricePerKg: f.pricePerKg, weightGrams: f.weightGrams, filamentId: f.filamentId, brand: f.brand, color: f.color })),
    hardware: state.hardware.map((h) => ({ id: h.id, name: h.name, price: h.price, qty: h.qty, perUnit: h.perUnit })),
    packaging: state.packaging.map((p) => ({ id: p.id, name: p.name, price: p.price, qty: p.qty, perUnit: p.perUnit })),
    laborCostMode: state.laborCostMode,
    laborHourlyRate: state.laborHourlyRate,
    laborTimeMinutes: state.laborTimeMinutes,
    laborManualTotal: state.laborManualTotal,
    vatRate: state.vatRate,
    materialRiskPercentage: state.materialRiskPercentage,
    complexityMultiplier: state.complexityMultiplier,
    printerPrice: state.printerPrice,
    printerStartupCosts: state.printerStartupCosts,
    printerLifespanYears: state.printerLifespanYears,
    printerMaintenanceYearly: state.printerMaintenanceYearly,
    uptimePercentage: state.uptimePercentage,
    energyConsumptionWatts: state.energyConsumptionWatts,
    energyPricePerKwh: state.energyPricePerKwh,
    customMargin: state.customMargin,
  };
}

// --- Constants (presets from API: /api/printers, warehouse + /api/filaments/global) ---

/** Label for custom machine configuration (no printer selected from database). */
export const CUSTOM_CONFIGURATION = 'Custom configuration';

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function getInitialCalculatorState(): CalculatorState {
  return {
    projectName: 'Prototype Enclosure v2',
    filaments: [
      { id: generateId(), name: '', pricePerKg: 0, weightGrams: 0 },
    ],
    hardware: [],
    packaging: [],
    printTimeHours: 6,
    printTimeMinutes: 0,
    laborCostMode: 'calculated',
    laborHourlyRate: 50,
    laborTimeMinutes: 15,
    laborManualTotal: 0,
    isBatch: false,
    batchSize: 10,
    showAdvanced: false,
    vatRate: 23,
    materialRiskPercentage: 10,
    complexityMultiplier: 1,
    selectedPrinterPreset: CUSTOM_CONFIGURATION,
    printerPrice: 2149,
    printerStartupCosts: 0,
    printerLifespanYears: 5,
    printerMaintenanceYearly: 317,
    uptimePercentage: 50,
    energyConsumptionWatts: 150,
    energyPricePerKwh: 1.2,
    customMargin: 120,
    customPricePerUnit: null,
  };
}
