"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";

import { retryEmailOutboxEntry } from "./outbox";
import { queueOptionalCustomerEmail, updateCustomerCommunicationPreferences } from "./optional";

export async function retryEmailAction(formData: FormData) {
  const emailId = String(formData.get("emailId") ?? "");

  await requirePermission("emails:retry");
  await retryEmailOutboxEntry(emailId);

  revalidatePath(routes.admin.emails);
  redirect(`${routes.admin.emails}?retried=1`);
}

export async function updateCustomerCommunicationPreferencesAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const profile = await requirePermission("emails:send-optional");

  await updateCustomerCommunicationPreferences(formData, profile);

  redirect(`${routes.admin.customerDetails(customerId)}?preferencesUpdated=1`);
}

export async function sendOptionalEmailAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const profile = await requirePermission("emails:send-optional");

  await queueOptionalCustomerEmail(formData, profile);

  revalidatePath(routes.admin.emails);
  redirect(`${routes.admin.customerDetails(customerId)}?optionalEmailQueued=1`);
}
