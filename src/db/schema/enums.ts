import { pgEnum } from "drizzle-orm/pg-core";

export const appRoleValues = ["SUPER_ADMIN", "ADMIN", "SALES", "READ_ONLY"] as const;
export const orderStatusValues = [
  "ORDER_CONFIRMED",
  "PROCUREMENT",
  "IN_PRODUCTION",
  "IN_TRANSIT",
  "DELIVERED"
] as const;
export const emailStatusValues = [
  "QUEUED",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "BOUNCED",
  "COMPLAINED",
  "FAILED",
  "SUPPRESSED",
  "SIMULATED"
] as const;
export const emailCategoryValues = [
  "TRANSACTIONAL",
  "OPTIONAL_SERVICE",
  "MARKETING",
  "INTERNAL"
] as const;
export const emailTypeValues = [
  "ORDER_RECEIVED",
  "PROCUREMENT_STARTED",
  "PRODUCTION_STARTED",
  "IN_TRANSIT",
  "DELIVERED",
  "SALESPERSON_NEW_ORDER",
  "DELIVERY_DATE_UPDATED",
  "REVIEW_REQUEST",
  "SATISFACTION_SURVEY",
  "MAINTENANCE_RECOMMENDATION",
  "WARRANTY_REMINDER",
  "PROMOTIONAL",
  "ADMIN_TEMPLATE"
] as const;

export const appRoleEnum = pgEnum("app_role", appRoleValues);
export const orderStatusEnum = pgEnum("order_status", orderStatusValues);
export const emailStatusEnum = pgEnum("email_status", emailStatusValues);
export const emailCategoryEnum = pgEnum("email_category", emailCategoryValues);
export const emailTypeEnum = pgEnum("email_type", emailTypeValues);

export type AppRole = (typeof appRoleValues)[number];
export type DbOrderStatus = (typeof orderStatusValues)[number];
export type EmailStatus = (typeof emailStatusValues)[number];
export type EmailCategory = (typeof emailCategoryValues)[number];
export type EmailType = (typeof emailTypeValues)[number];
