ALTER TABLE "print_entry" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'success' NOT NULL;--> statement-breakpoint
ALTER TABLE "print_entry" ADD COLUMN IF NOT EXISTS "notes" text;--> statement-breakpoint
ALTER TABLE "print_entry" ADD COLUMN IF NOT EXISTS "errorReason" text;
