import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/config/env-core";

import * as schema from "./schema";

type SqlClient = ReturnType<typeof postgres>;
type Database = ReturnType<typeof drizzle<typeof schema>>;

let sqlClient: SqlClient | null = null;
let database: Database | null = null;

export function getDatabaseUrl() {
  const env = getServerEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  return env.DATABASE_URL;
}

// On Vercel serverless each function instance should hold very few connections so
// the shared Supabase/pgBouncer pooler is not exhausted on the free tier. Locally a
// slightly larger pool keeps dev throughput healthy.
const isServerless = Boolean(process.env.VERCEL);

const poolOptions = {
  max: isServerless ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // pgBouncer transaction pooling does not support prepared statements.
  prepare: false
} as const;

export function createDatabaseClient(databaseUrl: string) {
  const client = postgres(databaseUrl, poolOptions);

  return drizzle(client, { schema });
}

export function getDb() {
  if (!database) {
    sqlClient = postgres(getDatabaseUrl(), poolOptions);
    database = drizzle(sqlClient, { schema });
  }

  return database;
}

export async function closeDb() {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
    database = null;
  }
}
