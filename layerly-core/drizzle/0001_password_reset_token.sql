CREATE TABLE "password_reset_token" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"tokenHash" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"usedAt" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "password_reset_token_user_idx" ON "password_reset_token" USING btree ("userId");
--> statement-breakpoint
CREATE INDEX "password_reset_token_expires_idx" ON "password_reset_token" USING btree ("expiresAt");

