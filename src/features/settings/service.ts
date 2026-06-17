import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { appSettings, profiles } from "@/db/schema";
import { ValidationError } from "@/lib/errors/app-error";
import type { AppLocale } from "@/i18n/types";

function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : "de";
}

export type AppSettings = {
  defaultCustomerLanguage: AppLocale;
  orderNumberPrefix: string;
  emailFromName: string;
  emailFromAddress: string;
};

export const defaultAppSettings: AppSettings = {
  defaultCustomerLanguage: "de",
  orderNumberPrefix: "SC",
  emailFromName: "Sun Container",
  emailFromAddress: ""
};

const SETTINGS_ID = "global";

// Reads the single global settings row. Falls back to defaults if the row is
// absent or the table has not been migrated yet, so the UI never hard-fails.
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const db = getDb();
    const [row] = await db
      .select({
        defaultCustomerLanguage: appSettings.defaultCustomerLanguage,
        orderNumberPrefix: appSettings.orderNumberPrefix,
        emailFromName: appSettings.emailFromName,
        emailFromAddress: appSettings.emailFromAddress
      })
      .from(appSettings)
      .where(eq(appSettings.id, SETTINGS_ID))
      .limit(1);

    if (!row) {
      return defaultAppSettings;
    }

    return {
      defaultCustomerLanguage: normalizeLocale(row.defaultCustomerLanguage),
      orderNumberPrefix: row.orderNumberPrefix,
      emailFromName: row.emailFromName,
      emailFromAddress: row.emailFromAddress
    };
  } catch (error) {
    console.error("[settings] getAppSettings fell back to defaults", error);
    return defaultAppSettings;
  }
}

async function upsertSettings(values: Partial<Omit<AppSettings, "defaultCustomerLanguage">> & { defaultCustomerLanguage?: AppLocale }) {
  const db = getDb();
  const current = await getAppSettings();
  const merged = { ...current, ...values };

  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, ...merged })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { ...merged, updatedAt: new Date() }
    });
}

export async function updateDefaults(input: { defaultCustomerLanguage: string; orderNumberPrefix: string }) {
  const prefix = input.orderNumberPrefix.trim().toUpperCase();

  // Must stay compatible with the order-number format (e.g. SC-2026-000001) and
  // the manual-order-number validator, both of which expect 2–10 letters.
  if (!/^[A-Z]{2,10}$/.test(prefix)) {
    throw new ValidationError("Order number prefix must be 2–10 letters.");
  }

  await upsertSettings({
    defaultCustomerLanguage: normalizeLocale(input.defaultCustomerLanguage),
    orderNumberPrefix: prefix
  });
}

export async function updateSender(input: { emailFromName: string; emailFromAddress: string }) {
  const name = input.emailFromName.trim();
  const address = input.emailFromAddress.trim();

  if (name.length === 0) {
    throw new ValidationError("Sender name is required.");
  }

  if (address.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new ValidationError("Sender address must be a valid email.");
  }

  await upsertSettings({ emailFromName: name, emailFromAddress: address });
}

export async function updateOwnProfile(userId: string, input: { firstName: string; lastName: string }) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (firstName.length === 0 || lastName.length === 0) {
    throw new ValidationError("First and last name are required.");
  }

  const db = getDb();
  await db
    .update(profiles)
    .set({ firstName, lastName, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}
