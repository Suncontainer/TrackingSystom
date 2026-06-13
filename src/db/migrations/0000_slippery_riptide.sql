CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'SALES', 'READ_ONLY');--> statement-breakpoint
CREATE TYPE "public"."email_category" AS ENUM('TRANSACTIONAL', 'OPTIONAL_SERVICE', 'MARKETING', 'INTERNAL');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'SUPPRESSED', 'SIMULATED');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('ORDER_RECEIVED', 'PRODUCTION_STARTED', 'IN_TRANSIT', 'DELIVERED', 'SALESPERSON_NEW_ORDER', 'DELIVERY_DATE_UPDATED', 'REVIEW_REQUEST', 'SATISFACTION_SURVEY', 'MAINTENANCE_RECOMMENDATION', 'WARRANTY_REMINDER', 'PROMOTIONAL');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('ORDER_RECEIVED', 'IN_PRODUCTION', 'IN_TRANSIT', 'DELIVERED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"order_id" uuid,
	"before_data" jsonb,
	"after_data" jsonb,
	"metadata" jsonb,
	"request_id" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_action_not_blank" CHECK (length(trim("audit_logs"."action")) > 0),
	CONSTRAINT "audit_logs_entity_type_not_blank" CHECK (length(trim("audit_logs"."entity_type")) > 0)
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customer_communication_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"review_request_allowed" boolean DEFAULT false NOT NULL,
	"satisfaction_survey_allowed" boolean DEFAULT false NOT NULL,
	"maintenance_recommendation_allowed" boolean DEFAULT false NOT NULL,
	"warranty_reminder_allowed" boolean DEFAULT false NOT NULL,
	"promotional_email_allowed" boolean DEFAULT false NOT NULL,
	"marketing_consent_source" text,
	"marketing_consent_at" timestamp with time zone,
	"marketing_withdrawn_at" timestamp with time zone,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_communication_preferences_customer_id_unique" UNIQUE("customer_id"),
	CONSTRAINT "customer_communication_preferences_marketing_withdrawn_after_consent" CHECK ("customer_communication_preferences"."marketing_withdrawn_at" is null or "customer_communication_preferences"."marketing_consent_at" is null or "customer_communication_preferences"."marketing_withdrawn_at" >= "customer_communication_preferences"."marketing_consent_at")
);
--> statement-breakpoint
ALTER TABLE "customer_communication_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"email_normalized" text NOT NULL,
	"preferred_language" text DEFAULT 'de' NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "customers_email_not_blank" CHECK (length(trim("customers"."email")) > 0),
	CONSTRAINT "customers_email_normalized_lower" CHECK ("customers"."email_normalized" = lower("customers"."email_normalized")),
	CONSTRAINT "customers_preferred_language_check" CHECK ("customers"."preferred_language" in ('de', 'en'))
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "delivery_date_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"previous_date" date NOT NULL,
	"new_date" date NOT NULL,
	"reason" text,
	"customer_notification_requested" boolean DEFAULT false NOT NULL,
	"changed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_date_history_date_changed" CHECK ("delivery_date_history"."previous_date" <> "delivery_date_history"."new_date")
);
--> statement-breakpoint
ALTER TABLE "delivery_date_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_delivery_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_event_id" text NOT NULL,
	"provider_message_id" text,
	"event_type" text NOT NULL,
	"email_outbox_id" uuid,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"processing_error" text,
	CONSTRAINT "email_delivery_events_provider_event_id_unique" UNIQUE("provider_event_id"),
	CONSTRAINT "email_delivery_events_provider_event_id_not_blank" CHECK (length(trim("email_delivery_events"."provider_event_id")) > 0),
	CONSTRAINT "email_delivery_events_event_type_not_blank" CHECK (length(trim("email_delivery_events"."event_type")) > 0)
);
--> statement-breakpoint
ALTER TABLE "email_delivery_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"customer_id" uuid,
	"email_type" "email_type" NOT NULL,
	"category" "email_category" NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"locale" text DEFAULT 'de' NOT NULL,
	"template_key" text NOT NULL,
	"template_version" integer DEFAULT 1 NOT NULL,
	"template_variables" jsonb NOT NULL,
	"subject" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "email_status" DEFAULT 'QUEUED' NOT NULL,
	"provider" text DEFAULT 'resend' NOT NULL,
	"provider_message_id" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error_code" text,
	"last_error_message" text,
	"queued_by" uuid,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"complained_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_outbox_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "email_outbox_recipient_email_not_blank" CHECK (length(trim("email_outbox"."recipient_email")) > 0),
	CONSTRAINT "email_outbox_locale_check" CHECK ("email_outbox"."locale" in ('de', 'en')),
	CONSTRAINT "email_outbox_template_key_not_blank" CHECK (length(trim("email_outbox"."template_key")) > 0),
	CONSTRAINT "email_outbox_template_version_positive" CHECK ("email_outbox"."template_version" >= 1),
	CONSTRAINT "email_outbox_subject_not_blank" CHECK (length(trim("email_outbox"."subject")) > 0),
	CONSTRAINT "email_outbox_attempt_count_nonnegative" CHECK ("email_outbox"."attempt_count" >= 0),
	CONSTRAINT "email_outbox_max_attempts_positive" CHECK ("email_outbox"."max_attempts" >= 1),
	CONSTRAINT "email_outbox_attempt_count_lte_max" CHECK ("email_outbox"."attempt_count" <= "email_outbox"."max_attempts")
);
--> statement-breakpoint
ALTER TABLE "email_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_normalized" text NOT NULL,
	"reason" text NOT NULL,
	"source" text NOT NULL,
	"provider_event_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	"removed_by" uuid,
	CONSTRAINT "email_suppressions_email_normalized_lower" CHECK ("email_suppressions"."email_normalized" = lower("email_suppressions"."email_normalized")),
	CONSTRAINT "email_suppressions_reason_not_blank" CHECK (length(trim("email_suppressions"."reason")) > 0),
	CONSTRAINT "email_suppressions_source_not_blank" CHECK (length(trim("email_suppressions"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "email_suppressions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "internal_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "internal_notes_body_not_blank" CHECK (length(trim("internal_notes"."body")) > 0)
);
--> statement-breakpoint
ALTER TABLE "internal_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_number_counters" (
	"year" integer PRIMARY KEY NOT NULL,
	"prefix" text DEFAULT 'SC' NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_number_counters_year_check" CHECK ("order_number_counters"."year" >= 2000 and "order_number_counters"."year" <= 9999),
	CONSTRAINT "order_number_counters_prefix_not_blank" CHECK (length(trim("order_number_counters"."prefix")) > 0),
	CONSTRAINT "order_number_counters_next_value_positive" CHECK ("order_number_counters"."next_value" >= 1)
);
--> statement-breakpoint
ALTER TABLE "order_number_counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"previous_status" "order_status",
	"new_status" "order_status" NOT NULL,
	"estimated_delivery_date_snapshot" date NOT NULL,
	"change_type" text NOT NULL,
	"reason" text,
	"is_override" boolean DEFAULT false NOT NULL,
	"changed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_status_history_change_type_not_blank" CHECK (length(trim("order_status_history"."change_type")) > 0)
);
--> statement-breakpoint
ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_number" text NOT NULL,
	"tracking_number" text NOT NULL,
	"status" "order_status" DEFAULT 'ORDER_RECEIVED' NOT NULL,
	"product_description" text,
	"initial_estimated_delivery_date" date NOT NULL,
	"current_estimated_delivery_date" date NOT NULL,
	"actual_delivery_date" date,
	"assigned_salesperson_id" uuid,
	"assigned_salesperson_email" text,
	"tracking_link_version" integer DEFAULT 1 NOT NULL,
	"delivered_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_tracking_number_unique" UNIQUE("tracking_number"),
	CONSTRAINT "orders_order_number_not_blank" CHECK (length(trim("orders"."order_number")) > 0),
	CONSTRAINT "orders_tracking_number_not_blank" CHECK (length(trim("orders"."tracking_number")) > 0),
	CONSTRAINT "orders_tracking_link_version_positive" CHECK ("orders"."tracking_link_version" >= 1),
	CONSTRAINT "orders_version_positive" CHECK ("orders"."version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "app_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_not_blank" CHECK (length(trim("profiles"."email")) > 0),
	CONSTRAINT "profiles_first_name_not_blank" CHECK (length(trim("profiles"."first_name")) > 0),
	CONSTRAINT "profiles_last_name_not_blank" CHECK (length(trim("profiles"."last_name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tracking_lookup_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier_hash" text,
	"email_hash" text,
	"ip_hash" text,
	"result" text NOT NULL,
	"user_agent_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracking_lookup_attempts_result_not_blank" CHECK (length(trim("tracking_lookup_attempts"."result")) > 0)
);
--> statement-breakpoint
ALTER TABLE "tracking_lookup_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_profiles_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "customer_communication_preferences" ADD CONSTRAINT "customer_communication_preferences_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "customer_communication_preferences" ADD CONSTRAINT "customer_communication_preferences_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "delivery_date_history" ADD CONSTRAINT "delivery_date_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "delivery_date_history" ADD CONSTRAINT "delivery_date_history_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_delivery_events" ADD CONSTRAINT "email_delivery_events_email_outbox_id_email_outbox_id_fk" FOREIGN KEY ("email_outbox_id") REFERENCES "public"."email_outbox"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_queued_by_profiles_id_fk" FOREIGN KEY ("queued_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "email_suppressions" ADD CONSTRAINT "email_suppressions_removed_by_profiles_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_salesperson_id_profiles_id_fk" FOREIGN KEY ("assigned_salesperson_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_order_created_at_idx" ON "audit_logs" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "customer_communication_preferences_customer_id_idx" ON "customer_communication_preferences" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customers_email_normalized_idx" ON "customers" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "customers_name_search_idx" ON "customers" USING btree (lower("first_name"),lower("last_name"));--> statement-breakpoint
CREATE INDEX "customers_archived_at_idx" ON "customers" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "delivery_date_history_order_created_at_idx" ON "delivery_date_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "email_delivery_events_provider_message_id_idx" ON "email_delivery_events" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "email_delivery_events_email_outbox_id_idx" ON "email_delivery_events" USING btree ("email_outbox_id");--> statement-breakpoint
CREATE INDEX "email_outbox_status_next_attempt_at_idx" ON "email_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "email_outbox_order_created_at_idx" ON "email_outbox" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "email_outbox_recipient_email_idx" ON "email_outbox" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "email_outbox_provider_message_id_idx" ON "email_outbox" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "email_outbox_email_type_idx" ON "email_outbox" USING btree ("email_type");--> statement-breakpoint
CREATE UNIQUE INDEX "email_suppressions_active_email_unique" ON "email_suppressions" USING btree ("email_normalized") WHERE "email_suppressions"."removed_at" is null;--> statement-breakpoint
CREATE INDEX "email_suppressions_email_normalized_idx" ON "email_suppressions" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "email_suppressions_provider_event_id_idx" ON "email_suppressions" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "internal_notes_order_created_at_idx" ON "internal_notes" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "internal_notes_deleted_at_idx" ON "internal_notes" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "order_status_history_order_created_at_idx" ON "order_status_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_status_history_new_status_idx" ON "order_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_current_estimated_delivery_date_idx" ON "orders" USING btree ("current_estimated_delivery_date");--> statement-breakpoint
CREATE INDEX "orders_assigned_salesperson_id_idx" ON "orders" USING btree ("assigned_salesperson_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_archived_at_idx" ON "orders" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "orders_active_status_idx" ON "orders" USING btree ("status") WHERE "orders"."archived_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_email_lower_unique" ON "profiles" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "profiles_is_active_idx" ON "profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tracking_lookup_attempts_identifier_hash_idx" ON "tracking_lookup_attempts" USING btree ("identifier_hash");--> statement-breakpoint
CREATE INDEX "tracking_lookup_attempts_email_hash_idx" ON "tracking_lookup_attempts" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "tracking_lookup_attempts_ip_hash_idx" ON "tracking_lookup_attempts" USING btree ("ip_hash");--> statement-breakpoint
CREATE INDEX "tracking_lookup_attempts_created_at_idx" ON "tracking_lookup_attempts" USING btree ("created_at");--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "profiles_set_updated_at"
BEFORE UPDATE ON "profiles"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "customers_set_updated_at"
BEFORE UPDATE ON "customers"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "orders_set_updated_at"
BEFORE UPDATE ON "orders"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "internal_notes_set_updated_at"
BEFORE UPDATE ON "internal_notes"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "email_outbox_set_updated_at"
BEFORE UPDATE ON "email_outbox"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "customer_communication_preferences_set_updated_at"
BEFORE UPDATE ON "customer_communication_preferences"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE TRIGGER "order_number_counters_set_updated_at"
BEFORE UPDATE ON "order_number_counters"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_updated_at"();--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."prevent_immutable_table_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION '% rows are append-only', TG_TABLE_NAME;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "order_status_history_append_only"
BEFORE UPDATE OR DELETE ON "order_status_history"
FOR EACH ROW
EXECUTE FUNCTION "public"."prevent_immutable_table_mutation"();--> statement-breakpoint
CREATE TRIGGER "delivery_date_history_append_only"
BEFORE UPDATE OR DELETE ON "delivery_date_history"
FOR EACH ROW
EXECUTE FUNCTION "public"."prevent_immutable_table_mutation"();--> statement-breakpoint
CREATE TRIGGER "audit_logs_append_only"
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION "public"."prevent_immutable_table_mutation"();
