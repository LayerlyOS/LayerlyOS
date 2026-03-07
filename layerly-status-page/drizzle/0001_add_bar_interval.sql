ALTER TABLE "status_page_config" ADD COLUMN IF NOT EXISTS "bar_interval" text DEFAULT 'hourly' NOT NULL;
