import "server-only";

import { cookies } from "next/headers";

import { ADMIN_LOCALE_COOKIE, getAdminDictionary } from "./admin";
import type { AppLocale } from "./types";

export { ADMIN_LOCALE_COOKIE };

export async function getAdminLocale(): Promise<AppLocale> {
  const store = await cookies();
  return store.get(ADMIN_LOCALE_COOKIE)?.value === "en" ? "en" : "de";
}

export async function getAdminContext() {
  const locale = await getAdminLocale();
  return { locale, t: getAdminDictionary(locale) };
}
