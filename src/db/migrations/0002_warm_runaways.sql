CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"default_customer_language" text DEFAULT 'de' NOT NULL,
	"order_number_prefix" text DEFAULT 'SC' NOT NULL,
	"email_from_name" text DEFAULT 'Sun Container' NOT NULL,
	"email_from_address" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_single_row" CHECK ("app_settings"."id" = 'global')
);
--> statement-breakpoint
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;