-- Add calculatorSnapshot to print_entry for full calculator state (HW/PKG, multiple filaments, labor, machine, vat, margin)
ALTER TABLE "print_entry" ADD COLUMN IF NOT EXISTS "calculatorSnapshot" jsonb;
