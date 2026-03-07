ALTER TABLE "customer" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "contactPerson" text;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "tags" text[];