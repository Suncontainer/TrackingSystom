"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";

import { retryEmailOutboxEntry } from "./outbox";

export async function retryEmailAction(formData: FormData) {
  const emailId = String(formData.get("emailId") ?? "");

  await requirePermission("emails:retry");
  await retryEmailOutboxEntry(emailId);

  revalidatePath(routes.admin.emails);
  redirect(`${routes.admin.emails}?retried=1`);
}
