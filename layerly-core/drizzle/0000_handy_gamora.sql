CREATE TYPE "public"."OrderStatus" AS ENUM('QUOTE', 'IN_PRODUCTION', 'READY', 'SHIPPED');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entityId" text,
	"details" jsonb,
	"userId" uuid NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"firstName" text,
	"lastName" text,
	"companyName" text,
	"email" text,
	"phone" text,
	"nip" text,
	"street" text,
	"city" text,
	"zipCode" text,
	"country" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filament" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid,
	"materialName" text NOT NULL,
	"brand" text NOT NULL,
	"color" text NOT NULL,
	"colorHex" text,
	"image" text,
	"materialType" text,
	"spoolPrice" double precision NOT NULL,
	"spoolWeight" double precision NOT NULL,
	"density" double precision,
	"costPerGram" double precision,
	"remainingWeight" double precision,
	"notes" text,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_filament" (
	"id" text PRIMARY KEY NOT NULL,
	"externalId" integer,
	"materialName" text NOT NULL,
	"materialType" text,
	"brand" text NOT NULL,
	"color" text NOT NULL,
	"colorHex" text,
	"spoolPrice" double precision,
	"spoolWeight" double precision,
	"density" double precision,
	"image" text,
	"website" text,
	"sku" text,
	"printTempMin" integer,
	"printTempMax" integer,
	"bedTemp" integer,
	"printSpeed" integer,
	"fanSpeed" integer,
	"flowRatio" double precision,
	"diameter" double precision DEFAULT 1.75,
	"mechanicalProps" text,
	"applications" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_order" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"customerId" text,
	"title" text NOT NULL,
	"customerName" text,
	"status" "OrderStatus" DEFAULT 'QUOTE' NOT NULL,
	"shareToken" text,
	"deadline" timestamp,
	"notes" text,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"printerId" text NOT NULL,
	"filamentId" text,
	"orderId" text,
	"name" text NOT NULL,
	"brand" text,
	"color" text,
	"weight" double precision NOT NULL,
	"timeH" integer NOT NULL,
	"timeM" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"price" double precision NOT NULL,
	"profit" double precision NOT NULL,
	"totalCost" double precision NOT NULL,
	"extraCost" double precision,
	"manualPrice" double precision,
	"advancedSettings" jsonb,
	"date" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "printer" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"model" text,
	"power" integer NOT NULL,
	"costPerHour" double precision,
	"purchaseDate" timestamp,
	"notes" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"maxFilaments" integer NOT NULL,
	"maxPrinters" integer NOT NULL,
	"pdfExport" boolean DEFAULT false NOT NULL,
	"clientManagement" boolean DEFAULT false NOT NULL,
	"ordersAccess" boolean DEFAULT false NOT NULL,
	"csvExport" boolean DEFAULT false NOT NULL,
	"advancedAnalytics" boolean DEFAULT false NOT NULL,
	"multiUser" boolean DEFAULT false NOT NULL,
	"prioritySupport" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"subscription_tier" text DEFAULT 'HOBBY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"energyRate" double precision DEFAULT 1.15 NOT NULL,
	"defaultPrinterId" text,
	"useGravatar" boolean DEFAULT true NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filament" ADD CONSTRAINT "filament_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_order" ADD CONSTRAINT "print_order_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_order" ADD CONSTRAINT "print_order_customer_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_entry" ADD CONSTRAINT "print_entry_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_entry" ADD CONSTRAINT "print_entry_printer_fk" FOREIGN KEY ("printerId") REFERENCES "public"."printer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_entry" ADD CONSTRAINT "print_entry_filament_fk" FOREIGN KEY ("filamentId") REFERENCES "public"."filament"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "print_entry" ADD CONSTRAINT "print_entry_order_fk" FOREIGN KEY ("orderId") REFERENCES "public"."print_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printer" ADD CONSTRAINT "printer_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_userId_idx" ON "activity_log" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "activity_log_action_idx" ON "activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "activity_log_entity_idx" ON "activity_log" USING btree ("entity");--> statement-breakpoint
CREATE INDEX "activity_log_createdAt_idx" ON "activity_log" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "customer_userId_idx" ON "customer" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "filament_userId_idx" ON "filament" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "global_filament_external_id_idx" ON "global_filament" USING btree ("externalId");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscriber_email_idx" ON "newsletter_subscriber" USING btree ("email");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notification_isRead_idx" ON "notification" USING btree ("isRead");--> statement-breakpoint
CREATE UNIQUE INDEX "print_order_share_token_idx" ON "print_order" USING btree ("shareToken");--> statement-breakpoint
CREATE INDEX "print_order_userId_idx" ON "print_order" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "print_order_status_idx" ON "print_order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "print_order_customerId_idx" ON "print_order" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "print_entry_userId_idx" ON "print_entry" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "print_entry_printerId_idx" ON "print_entry" USING btree ("printerId");--> statement-breakpoint
CREATE INDEX "print_entry_filamentId_idx" ON "print_entry" USING btree ("filamentId");--> statement-breakpoint
CREATE INDEX "print_entry_orderId_idx" ON "print_entry" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "printer_userId_idx" ON "printer" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_email_idx" ON "user_profiles" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_settings_user_idx" ON "user_settings" USING btree ("userId");