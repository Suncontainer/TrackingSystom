import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

import {
  appRoleEnum,
  emailCategoryEnum,
  emailStatusEnum,
  emailTypeEnum,
  orderStatusEnum
} from "./enums";
import { createdAtOnlyColumn, primaryUuid, timestampColumns, type JsonRecord } from "./shared";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    role: appRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestampColumns()
  },
  (table) => [
    uniqueIndex("profiles_email_lower_unique").on(sql`lower(${table.email})`),
    index("profiles_role_idx").on(table.role),
    index("profiles_is_active_idx").on(table.isActive),
    check("profiles_email_not_blank", sql`length(trim(${table.email})) > 0`),
    check("profiles_first_name_not_blank", sql`length(trim(${table.firstName})) > 0`),
    check("profiles_last_name_not_blank", sql`length(trim(${table.lastName})) > 0`)
  ]
).enableRLS();

export const customers = pgTable(
  "customers",
  {
    id: primaryUuid(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    preferredLanguage: text("preferred_language").notNull().default("de"),
    phone: text("phone"),
    ...timestampColumns(),
    archivedAt: timestamp("archived_at", { withTimezone: true })
  },
  (table) => [
    index("customers_email_normalized_idx").on(table.emailNormalized),
    index("customers_name_search_idx").on(
      sql`lower(${table.firstName})`,
      sql`lower(${table.lastName})`
    ),
    index("customers_archived_at_idx").on(table.archivedAt),
    check("customers_email_not_blank", sql`length(trim(${table.email})) > 0`),
    check("customers_email_normalized_lower", sql`${table.emailNormalized} = lower(${table.emailNormalized})`),
    check("customers_preferred_language_check", sql`${table.preferredLanguage} in ('de', 'en')`)
  ]
).enableRLS();

export const orders = pgTable(
  "orders",
  {
    id: primaryUuid(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict", onUpdate: "cascade" }),
    orderNumber: text("order_number").notNull().unique("orders_order_number_unique"),
    trackingNumber: text("tracking_number").notNull().unique("orders_tracking_number_unique"),
    status: orderStatusEnum("status").notNull().default("ORDER_RECEIVED"),
    productDescription: text("product_description"),
    initialEstimatedDeliveryDate: date("initial_estimated_delivery_date").notNull(),
    currentEstimatedDeliveryDate: date("current_estimated_delivery_date").notNull(),
    actualDeliveryDate: date("actual_delivery_date"),
    assignedSalespersonId: uuid("assigned_salesperson_id").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    assignedSalespersonEmail: text("assigned_salesperson_email"),
    trackingLinkVersion: integer("tracking_link_version").notNull().default(1),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    ...timestampColumns()
  },
  (table) => [
    index("orders_status_idx").on(table.status),
    index("orders_current_estimated_delivery_date_idx").on(table.currentEstimatedDeliveryDate),
    index("orders_assigned_salesperson_id_idx").on(table.assignedSalespersonId),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_archived_at_idx").on(table.archivedAt),
    index("orders_active_status_idx").on(table.status).where(sql`${table.archivedAt} is null`),
    check("orders_order_number_not_blank", sql`length(trim(${table.orderNumber})) > 0`),
    check("orders_tracking_number_not_blank", sql`length(trim(${table.trackingNumber})) > 0`),
    check("orders_tracking_link_version_positive", sql`${table.trackingLinkVersion} >= 1`),
    check("orders_version_positive", sql`${table.version} >= 1`)
  ]
).enableRLS();

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: primaryUuid(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
    previousStatus: orderStatusEnum("previous_status"),
    newStatus: orderStatusEnum("new_status").notNull(),
    estimatedDeliveryDateSnapshot: date("estimated_delivery_date_snapshot").notNull(),
    changeType: text("change_type").notNull(),
    reason: text("reason"),
    isOverride: boolean("is_override").notNull().default(false),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: createdAtOnlyColumn()
  },
  (table) => [
    index("order_status_history_order_created_at_idx").on(table.orderId, table.createdAt),
    index("order_status_history_new_status_idx").on(table.newStatus),
    check("order_status_history_change_type_not_blank", sql`length(trim(${table.changeType})) > 0`)
  ]
).enableRLS();

export const deliveryDateHistory = pgTable(
  "delivery_date_history",
  {
    id: primaryUuid(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
    previousDate: date("previous_date").notNull(),
    newDate: date("new_date").notNull(),
    reason: text("reason"),
    customerNotificationRequested: boolean("customer_notification_requested").notNull().default(false),
    changedBy: uuid("changed_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    createdAt: createdAtOnlyColumn()
  },
  (table) => [
    index("delivery_date_history_order_created_at_idx").on(table.orderId, table.createdAt),
    check("delivery_date_history_date_changed", sql`${table.previousDate} <> ${table.newDate}`)
  ]
).enableRLS();

export const internalNotes = pgTable(
  "internal_notes",
  {
    id: primaryUuid(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
    body: text("body").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict", onUpdate: "cascade" }),
    updatedBy: uuid("updated_by").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    ...timestampColumns(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (table) => [
    index("internal_notes_order_created_at_idx").on(table.orderId, table.createdAt),
    index("internal_notes_deleted_at_idx").on(table.deletedAt),
    check("internal_notes_body_not_blank", sql`length(trim(${table.body})) > 0`)
  ]
).enableRLS();

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: primaryUuid(),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    emailType: emailTypeEnum("email_type").notNull(),
    category: emailCategoryEnum("category").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    recipientName: text("recipient_name"),
    locale: text("locale").notNull().default("de"),
    templateKey: text("template_key").notNull(),
    templateVersion: integer("template_version").notNull().default(1),
    templateVariables: jsonb("template_variables").$type<JsonRecord>().notNull(),
    subject: text("subject").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique("email_outbox_idempotency_key_unique"),
    status: emailStatusEnum("status").notNull().default("QUEUED"),
    provider: text("provider").notNull().default("resend"),
    providerMessageId: text("provider_message_id"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    queuedBy: uuid("queued_by").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    bouncedAt: timestamp("bounced_at", { withTimezone: true }),
    complainedAt: timestamp("complained_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    ...timestampColumns()
  },
  (table) => [
    index("email_outbox_status_next_attempt_at_idx").on(table.status, table.nextAttemptAt),
    index("email_outbox_order_created_at_idx").on(table.orderId, table.createdAt),
    index("email_outbox_recipient_email_idx").on(table.recipientEmail),
    index("email_outbox_provider_message_id_idx").on(table.providerMessageId),
    index("email_outbox_email_type_idx").on(table.emailType),
    check("email_outbox_recipient_email_not_blank", sql`length(trim(${table.recipientEmail})) > 0`),
    check("email_outbox_locale_check", sql`${table.locale} in ('de', 'en')`),
    check("email_outbox_template_key_not_blank", sql`length(trim(${table.templateKey})) > 0`),
    check("email_outbox_template_version_positive", sql`${table.templateVersion} >= 1`),
    check("email_outbox_subject_not_blank", sql`length(trim(${table.subject})) > 0`),
    check("email_outbox_attempt_count_nonnegative", sql`${table.attemptCount} >= 0`),
    check("email_outbox_max_attempts_positive", sql`${table.maxAttempts} >= 1`),
    check("email_outbox_attempt_count_lte_max", sql`${table.attemptCount} <= ${table.maxAttempts}`)
  ]
).enableRLS();

export const emailDeliveryEvents = pgTable(
  "email_delivery_events",
  {
    id: primaryUuid(),
    providerEventId: text("provider_event_id").notNull().unique("email_delivery_events_provider_event_id_unique"),
    providerMessageId: text("provider_message_id"),
    eventType: text("event_type").notNull(),
    emailOutboxId: uuid("email_outbox_id").references(() => emailOutbox.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    payload: jsonb("payload").$type<JsonRecord>().notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error")
  },
  (table) => [
    index("email_delivery_events_provider_message_id_idx").on(table.providerMessageId),
    index("email_delivery_events_email_outbox_id_idx").on(table.emailOutboxId),
    check("email_delivery_events_provider_event_id_not_blank", sql`length(trim(${table.providerEventId})) > 0`),
    check("email_delivery_events_event_type_not_blank", sql`length(trim(${table.eventType})) > 0`)
  ]
).enableRLS();

export const customerCommunicationPreferences = pgTable(
  "customer_communication_preferences",
  {
    id: primaryUuid(),
    customerId: uuid("customer_id")
      .notNull()
      .unique("customer_communication_preferences_customer_id_unique")
      .references(() => customers.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reviewRequestAllowed: boolean("review_request_allowed").notNull().default(false),
    satisfactionSurveyAllowed: boolean("satisfaction_survey_allowed").notNull().default(false),
    maintenanceRecommendationAllowed: boolean("maintenance_recommendation_allowed").notNull().default(false),
    warrantyReminderAllowed: boolean("warranty_reminder_allowed").notNull().default(false),
    promotionalEmailAllowed: boolean("promotional_email_allowed").notNull().default(false),
    marketingConsentSource: text("marketing_consent_source"),
    marketingConsentAt: timestamp("marketing_consent_at", { withTimezone: true }),
    marketingWithdrawnAt: timestamp("marketing_withdrawn_at", { withTimezone: true }),
    updatedBy: uuid("updated_by").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    ...timestampColumns()
  },
  (table) => [
    index("customer_communication_preferences_customer_id_idx").on(table.customerId),
    check(
      "customer_communication_preferences_marketing_withdrawn_after_consent",
      sql`${table.marketingWithdrawnAt} is null or ${table.marketingConsentAt} is null or ${table.marketingWithdrawnAt} >= ${table.marketingConsentAt}`
    )
  ]
).enableRLS();

export const emailSuppressions = pgTable(
  "email_suppressions",
  {
    id: primaryUuid(),
    emailNormalized: text("email_normalized").notNull(),
    reason: text("reason").notNull(),
    source: text("source").notNull(),
    providerEventId: text("provider_event_id"),
    createdAt: createdAtOnlyColumn(),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    removedBy: uuid("removed_by").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    })
  },
  (table) => [
    uniqueIndex("email_suppressions_active_email_unique")
      .on(table.emailNormalized)
      .where(sql`${table.removedAt} is null`),
    index("email_suppressions_email_normalized_idx").on(table.emailNormalized),
    index("email_suppressions_provider_event_id_idx").on(table.providerEventId),
    check("email_suppressions_email_normalized_lower", sql`${table.emailNormalized} = lower(${table.emailNormalized})`),
    check("email_suppressions_reason_not_blank", sql`length(trim(${table.reason})) > 0`),
    check("email_suppressions_source_not_blank", sql`length(trim(${table.source})) > 0`)
  ]
).enableRLS();

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: primaryUuid(),
    actorUserId: uuid("actor_user_id").references(() => profiles.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    beforeData: jsonb("before_data").$type<JsonRecord>(),
    afterData: jsonb("after_data").$type<JsonRecord>(),
    metadata: jsonb("metadata").$type<JsonRecord>(),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
    createdAt: createdAtOnlyColumn()
  },
  (table) => [
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_order_created_at_idx").on(table.orderId, table.createdAt),
    index("audit_logs_created_at_idx").on(table.createdAt),
    check("audit_logs_action_not_blank", sql`length(trim(${table.action})) > 0`),
    check("audit_logs_entity_type_not_blank", sql`length(trim(${table.entityType})) > 0`)
  ]
).enableRLS();

export const trackingLookupAttempts = pgTable(
  "tracking_lookup_attempts",
  {
    id: primaryUuid(),
    identifierHash: text("identifier_hash"),
    emailHash: text("email_hash"),
    ipHash: text("ip_hash"),
    result: text("result").notNull(),
    userAgentHash: text("user_agent_hash"),
    createdAt: createdAtOnlyColumn()
  },
  (table) => [
    index("tracking_lookup_attempts_identifier_hash_idx").on(table.identifierHash),
    index("tracking_lookup_attempts_email_hash_idx").on(table.emailHash),
    index("tracking_lookup_attempts_ip_hash_idx").on(table.ipHash),
    index("tracking_lookup_attempts_created_at_idx").on(table.createdAt),
    check("tracking_lookup_attempts_result_not_blank", sql`length(trim(${table.result})) > 0`)
  ]
).enableRLS();

export const orderNumberCounters = pgTable(
  "order_number_counters",
  {
    year: integer("year").primaryKey(),
    prefix: text("prefix").notNull().default("SC"),
    nextValue: integer("next_value").notNull().default(1),
    ...timestampColumns()
  },
  (table) => [
    check("order_number_counters_year_check", sql`${table.year} >= 2000 and ${table.year} <= 9999`),
    check("order_number_counters_prefix_not_blank", sql`length(trim(${table.prefix})) > 0`),
    check("order_number_counters_next_value_positive", sql`${table.nextValue} >= 1`)
  ]
).enableRLS();

export const businessTables = [
  "profiles",
  "customers",
  "orders",
  "order_status_history",
  "delivery_date_history",
  "internal_notes",
  "email_outbox",
  "email_delivery_events",
  "customer_communication_preferences",
  "email_suppressions",
  "audit_logs",
  "tracking_lookup_attempts",
  "order_number_counters"
] as const;
