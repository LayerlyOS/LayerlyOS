CREATE TABLE "maintenance_windows" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitor_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "group_id" text;--> statement-breakpoint
CREATE INDEX "maintenance_windows_starts_idx" ON "maintenance_windows" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "maintenance_windows_ends_idx" ON "maintenance_windows" USING btree ("ends_at");--> statement-breakpoint
ALTER TABLE "monitors" ADD CONSTRAINT "monitors_group_id_monitor_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."monitor_groups"("id") ON DELETE set null ON UPDATE no action;