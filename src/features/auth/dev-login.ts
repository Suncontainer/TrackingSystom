import "server-only";

import { cookies } from "next/headers";

import type { Profile } from "@/db/schema";

export const devAdminCredentials = {
  email: "admin@suncontainer.local",
  password: "SunContainer123!"
} as const;

const devAdminCookieName = "suncontainer_dev_admin";
const devAdminCookieValue = "temporary-super-admin";

export const devAdminProfile = {
  createdAt: new Date(0),
  email: devAdminCredentials.email,
  firstName: "Temporary",
  id: "90000000-0000-4000-8000-000000000001",
  isActive: true,
  lastLoginAt: null,
  lastName: "Admin",
  role: "SUPER_ADMIN",
  updatedAt: new Date(0)
} satisfies Profile;

export function isDevAdminLoginEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.VERCEL_ENV !== "production";
}

export function isDevAdminCredentialMatch(input: { email: string; password: string }) {
  return (
    isDevAdminLoginEnabled() &&
    input.email.trim().toLowerCase() === devAdminCredentials.email &&
    input.password === devAdminCredentials.password
  );
}

export async function setDevAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(devAdminCookieName, devAdminCookieValue, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false
  });
}

export async function clearDevAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(devAdminCookieName);
}

export async function getDevAdminProfile() {
  if (!isDevAdminLoginEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  return cookieStore.get(devAdminCookieName)?.value === devAdminCookieValue ? devAdminProfile : null;
}
