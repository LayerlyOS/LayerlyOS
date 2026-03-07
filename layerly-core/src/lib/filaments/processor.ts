import type { ProcessedFilament, ProcessingResult, ProcessingStats, RawFilament } from './types.ts';
import { isValidHexColor, normalizeColor, normalizeMaterial, toTitleCase } from './utils.ts';

export class FilamentProcessor {
  private logs: string[] = [];

  private log(message: string) {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
  }

  public process(data: RawFilament[]): ProcessingResult {
    const startTime = Date.now();
    this.log(`Starting processing of ${data.length} records.`);

    const processedData: ProcessedFilament[] = data.map((item) => this.processItem(item));

    const stats = this.calculateStats(processedData, startTime);
    this.log(`Processing completed. Valid: ${stats.valid}, Invalid: ${stats.invalid}`);

    return {
      stats,
      data: processedData,
      logs: this.logs,
    };
  }

  private processItem(item: RawFilament): ProcessedFilament {
    const errors: string[] = [];

    // Validation
    if (!item.id) errors.push('Missing ID');
    if (!item.brand_name) errors.push('Missing Brand Name');
    if (!item.material) errors.push('Missing Material');

    // Normalization & Enrichment
    const brand_name = item.brand_name ? toTitleCase(item.brand_name) : 'Unknown Brand';
    const material = normalizeMaterial(item.material || '');
    const color = item.color ? toTitleCase(item.color) : 'Unknown Color';
    const rgb = normalizeColor(item.rgb || '');

    if (item.rgb && !isValidHexColor(item.rgb)) {
      errors.push(`Invalid RGB color: ${item.rgb}`);
    }

    return {
      ...item,
      brand_name,
      material,
      color,
      rgb,
      is_valid: errors.length === 0,
      validation_errors: errors,
      last_processed_at: new Date().toISOString(),
    };
  }

  private calculateStats(data: ProcessedFilament[], startTime: number): ProcessingStats {
    const validItems = data.filter((d) => d.is_valid);
    const invalidItems = data.filter((d) => !d.is_valid);

    const by_material: Record<string, number> = {};
    const by_brand: Record<string, number> = {};

    validItems.forEach((item) => {
      // Material stats
      by_material[item.material] = (by_material[item.material] || 0) + 1;
      // Brand stats
      by_brand[item.brand_name] = (by_brand[item.brand_name] || 0) + 1;
    });

    return {
      total: data.length,
      valid: validItems.length,
      invalid: invalidItems.length,
      by_material,
      by_brand,
      processing_time_ms: Date.now() - startTime,
    };
  }
}
