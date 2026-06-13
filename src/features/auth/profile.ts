import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";

export async function getProfileByAuthUserId(authUserId: string) {
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, authUserId)).limit(1);

  return profile ?? null;
}

export async function updateProfileLastLoginAt(authUserId: string) {
  const db = getDb();

  await db
    .update(profiles)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(profiles.id, authUserId));
}
