"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerEnv } from "@/config/env-core";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { AppError } from "@/lib/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getMemberEmail, setMemberActive, updateMemberRole } from "./service";

function backToUsers(query: Record<string, string>): never {
  const search = new URLSearchParams(query);
  redirect(`${routes.admin.users}?${search.toString()}`);
}

function feedbackFor(error: unknown) {
  return error instanceof AppError ? error.message : "The request could not be completed.";
}

export async function updateUserRoleAction(formData: FormData) {
  const profile = await requirePermission("users:manage");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  try {
    await updateMemberRole(profile.id, userId, role);
  } catch (error) {
    console.error("[users] updateUserRoleAction", error);
    backToUsers({ error: feedbackFor(error) });
  }

  revalidatePath(routes.admin.users);
  backToUsers({ ok: "role" });
}

export async function setUserActiveAction(formData: FormData) {
  const profile = await requirePermission("users:manage");
  const userId = String(formData.get("userId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  try {
    await setMemberActive(profile.id, userId, isActive);
  } catch (error) {
    console.error("[users] setUserActiveAction", error);
    backToUsers({ error: feedbackFor(error) });
  }

  revalidatePath(routes.admin.users);
  backToUsers({ ok: isActive ? "activated" : "deactivated" });
}

export async function resetUserPasswordAction(formData: FormData) {
  await requirePermission("users:manage");
  const userId = String(formData.get("userId") ?? "");

  let email: string;

  try {
    email = await getMemberEmail(userId);
  } catch (error) {
    console.error("[users] resetUserPasswordAction:lookup", error);
    backToUsers({ error: feedbackFor(error) });
  }

  const env = getServerEnv();
  const confirmUrl = new URL("/auth/confirm", env.NEXT_PUBLIC_APP_URL);
  confirmUrl.searchParams.set("next", routes.admin.resetPassword);

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: confirmUrl.toString() });
  } catch (error) {
    console.error("[users] resetUserPasswordAction:send", error);
    backToUsers({ error: "Password reset email could not be sent." });
  }

  backToUsers({ ok: "reset" });
}
