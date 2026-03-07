-- Powiadomienie o niskim stanie magazynu: próg % (0–100). Domyślnie 20.
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "lowStockAlertPercent" integer DEFAULT 20 NOT NULL;
