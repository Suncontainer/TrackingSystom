import { describe, expect, it } from "vitest";

import { assertCanSeed } from "@/db/seed-safety";

describe("seed safety", () => {
  it("refuses to run without a database URL", () => {
    expect(() =>
      assertCanSeed({
        NODE_ENV: "development",
        SEED_SUPER_ADMIN_AUTH_USER_ID: "00000000-0000-4000-8000-000000000000"
      })
    ).toThrow("DATABASE_URL is required");
  });

  it("refuses to run without a real Supabase Auth user id", () => {
    expect(() =>
      assertCanSeed({
        NODE_ENV: "development",
        DATABASE_URL: "postgres://example"
      })
    ).toThrow("SEED_SUPER_ADMIN_AUTH_USER_ID");
  });

  it("allows development seed configuration", () => {
    expect(() =>
      assertCanSeed({
        NODE_ENV: "development",
        DATABASE_URL: "postgres://example",
        SEED_SUPER_ADMIN_AUTH_USER_ID: "00000000-0000-4000-8000-000000000000"
      })
    ).not.toThrow();
  });

  it("refuses production unless the explicit override is supplied", () => {
    expect(() =>
      assertCanSeed({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example",
        SEED_SUPER_ADMIN_AUTH_USER_ID: "00000000-0000-4000-8000-000000000000"
      })
    ).toThrow("Refusing to seed production");

    expect(() =>
      assertCanSeed({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://example",
        SEED_SUPER_ADMIN_AUTH_USER_ID: "00000000-0000-4000-8000-000000000000",
        SEED_ALLOW_PRODUCTION: "I_UNDERSTAND_THIS_WRITES_SEED_DATA"
      })
    ).not.toThrow();
  });
});
