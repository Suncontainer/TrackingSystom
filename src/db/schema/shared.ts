import { timestamp, uuid } from "drizzle-orm/pg-core";

export type JsonRecord = Record<string, unknown>;

export function primaryUuid() {
  return uuid("id").primaryKey().defaultRandom();
}

export function timestampColumns() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  };
}

export function createdAtOnlyColumn() {
  return timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
}
