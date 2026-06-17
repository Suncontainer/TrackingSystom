"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { requireActiveProfile, requirePermission } from "@/features/auth/guards";
import { AppError } from "@/lib/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { updateDefaults, updateOwnProfile, updateSender } from "./service";

function backToSettings(query: Record<string, string>): never {
  const search = new URLSearchParams(query);
  redirect(`${routes.admin.settings}?${search.toString()}`);
}

function feedbackFor(error: unknown) {
  return error instanceof AppError ? error.message : "The request could not be completed.";
}

export async function updateOwnProfileAction(formData: FormData) {
  const profile = await requireActiveProfile();

  try {
    await updateOwnProfile(profile.id, {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? "")
    });
  } catch (error) {
    console.error("[settings] updateOwnProfileAction", error);
    backToSettings({ error: feedbackFor(error) });
  }

  revalidatePath(routes.admin.settings);
  backToSettings({ ok: "profile" });
}

export async function changeOwnPasswordAction(formData: FormData) {
  await requireActiveProfile();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("passwordConfirm") ?? "");

  if (password.length < 10) {
    backToSettings({ error: "Password must be at least 10 characters." });
  }

  if (password !== confirm) {
    backToSettings({ error: "Passwords do not match." });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      backToSettings({ error: "Password could not be updated." });
    }
  } catch (error) {
    console.error("[settings] changeOwnPasswordAction", error);
    backToSettings({ error: "Password could not be updated." });
  }

  backToSettings({ ok: "password" });
}

export async function updateDefaultsAction(formData: FormData) {
  await requirePermission("settings:update");

  try {
    await updateDefaults({
      defaultCustomerLanguage: String(formData.get("defaultCustomerLanguage") ?? "de"),
      orderNumberPrefix: String(formData.get("orderNumberPrefix") ?? "")
    });
  } catch (error) {
    console.error("[settings] updateDefaultsAction", error);
    backToSettings({ error: feedbackFor(error) });
  }

  revalidatePath(routes.admin.settings);
  backToSettings({ ok: "defaults" });
}

export async function updateSenderAction(formData: FormData) {
  await requirePermission("settings:update");

  try {
    await updateSender({
      emailFromName: String(formData.get("emailFromName") ?? ""),
      emailFromAddress: String(formData.get("emailFromAddress") ?? "")
    });
  } catch (error) {
    console.error("[settings] updateSenderAction", error);
    backToSettings({ error: feedbackFor(error) });
  }

  revalidatePath(routes.admin.settings);
  backToSettings({ ok: "sender" });
}
