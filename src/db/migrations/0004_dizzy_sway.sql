CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_normalized" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_name_not_blank" CHECK (length(trim("sellers"."name")) > 0),
	CONSTRAINT "sellers_email_not_blank" CHECK (length(trim("sellers"."email")) > 0),
	CONSTRAINT "sellers_email_normalized_lower" CHECK ("sellers"."email_normalized" = lower("sellers"."email_normalized"))
);
--> statement-breakpoint
ALTER TABLE "sellers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "sellers_email_normalized_unique" ON "sellers" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "sellers_is_active_idx" ON "sellers" USING btree ("is_active");