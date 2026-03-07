import type {
  CalculatorState,
  CalculationMetrics,
  LineItemBreakdown,
} from './types';

/**
 * Pure calculation logic for 3D print cost calculator.
 * Source of truth: Layerly spec (with guards against division by zero).
 */
export function calculateMetrics(state: CalculatorState): CalculationMetrics {
  const qty = state.isBatch ? state.batchSize : 1;

  // 1. Material (weight * price + waste risk)
  let rawMaterialCost = 0;
  state.filaments.forEach((f) => {
    rawMaterialCost += (f.weightGrams / 1000) * f.pricePerKg;
  });
  const totalMaterialCost =
    rawMaterialCost * (1 + state.materialRiskPercentage / 100) * qty;

  // 2. Extra items and packaging (per piece × batch, per batch = one-off)
  const lineItemsBreakdown: LineItemBreakdown[] = [];
  const totalHardwareCost = state.hardware.reduce((acc, item) => {
    const perUnit = item.perUnit ?? true;
    const value = perUnit
      ? item.price * item.qty * qty
      : item.price * item.qty;
    lineItemsBreakdown.push({
      id: item.id,
      name: item.name,
      type: 'hardware',
      perUnit,
      qty: item.qty,
      value,
    });
    return acc + value;
  }, 0);
  const totalPackagingCost = state.packaging.reduce((acc, item) => {
    const perUnit = item.perUnit ?? false;
    const value = perUnit
      ? item.price * item.qty * qty
      : item.price * item.qty;
    lineItemsBreakdown.push({
      id: item.id,
      name: item.name,
      type: 'packaging',
      perUnit,
      qty: item.qty,
      value,
    });
    return acc + value;
  }, 0);

  // 3. Time (hours * quantity)
  const timePerUnitHours =
    state.printTimeHours + state.printTimeMinutes / 60;
  const totalPrintHours = timePerUnitHours * qty;

  // 4. Machine (RBH - Machine labor hour)
  const hoursInYear = 365 * 24;
  const workingHoursPerYear =
    hoursInYear * (state.uptimePercentage / 100);

  const totalInvestment =
    state.printerPrice + state.printerStartupCosts;
  const totalLifecycleCost =
    totalInvestment +
    state.printerMaintenanceYearly * state.printerLifespanYears;

  const safeWorkingHours = workingHoursPerYear > 0 ? workingHoursPerYear : 1;
  const safeLifespan =
    state.printerLifespanYears > 0 ? state.printerLifespanYears : 1;

  const amortizationPerHour =
    totalInvestment / (safeLifespan * safeWorkingHours);
  const maintenancePerHour =
    state.printerMaintenanceYearly / safeWorkingHours;
  const energyPerHour =
    (state.energyConsumptionWatts / 1000) * state.energyPricePerKwh;

  const machineHourlyCost =
    amortizationPerHour + maintenancePerHour + energyPerHour;
  const totalMachineCost =
    machineHourlyCost *
    totalPrintHours *
    state.complexityMultiplier;

  // 5. Labor (human work)
  let totalLaborCost = 0;
  if (state.laborCostMode === 'manual') {
    totalLaborCost = state.laborManualTotal;
  } else {
    const laborHours = (state.laborTimeMinutes / 60) * qty;
    totalLaborCost = laborHours * state.laborHourlyRate;
  }

  // 6. Totals and margins
  const totalCostNetto =
    totalMaterialCost +
    totalHardwareCost +
    totalPackagingCost +
    totalMachineCost +
    totalLaborCost;
  const safeQty = qty > 0 ? qty : 1;
  const costPerUnit = totalCostNetto / safeQty;

  const calculatePrice = (marginPercent: number) => {
    const profit = totalCostNetto * (marginPercent / 100);
    const netPrice = totalCostNetto + profit;
    const grossPrice = netPrice * (1 + state.vatRate / 100);
    return { margin: marginPercent, net: netPrice, gross: grossPrice };
  };

  const vatFactor = 1 + state.vatRate / 100;
  const customPrice =
    state.customPricePerUnit != null && state.customPricePerUnit > 0
      ? (() => {
          const gross = state.customPricePerUnit! * safeQty;
          const net = gross / vatFactor;
          const margin =
            totalCostNetto > 0
              ? Math.round(((net - totalCostNetto) / totalCostNetto) * 1000) / 10
              : 0;
          return { margin, net, gross };
        })()
      : calculatePrice(state.customMargin);

  return {
    qty,
    totalPrintHours,
    totalMaterialCost,
    totalHardwareCost,
    totalPackagingCost,
    totalMachineCost,
    totalLaborCost,
    lineItemsBreakdown,
    machineDetails: {
      totalInvestment,
      totalLifecycleCost,
      workingHoursPerYear,
      amortizationPerHour,
      maintenancePerHour,
      energyPerHour,
      machineHourlyCost,
    },
    totalCostNetto,
    costPerUnit,
    prices: {
      competitive: calculatePrice(20),
      standard: calculatePrice(40),
      premium: calculatePrice(60),
      luxury: calculatePrice(80),
      custom: customPrice,
    },
  };
}
