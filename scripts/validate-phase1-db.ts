import { readFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

import { businessTables } from "@/db/schema";

const validationUserId = "90000000-0000-4000-8000-000000000001";
const validationCustomerId = "91000000-0000-4000-8000-000000000001";
const validationOrderId = "92000000-0000-4000-8000-000000000001";

function getValidationDatabaseUrl() {
  const url = process.env.PHASE1_DATABASE_URL ?? process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error("PHASE1_DATABASE_URL, DATABASE_DIRECT_URL, or DATABASE_URL is required.");
  }

  return url;
}

function readInitialMigrationStatements() {
  const migrationPath = join(process.cwd(), "src/db/migrations/0000_slippery_riptide.sql");
  const migration = readFileSync(migrationPath, "utf8");

  return migration
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function prepareSupabaseAuthStub(sql: postgres.Sql) {
  await sql.unsafe('create schema if not exists "auth"');
  await sql.unsafe(`
    create table if not exists "auth"."users" (
      "id" uuid primary key,
      "email" text,
      "created_at" timestamp with time zone default now()
    )
  `);
}

async function applyMigration(sql: postgres.Sql) {
  for (const statement of readInitialMigrationStatements()) {
    await sql.unsafe(statement);
  }
}

async function assertRlsEnabled(sql: postgres.Sql) {
  const rows = await sql<{ relname: string; relrowsecurity: boolean }[]>`
    select c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(${businessTables})
  `;
  const rlsByTable = new Map(rows.map((row) => [row.relname, row.relrowsecurity]));

  for (const table of businessTables) {
    if (rlsByTable.get(table) !== true) {
      throw new Error(`Expected RLS to be enabled for ${table}.`);
    }
  }
}

async function seedTransaction(sql: postgres.Sql) {
  await sql.begin(async (tx) => {
    await tx`
      insert into "auth"."users" ("id", "email")
      values (${validationUserId}, 'phase1.admin@example.com')
      on conflict ("id") do nothing
    `;
    await tx`
      insert into "profiles" ("id", "first_name", "last_name", "email", "role")
      values (${validationUserId}, 'Phase', 'Validator', 'phase1.admin@example.com', 'SUPER_ADMIN')
    `;
    await tx`
      insert into "customers" ("id", "first_name", "last_name", "email", "email_normalized", "preferred_language")
      values (${validationCustomerId}, 'Phase', 'Customer', 'phase1.customer@example.com', 'phase1.customer@example.com', 'de')
    `;
    await tx`
      insert into "orders" (
        "id",
        "customer_id",
        "order_number",
        "tracking_number",
        "status",
        "initial_estimated_delivery_date",
        "current_estimated_delivery_date",
        "created_by",
        "updated_by"
      )
      values (
        ${validationOrderId},
        ${validationCustomerId},
        'SC-2099-000001',
        'SCVALIDTRACK1',
        'ORDER_RECEIVED',
        '2099-01-15',
        '2099-01-15',
        ${validationUserId},
        ${validationUserId}
      )
    `;
    await tx`
      insert into "order_status_history" (
        "order_id",
        "previous_status",
        "new_status",
        "estimated_delivery_date_snapshot",
        "change_type",
        "changed_by"
      )
      values (${validationOrderId}, null, 'ORDER_RECEIVED', '2099-01-15', 'INITIAL', ${validationUserId})
    `;
  });

  const insertedOrders = await sql<{ count: string }[]>`
    select count(*)::text as count from "orders" where "id" = ${validationOrderId}
  `;

  if (insertedOrders[0]?.count !== "1") {
    throw new Error("Transaction validation order was not committed.");
  }
}

async function assertUniqueConstraints(sql: postgres.Sql) {
  try {
    await sql`
      insert into "orders" (
        "customer_id",
        "order_number",
        "tracking_number",
        "status",
        "initial_estimated_delivery_date",
        "current_estimated_delivery_date",
        "created_by",
        "updated_by"
      )
      values (
        ${validationCustomerId},
        'SC-2099-000001',
        'SCVALIDTRACK2',
        'ORDER_RECEIVED',
        '2099-01-15',
        '2099-01-15',
        ${validationUserId},
        ${validationUserId}
      )
    `;
    throw new Error("Duplicate order_number insert unexpectedly succeeded.");
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code !== "23505") {
      throw error;
    }
  }

  try {
    await sql`
      insert into "orders" (
        "customer_id",
        "order_number",
        "tracking_number",
        "status",
        "initial_estimated_delivery_date",
        "current_estimated_delivery_date",
        "created_by",
        "updated_by"
      )
      values (
        ${validationCustomerId},
        'SC-2099-000002',
        'SCVALIDTRACK1',
        'ORDER_RECEIVED',
        '2099-01-15',
        '2099-01-15',
        ${validationUserId},
        ${validationUserId}
      )
    `;
    throw new Error("Duplicate tracking_number insert unexpectedly succeeded.");
  } catch (error) {
    const code = (error as { code?: string }).code;

    if (code !== "23505") {
      throw error;
    }
  }
}

async function main() {
  const sql = postgres(getValidationDatabaseUrl(), {
    max: 1,
    prepare: false,
    connect_timeout: 10
  });

  try {
    await prepareSupabaseAuthStub(sql);
    await applyMigration(sql);
    await assertRlsEnabled(sql);
    await seedTransaction(sql);
    await assertUniqueConstraints(sql);
    console.info("Phase 1 database validation passed.");
  } finally {
    await sql.end({ timeout: 3 });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
