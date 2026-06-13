import { eq } from "drizzle-orm";
import { z } from "zod";

import { closeDb, getDb } from "@/db/client-core";
import { profiles } from "@/db/schema";

const createAdminEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CREATE_ADMIN_ALLOW_PRODUCTION: z.string().trim().optional(),
  CREATE_ADMIN_AUTH_USER_ID: z.uuid(),
  CREATE_ADMIN_EMAIL: z.email(),
  CREATE_ADMIN_FIRST_NAME: z.string().trim().min(1),
  CREATE_ADMIN_LAST_NAME: z.string().trim().min(1),
  CREATE_ADMIN_ROLE: z.enum(["SUPER_ADMIN", "ADMIN"]).default("SUPER_ADMIN")
});

function assertCanCreateAdmin(env: z.infer<typeof createAdminEnvSchema>) {
  if (
    env.NODE_ENV === "production" &&
    env.CREATE_ADMIN_ALLOW_PRODUCTION !== "I_UNDERSTAND_THIS_WRITES_ADMIN_PROFILE"
  ) {
    throw new Error("Refusing to create an admin profile in production without CREATE_ADMIN_ALLOW_PRODUCTION.");
  }
}

async function main() {
  const env = createAdminEnvSchema.parse(process.env);
  assertCanCreateAdmin(env);

  const db = getDb();
  const now = new Date();
  const [existingProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, env.CREATE_ADMIN_AUTH_USER_ID))
    .limit(1);

  if (existingProfile) {
    await db
      .update(profiles)
      .set({
        email: env.CREATE_ADMIN_EMAIL,
        firstName: env.CREATE_ADMIN_FIRST_NAME,
        isActive: true,
        lastName: env.CREATE_ADMIN_LAST_NAME,
        role: env.CREATE_ADMIN_ROLE,
        updatedAt: now
      })
      .where(eq(profiles.id, env.CREATE_ADMIN_AUTH_USER_ID));
  } else {
    await db.insert(profiles).values({
      createdAt: now,
      email: env.CREATE_ADMIN_EMAIL,
      firstName: env.CREATE_ADMIN_FIRST_NAME,
      id: env.CREATE_ADMIN_AUTH_USER_ID,
      isActive: true,
      lastName: env.CREATE_ADMIN_LAST_NAME,
      role: env.CREATE_ADMIN_ROLE,
      updatedAt: now
    });
  }

  console.log(`Admin profile ${existingProfile ? "updated" : "created"} for ${env.CREATE_ADMIN_EMAIL}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Failed to create admin profile.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
