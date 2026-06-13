import "server-only";

import { redirect } from "next/navigation";

import { routes } from "@/config/routes";

import { AuthenticationError, AuthorizationError } from "./errors";
import { requirePermission } from "./guards";

function getLoginReason(error: unknown) {
  if (error instanceof AuthenticationError) {
    if (error.code === "AUTH_UNCONFIGURED") {
      return "auth_unconfigured";
    }

    if (error.code === "PROFILE_MISSING") {
      return "profile_missing";
    }

    return "auth_required";
  }

  if (error instanceof AuthorizationError) {
    if (error.code === "INACTIVE_PROFILE") {
      return "inactive";
    }

    return "not_authorized";
  }

  return null;
}

export async function requireAdminProfileOrRedirect() {
  try {
    return await requirePermission("admin:access");
  } catch (error) {
    const reason = getLoginReason(error);

    if (reason) {
      redirect(`${routes.admin.login}?reason=${reason}`);
    }

    throw error;
  }
}
