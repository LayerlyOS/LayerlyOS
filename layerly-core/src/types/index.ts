export interface FilamentItem {
  brand: string;
  type: string;
  color: string;
  price: number;
  weight: number;
}

export interface Filament {
  id: string;
  materialName: string;
  brand: string;
  color: string;
  spoolPrice: number;
  spoolWeight: number;
  remainingWeight?: number;
  image?: string;
  materialType?: string;
  colorHex?: string;
  density?: number;
  diameter?: number;
  printTempMin?: number;
  printTempMax?: number;
  bedTemp?: number;
  printSpeed?: number;
  fanSpeed?: number;
  flowRatio?: number;
  mechanicalProps?: string;
  applications?: string;
  website?: string;
  notes?: string;
}

export type PrinterStatus = 'available' | 'in_use' | 'maintenance';
export type PrinterType = 'FDM' | 'SLA' | 'SLS';

export interface Printer {
  id: string;
  name: string;
  model: string;
  type?: PrinterType;
  status?: PrinterStatus;
  location?: string | null;
  ipAddress?: string | null;
  lastMaintenance?: string | null;
  notes?: string | null;
  currentMaterialId?: string | null;
  /** Loaded spool (when joined from API). */
  material?: {
    id: string;
    materialName: string;
    materialType?: string | null;
    color: string;
    colorHex?: string | null;
  } | null;
  power: number;
  costPerHour?: number | null;
  purchaseDate?: string | null;
  isDefault?: boolean;
}

export interface PrintEntry {
  id: number | string; // number for legacy localStorage, string for API (cuid)
  date: string;
  name: string;
  timeH: number;
  timeM: number;
  weight: number;
  brand: string;
  color: string;
  /** Total cost (batch). */
  totalCost?: number;
  /** Selling price (batch) or per-unit depending on context; API stores batch total. */
  price?: number;
  /** Profit (batch). */
  profit?: number;
  qty: number;
  manualPrice?: number;
  extraCost?: number;
  printerId?: string;
  filamentId?: string | null;
  filament?: {
    id: string;
    colorHex?: string | null;
    color: string;
    brand: string;
    materialName: string;
  } | null;
  orderId?: string | null;
  orderTitle?: string | null;
  orderCustomerName?: string | null;
  orderStatus?: OrderStatus | null;
  advancedSettings?: AdvancedSettings | null;
  /** Full calculator state snapshot (filaments, hardware, packaging, labor, machine, vat, margin). */
  calculatorSnapshot?: unknown;
  /** Print outcome: success | failed | canceled. Default success. */
  status?: 'success' | 'failed' | 'canceled';
  /** Display name of the operator who started the print. */
  operatorName?: string | null;
  notes?: string | null;
  errorReason?: string | null;
}

export interface AdvancedSettings {
  // Depreciation
  printerPrice: number;
  lifespanHours: number;
  
  // Risk Management
  failureRate: number; // 0-100%
  
  // Labor & Process
  hourlyRate: number;
  setupTimeMinutes: number;
  postProcessingMinutes: number;
  
  // Logistics
  packagingCost: number;
  shippingCost: number;
}

export type OrderStatus = 'QUOTE' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED';

export interface Order {
  id: string;
  userId: string;
  title: string;
  customerId?: string | null;
  customerName?: string | null;
  status: OrderStatus;
  shareToken?: string | null;
  deadline?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  printEntries?: PrintEntry[];
}

export interface CalculationResult {
  baseCost: number;
  price: number;
  profit: number;
  totalHours: number;
  manualPrice: number;
}

export interface Settings {
  power: number;
  energyRate: number;
  spoolPrice: number;
  spoolWeight: number;
  printers?: Printer[];
  defaultPrinterId?: string;
  /** Threshold % (0–100): notify when stock is below this % of a full spool. */
  lowStockAlertPercent?: number;
}
