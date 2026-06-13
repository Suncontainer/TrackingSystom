"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerEnv } from "@/config/env-core";
import { routes } from "@/config/routes";
import {
  clearDevAdminSession,
  getDevAdminProfile,
  isDevAdminCredentialMatch,
  setDevAdminSession
} from "@/features/auth/dev-login";
import { updateProfileLastLoginAt } from "@/features/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePublicConfigError } from "@/lib/supabase/public-config";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.email()
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(10),
    passwordConfirm: z.string().min(10)
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match.",
    path: ["passwordConfirm"]
  });

function redirectWithQuery(path: string, query: Record<string, string>): never {
  const searchParams = new URLSearchParams(query);

  redirect(`${path}?${searchParams.toString()}`);
}

function getFormValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function isSupabaseConfigError(error: unknown) {
  return error instanceof SupabasePublicConfigError;
}

async function createActionSupabaseClient() {
  try {
    return await createSupabaseServerClient();
  } catch (error) {
    if (isSupabaseConfigError(error)) {
      redirectWithQuery(routes.admin.login, { error: "auth_unconfigured" });
    }

    throw error;
  }
}

export async function signInAction(formData: FormData) {
  const parsed = loginSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithQuery(routes.admin.login, { error: "invalid_credentials" });
  }

  if (isDevAdminCredentialMatch(parsed.data)) {
    await setDevAdminSession();
    redirect(routes.admin.home);
  }

  const supabase = await createActionSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectWithQuery(routes.admin.login, { error: "invalid_credentials" });
  }

  const { data: userData } = await supabase.auth.getUser();

  if (userData.user) {
    await updateProfileLastLoginAt(userData.user.id).catch(() => undefined);
  }

  redirect(routes.admin.home);
}

export async function signOutAction() {
  const devProfile = await getDevAdminProfile();
  await clearDevAdminSession();

  if (devProfile) {
    redirect(routes.admin.login);
  }

  const supabase = await createActionSupabaseClient();

  await supabase.auth.signOut();
  redirect(routes.admin.login);
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithQuery(routes.admin.forgotPassword, { error: "invalid_email" });
  }

  const env = getServerEnv();
  const confirmUrl = new URL("/auth/confirm", env.NEXT_PUBLIC_APP_URL);
  confirmUrl.searchParams.set("next", routes.admin.resetPassword);

  const supabase = await createActionSupabaseClient();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl.toString()
  });

  redirectWithQuery(routes.admin.forgotPassword, { sent: "1" });
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithQuery(routes.admin.resetPassword, { error: "invalid_password" });
  }

  const supabase = await createActionSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    redirectWithQuery(routes.admin.resetPassword, { error: "reset_failed" });
  }

  await supabase.auth.signOut();
  redirectWithQuery(routes.admin.login, { reset: "success" });
}
