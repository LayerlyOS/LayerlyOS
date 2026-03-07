export interface RawFilament {
  id: number;
  default_id?: number | null;
  short_code?: string | null;
  brand_key?: string | null;
  material_key?: string | null;
  material_type_key?: string | null;
  brand_name?: string | null;
  material?: string | null;
  material_type?: string | null;
  color?: string | null;
  rgb?: string | null;
  image?: string | null;
  website?: string | null;
  default_website?: string | null;
  price_data?: any | null;
  sku?: string | null;
  deleted?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface ProcessedFilament extends RawFilament {
  brand_name: string;
  material: string;
  color: string;
  rgb: string;
  is_valid: boolean;
  validation_errors: string[];
  last_processed_at: string;
}

export interface ProcessingStats {
  total: number;
  valid: number;
  invalid: number;
  by_material: Record<string, number>;
  by_brand: Record<string, number>;
  processing_time_ms: number;
}

export interface ProcessingResult {
  stats: ProcessingStats;
  data: ProcessedFilament[];
  logs: string[];
}
