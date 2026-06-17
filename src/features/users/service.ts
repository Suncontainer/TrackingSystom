import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { appRoleValues, type AppRole } from "@/db/schema/enums";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

export type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AppRole;
  isActive: boolean;
  lastLoginAt: Date | null;
};

function isAppRole(value: string): value is AppRole {
  return (appRoleValues as readonly string[]).includes(value);
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const db = getDb();

  return db
    .select({
      id: profiles.id,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
      role: profiles.role,
      isActive: profiles.isActive,
      lastLoginAt: profiles.lastLoginAt
    })
    .from(profiles)
    .orderBy(asc(profiles.firstName), asc(profiles.lastName));
}

async function getMember(db: ReturnType<typeof getDb>, userId: string) {
  const [member] = await db
    .select({ id: profiles.id, email: profiles.email, role: profiles.role, isActive: profiles.isActive })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!member) {
    throw new NotFoundError("User not found.");
  }

  return member;
}

export async function updateMemberRole(actorId: string, userId: string, role: string) {
  if (!isAppRole(role)) {
    throw new ValidationError("Invalid role selected.");
  }

  const db = getDb();
  const member = await getMember(db, userId);

  // Guard against the last super admin demoting themselves out of access.
  if (member.id === actorId && member.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    throw new ConflictError("You cannot remove your own super admin role.");
  }

  await db
    .update(profiles)
    .set({ role, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}

export async function setMemberActive(actorId: string, userId: string, isActive: boolean) {
  const db = getDb();
  const member = await getMember(db, userId);

  if (member.id === actorId && !isActive) {
    throw new ConflictError("You cannot deactivate your own account.");
  }

  await db
    .update(profiles)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  return member.email;
}

export async function getMemberEmail(userId: string) {
  const db = getDb();
  const member = await getMember(db, userId);
  return member.email;
}
