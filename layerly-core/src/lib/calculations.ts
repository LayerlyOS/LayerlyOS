import type { CalculationResult, AdvancedSettings } from '@/types';

export const calculateAdvancedCosts = (
  matCost: number,
  energyCost: number,
  totalHours: number,
  advancedSettings: AdvancedSettings,
  salesPrice: number = 0,
  qty: number = 1,
  opsCostPerItem: number = 0,
  extraCostPerItem: number = 0
) => {
  const {
    printerPrice,
    lifespanHours,
    hourlyRate,
    setupTimeMinutes,
    postProcessingMinutes,
    failureRate,
    packagingCost,
    shippingCost
  } = advancedSettings;

  const quantity = Math.max(1, qty);

  // 1. Variable Costs (Per Item)
  // Material + Energy + Depreciation + Risk + Post-processing Labor + Ops + Extra
  const depreciationCost = lifespanHours > 0 
    ? (printerPrice / lifespanHours) * totalHours 
    : 0;

  const postProcessCost = (postProcessingMinutes / 60) * hourlyRate;
  
  const riskBase = matCost + energyCost + depreciationCost;
  const riskCost = riskBase * (failureRate / 100);

  const variableCostPerItem =
    matCost +
    energyCost +
    depreciationCost +
    riskCost +
    postProcessCost +
    opsCostPerItem +
    extraCostPerItem;

  // 2. Fixed Costs (Per Batch)
  // Shipping + Packaging + Setup Labor
  const setupLaborCost = (setupTimeMinutes / 60) * hourlyRate;
  const fixedBatchCost = packagingCost + shippingCost + setupLaborCost;

  // 3. Total Batch Cost
  const totalBatchCost = (variableCostPerItem * quantity) + fixedBatchCost;

  // 4. Real Cost Per Item (Amortized)
  const realCostPerItem = totalBatchCost / quantity;

  // 5. ROI Metric (Cash Flow Payback Method)
  // Calculate Cash Profit from Current Batch to see how much we pay off
  // We exclude depreciation from the "payback" calculation because it's a non-cash allocation.
  // We want to know: "When does the cash in my pocket cover the printer cost?"
  
  // Risk cost includes a depreciation component (value of time lost). For cash ROI, we only care about cash lost (material/energy).
  const riskCostDepreciationPart = depreciationCost * (failureRate / 100);
  const riskCostCash = riskCost - riskCostDepreciationPart;
  
  // Variable Cash Cost (Per Item)
  const variableCostPerItemCash =
    matCost +
    energyCost +
    riskCostCash +
    postProcessCost +
    opsCostPerItem +
    extraCostPerItem;
  
  // Total Batch Cash Cost (including fixed batch costs like packaging/shipping)
  const totalBatchCostCash = (variableCostPerItemCash * quantity) + fixedBatchCost;

  // Cash Profit from this batch
  const batchRevenue = salesPrice * quantity;
  const batchProfitCash = batchRevenue - totalBatchCostCash;
  
  // Calculate Remaining Printer Cost after this batch
  const remainingPrinterCost = printerPrice - batchProfitCash;
  
  // Calculate Marginal Cash Profit Per Item
  // How much cash does each future unit contribute to paying off the printer?
  const marginalProfitPerItemCash = salesPrice - variableCostPerItemCash;
  
  let roiBreakEvenPoint = 0;
  
  if (remainingPrinterCost <= 0) {
     // Already paid off
     roiBreakEvenPoint = 0; 
  } else if (marginalProfitPerItemCash <= 0) {
     // Never pays off (unit loses cash)
     roiBreakEvenPoint = Infinity;
  } else {
     // Remaining Units needed = Remaining Cost / Marginal Cash Profit
     const remainingUnits = Math.ceil(remainingPrinterCost / marginalProfitPerItemCash);
     roiBreakEvenPoint = quantity + remainingUnits;
  }

  return {
    depreciationCost, // Per Item component
    laborCost: (postProcessCost * quantity + setupLaborCost) / quantity, // Averaged labor per item
    riskCost, // Per Item component
    packagingCost: packagingCost / quantity, // Averaged per item
    shippingCost: shippingCost / quantity, // Averaged per item
    logisticsCost: (packagingCost + shippingCost) / quantity, // Averaged per item
    totalCost: realCostPerItem, // The real cost per item including amortized fixed costs
    totalBatchCost,
    roiBreakEvenPoint
  };
};

export const calculateCosts = (
  power: number,
  energyRate: number,
  spoolPrice: number,
  spoolWeight: number,
  printWeight: number,
  hours: number,
  minutes: number,
  opsCostPerHour: number = 0,
  marginPercent: number = 0,
  qty: number = 1,
  manualPrice: number = 0,
  extraCost: number = 0
): CalculationResult => {
  const pricePerGram = spoolWeight > 0 ? spoolPrice / spoolWeight : 0;
  const totalHours = hours + minutes / 60;
  const matCost = pricePerGram * printWeight;
  const energyCost = (power / 1000) * totalHours * energyRate;
  const opsCost = opsCostPerHour * totalHours;

  const baseCost = matCost + energyCost + opsCost + extraCost;

  let finalPrice: number;
  if (manualPrice > 0) {
    finalPrice = manualPrice;
  } else {
    finalPrice = baseCost * (1 + marginPercent / 100);
  }

  const profitPerItem = finalPrice - baseCost;
  const profit = profitPerItem * qty;

  return {
    baseCost,
    price: finalPrice,
    profit,
    totalHours,
    manualPrice,
  };
};

export const getPricePerKg = (spoolPrice: number, spoolWeight: number): number => {
  return spoolWeight > 0 ? (spoolPrice / spoolWeight) * 1000 : 0;
};
