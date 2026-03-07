import { formatCurrency } from '@/lib/format';
import { calculateAdvancedCosts } from '@/lib/calculations';
import type { PrintEntry, Printer, Settings } from '@/types';

export const getCost = (item: PrintEntry) => item.totalCost ?? 0;
export const getPrice = (item: PrintEntry) => item.price ?? 0;
export const getProfit = (item: PrintEntry) => item.profit ?? 0;

export const formatMoney = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return formatCurrency(value);
};

export const formatNumber = (value: number | null | undefined, digits: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
};

export const getBreakdown = (
  item: PrintEntry,
  settings: Settings,
  printers: Printer[],
  filaments: any[]
) => {
  const getPrinterPower = (printerId?: number | string) => {
    if (!printerId) return 0;
    return printers.find((p) => String(p.id) === String(printerId))?.power || 0;
  };

  const getFilament = (filamentId?: string | null) => {
    if (!filamentId) return null;
    return filaments.find((f) => f.id === filamentId) || null;
  };

  const getPrinterOpsCostPerHour = (printerId?: number | string) => {
    if (!printerId) return 0;
    const printer = printers.find((p) => String(p.id) === String(printerId));
    return printer?.costPerHour || 0;
  };

  const qty = item.qty || 1;
  const totalHoursPerItem = (item.timeH || 0) + (item.timeM || 0) / 60;
  const totalHours = totalHoursPerItem * qty;

  const powerW = getPrinterPower(item.printerId);
  const energyRate = settings.energyRate || 0;
  const energyCostPerHour = (powerW / 1000) * energyRate;
  const energyCostPerItem = energyCostPerHour * totalHoursPerItem;

  const opsCostPerHour = getPrinterOpsCostPerHour(item.printerId);
  const opsCostPerItem = opsCostPerHour * totalHoursPerItem;

  const filament =
    (item as any).filament ||
    getFilament(typeof item.filamentId === 'string' ? item.filamentId : null);
  const materialCostPerItem =
    filament && filament.spoolWeight > 0
      ? (filament.spoolPrice / filament.spoolWeight) * (item.weight || 0)
      : null;

  const extraCostPerItem = item.extraCost || 0;
  const totalCostPerItem = getCost(item);

  // Advanced Calculations
  let advancedStats = null;
  if (item.advancedSettings) {
    const adv = calculateAdvancedCosts(
      materialCostPerItem || 0,
      energyCostPerItem,
      totalHoursPerItem,
      item.advancedSettings,
      getPrice(item),
      qty,
      opsCostPerItem,
      extraCostPerItem
    );
    advancedStats = {
      depreciation: adv.depreciationCost,
      labor: adv.laborCost,
      risk: adv.riskCost,
      logistics: adv.logisticsCost,
      roi: adv.roiBreakEvenPoint,
    };
  }

  const amortCostPerItem =
    materialCostPerItem === null
      ? null
      : totalCostPerItem - materialCostPerItem - energyCostPerItem - extraCostPerItem;

  const pricePerItem = getPrice(item);
  const profit = getProfit(item);
  const profitPerItem = qty > 0 ? profit / qty : 0;

  return {
    qty,
    totalHoursPerItem,
    totalHours,
    powerW,
    energyRate,
    energyCostPerHour,
    energyCostPerItem,
    energyCostTotal: energyCostPerItem * qty,
    filament,
    materialCostPerItem,
    materialCostTotal: materialCostPerItem === null ? null : materialCostPerItem * qty,
    extraCostPerItem,
    extraCostTotal: extraCostPerItem * qty,
    amortCostPerItem,
    amortCostTotal: amortCostPerItem === null ? null : amortCostPerItem * qty,
    totalCostPerItem,
    totalCostTotal: totalCostPerItem * qty,
    pricePerItem,
    priceTotal: pricePerItem * qty,
    profitPerItem,
    profit,
    advancedStats,
  };
};
