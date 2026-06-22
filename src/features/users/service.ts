import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { appRoleValues, type AppRole } from "@/db/schema/enums";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

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

const createMemberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().min(1, "Email is required."),
  role: z.enum(appRoleValues),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") {
      (fieldErrors[key] ??= []).push(issue.message);
    }
  }
  return fieldErrors;
}

// Creates the Supabase auth user (service role) and the matching profile row. The
// profile id MUST equal the auth user id, which is how the app links the two.
export async function createTeamMember(input: unknown) {
  const parsed = createMemberSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("User data is invalid.", toFieldErrors(parsed.error));
  }

  if (!z.email().safeParse(parsed.data.email).success) {
    throw new ValidationError("User data is invalid.", { email: ["Email is invalid."] });
  }

  const email = parsed.data.email.toLowerCase();
  const db = getDb();
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(sql`lower(${profiles.email})`, email))
    .limit(1);

  if (existing) {
    throw new ConflictError("A user with this email already exists.");
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true
  });

  if (error || !data.user) {
    throw new ValidationError(error?.message ?? "The auth account could not be created.");
  }

  try {
    await db.insert(profiles).values({
      id: data.user.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      role: parsed.data.role,
      isActive: true
    });
  } catch (insertError) {
    // Keep auth and profiles in sync: drop the auth user if the profile insert fails.
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    throw insertError;
  }
}

export async function updateMemberName(userId: string, firstName: string, lastName: string) {
  if (!firstName.trim() || !lastName.trim()) {
    throw new ValidationError("First and last name are required.");
  }

  const db = getDb();
  await getMember(db, userId);
  await db
    .update(profiles)
    .set({ firstName: firstName.trim(), lastName: lastName.trim(), updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}
