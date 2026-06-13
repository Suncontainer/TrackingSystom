export const productionSeedOverride = "I_UNDERSTAND_THIS_WRITES_SEED_DATA";

export function assertCanSeed(env: NodeJS.ProcessEnv) {
  const isProduction = env.NODE_ENV === "production" || env.VERCEL_ENV === "production";

  if (isProduction && env.SEED_ALLOW_PRODUCTION !== productionSeedOverride) {
    throw new Error("Refusing to seed production without the explicit production seed override.");
  }

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed data.");
  }

  if (!env.SEED_SUPER_ADMIN_AUTH_USER_ID) {
    throw new Error("SEED_SUPER_ADMIN_AUTH_USER_ID must reference an existing Supabase Auth user.");
  }
}
