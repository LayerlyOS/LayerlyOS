-- Printer fleet: type, status, location, IP, last maintenance, current material (spool)
CREATE TYPE "public"."PrinterStatus" AS ENUM('available', 'in_use', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."PrinterType" AS ENUM('FDM', 'SLA', 'SLS');--> statement-breakpoint
ALTER TABLE "printer" ADD COLUMN "type" "PrinterType" DEFAULT 'FDM' NOT NULL;--> statement-breakpoint
ALTER TABLE "printer" ADD COLUMN "status" "PrinterStatus" DEFAULT 'available' NOT NULL;--> statement-breakpoint
ALTER TABLE "printer" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "printer" ADD COLUMN "ipAddress" text;--> statement-breakpoint
ALTER TABLE "printer" ADD COLUMN "lastMaintenance" timestamp;--> statement-breakpoint
ALTER TABLE "printer" ADD COLUMN "currentMaterialId" text;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_current_material_fk" FOREIGN KEY ("currentMaterialId") REFERENCES "public"."filament"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "printer_currentMaterialId_idx" ON "printer" USING btree ("currentMaterialId");
