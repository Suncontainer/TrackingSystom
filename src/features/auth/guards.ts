import "server-only";

import { and, eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

import { getDb } from "@/db/client";
import { orders, type AppRole } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePublicConfigError } from "@/lib/supabase/public-config";

import { AuthenticationError, AuthorizationError } from "./errors";
import { getDevAdminProfile } from "./dev-login";
import { assertCan, type AppPermission } from "./permissions";
import { getProfileByAuthUserId } from "./profile";
import { assertActiveProfile } from "./profile-state";

function isMissingDatabaseConfiguration(error: unknown) {
  return error instanceof Error && error.message.includes("DATABASE_URL is required");
}

function normalizeAuthConfigurationError(error: unknown): never {
  if (error instanceof SupabasePublicConfigError || isMissingDatabaseConfiguration(error)) {
    throw new AuthenticationError("Authentication is not configured.", "AUTH_UNCONFIGURED");
  }

  throw error;
}

async function createAuthClient() {
  try {
    return await createSupabaseServerClient();
  } catch (error) {
    normalizeAuthConfigurationError(error);
  }
}

export async function getCurrentAuthUser() {
  const supabase = await createAuthClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentAuthUser();

  if (!user) {
    throw new AuthenticationError("A valid employee session is required.", "AUTH_REQUIRED");
  }

  return user;
}

export async function getCurrentProfile() {
  const devProfile = await getDevAdminProfile();

  if (devProfile) {
    return devProfile;
  }

  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  try {
    return await getProfileByAuthUserId(user.id);
  } catch (error) {
    normalizeAuthConfigurationError(error);
  }
}

export async function requireActiveProfile() {
  const devProfile = await getDevAdminProfile();

  if (devProfile) {
    return devProfile;
  }

  const user = await requireUser();

  try {
    const profile = await getProfileByAuthUserId(user.id);

    return assertActiveProfile(profile);
  } catch (error) {
    normalizeAuthConfigurationError(error);
  }
}

export async function requireRole(roles: readonly AppRole[]) {
  const profile = await requireActiveProfile();

  if (!roles.includes(profile.role)) {
    throw new AuthorizationError("Employee role is not allowed for this operation.", "ROLE_REQUIRED");
  }

  return profile;
}

export async function requirePermission(permission: AppPermission) {
  const profile = await requireActiveProfile();
  assertCan(profile.role, permission);

  return profile;
}

export async function requireOrderAccess(orderId: string) {
  const profile = await requirePermission("orders:read");

  if (profile.role !== "SALES") {
    return profile;
  }

  const db = getDb();
  const [assignedOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.assignedSalespersonId, profile.id)))
    .limit(1);

  if (!assignedOrder) {
    throw new AuthorizationError("Sales users may only access assigned orders.", "ORDER_ACCESS_REQUIRED");
  }

  return profile;
}
