ALTER TYPE "public"."email_type" ADD VALUE 'PROCUREMENT_STARTED' BEFORE 'PRODUCTION_STARTED';--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "previous_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "new_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'ORDER_CONFIRMED'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('ORDER_CONFIRMED', 'PROCUREMENT', 'IN_PRODUCTION', 'IN_TRANSIT', 'DELIVERED');--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "previous_status" SET DATA TYPE "public"."order_status" USING "previous_status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "new_status" SET DATA TYPE "public"."order_status" USING "new_status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'ORDER_CONFIRMED'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";