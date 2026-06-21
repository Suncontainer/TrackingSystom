ALTER TABLE "delivery_date_history" DROP CONSTRAINT "delivery_date_history_date_changed";--> statement-breakpoint
ALTER TABLE "delivery_date_history" ADD COLUMN "previous_date_end" date;--> statement-breakpoint
ALTER TABLE "delivery_date_history" ADD COLUMN "new_date_end" date;--> statement-breakpoint
UPDATE "delivery_date_history" SET "previous_date_end" = "previous_date" WHERE "previous_date_end" IS NULL;--> statement-breakpoint
UPDATE "delivery_date_history" SET "new_date_end" = "new_date" WHERE "new_date_end" IS NULL;--> statement-breakpoint
ALTER TABLE "delivery_date_history" ALTER COLUMN "previous_date_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_date_history" ALTER COLUMN "new_date_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "initial_estimated_delivery_date_end" date;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "current_estimated_delivery_date_end" date;--> statement-breakpoint
UPDATE "orders" SET "initial_estimated_delivery_date_end" = "initial_estimated_delivery_date" WHERE "initial_estimated_delivery_date_end" IS NULL;--> statement-breakpoint
UPDATE "orders" SET "current_estimated_delivery_date_end" = "current_estimated_delivery_date" WHERE "current_estimated_delivery_date_end" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "initial_estimated_delivery_date_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "current_estimated_delivery_date_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_date_history" ADD CONSTRAINT "delivery_date_history_date_changed" CHECK ("delivery_date_history"."previous_date" <> "delivery_date_history"."new_date" or "delivery_date_history"."previous_date_end" <> "delivery_date_history"."new_date_end");
