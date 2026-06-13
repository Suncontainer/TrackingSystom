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

export function createDatabaseClient(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 10,
    prepare: false
  });

  return drizzle(client, { schema });
}

export function getDb() {
  if (!database) {
    sqlClient = postgres(getDatabaseUrl(), {
      max: 10,
      prepare: false
    });
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
