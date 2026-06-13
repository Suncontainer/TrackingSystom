import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  appRoleValues,
  auditLogs,
  businessTables,
  customerCommunicationPreferences,
  customers,
  deliveryDateHistory,
  emailCategoryValues,
  emailDeliveryEvents,
  emailOutbox,
  emailStatusValues,
  emailSuppressions,
  emailTypeValues,
  internalNotes,
  orderNumberCounters,
  orders,
  orderStatusHistory,
  orderStatusValues,
  profiles,
  trackingLookupAttempts
} from "@/db/schema";

const tableObjects = [
  profiles,
  customers,
  orders,
  orderStatusHistory,
  deliveryDateHistory,
  internalNotes,
  emailOutbox,
  emailDeliveryEvents,
  customerCommunicationPreferences,
  emailSuppressions,
  auditLogs,
  trackingLookupAttempts,
  orderNumberCounters
] as const;

function readInitialMigration() {
  const migrationsDir = join(process.cwd(), "src/db/migrations");
  const migrationFile = readdirSync(migrationsDir).find((file) => file.endsWith(".sql"));

  if (!migrationFile) {
    throw new Error("No SQL migration file found.");
  }

  return readFileSync(join(migrationsDir, migrationFile), "utf8");
}

describe("database schema foundation", () => {
  it("defines the approved enum values", () => {
    expect(appRoleValues).toEqual(["SUPER_ADMIN", "ADMIN", "SALES", "READ_ONLY"]);
    expect(orderStatusValues).toEqual([
      "ORDER_RECEIVED",
      "IN_PRODUCTION",
      "IN_TRANSIT",
      "DELIVERED"
    ]);
    expect(emailStatusValues).toContain("QUEUED");
    expect(emailStatusValues).toContain("SUPPRESSED");
    expect(emailCategoryValues).toEqual(["TRANSACTIONAL", "OPTIONAL_SERVICE", "MARKETING", "INTERNAL"]);
    expect(emailTypeValues).toContain("SALESPERSON_NEW_ORDER");
    expect(emailTypeValues).toContain("DELIVERY_DATE_UPDATED");
  });

  it("enables RLS metadata on every business table", () => {
    const configuredTables = tableObjects.map((table) => getTableConfig(table));

    expect(configuredTables.map((table) => table.name).sort()).toEqual([...businessTables].sort());
    expect(configuredTables.every((table) => table.enableRLS)).toBe(true);
  });

  it("creates required unique constraints and indexes in the migration", () => {
    const migration = readInitialMigration();

    expect(migration).toContain('CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")');
    expect(migration).toContain('CONSTRAINT "orders_tracking_number_unique" UNIQUE("tracking_number")');
    expect(migration).toContain(
      'CONSTRAINT "email_outbox_idempotency_key_unique" UNIQUE("idempotency_key")'
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "email_suppressions_active_email_unique" ON "email_suppressions"'
    );
    expect(migration).toContain('CREATE UNIQUE INDEX "profiles_email_lower_unique"');
    expect(migration).toContain('CREATE INDEX "orders_active_status_idx"');
  });

  it("locks public database access down with RLS and no permissive policies", () => {
    const migration = readInitialMigration();

    for (const table of businessTables) {
      expect(migration).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }

    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
  });

  it("adds Supabase auth linkage, timestamp triggers, and append-only protections", () => {
    const migration = readInitialMigration();

    expect(migration).toContain('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    expect(migration).toContain('REFERENCES "auth"."users"("id")');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION "public"."set_updated_at"()');
    expect(migration).toContain('CREATE TRIGGER "orders_set_updated_at"');
    expect(migration).toContain('CREATE TRIGGER "order_status_history_append_only"');
    expect(migration).toContain('CREATE TRIGGER "delivery_date_history_append_only"');
    expect(migration).toContain('CREATE TRIGGER "audit_logs_append_only"');
  });
});
