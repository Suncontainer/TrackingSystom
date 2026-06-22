"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { requireOrderAccess, requirePermission } from "@/features/auth/guards";
import { assertCan } from "@/features/auth/permissions";
import { queueTemplatedCustomerEmail } from "@/features/email/templated-send";
import { AppError, ValidationError } from "@/lib/errors/app-error";

import { type TemplateFormState } from "./form-state";
import { updateEmailTemplate } from "./service";

function errorState(error: unknown): TemplateFormState {
  if (error instanceof ValidationError) {
    return { fieldErrors: error.fieldErrors, formError: error.message };
  }

  if (error instanceof AppError) {
    return { fieldErrors: {}, formError: error.message };
  }

  return { fieldErrors: {}, formError: "The request could not be completed." };
}

export async function updateTemplateAction(
  _previousState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  try {
    await requirePermission("templates:manage");
    await updateEmailTemplate({
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
      subjectDe: String(formData.get("subjectDe") ?? ""),
      bodyDe: String(formData.get("bodyDe") ?? ""),
      subjectEn: String(formData.get("subjectEn") ?? ""),
      bodyEn: String(formData.get("bodyEn") ?? "")
    });
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(routes.admin.templates);
  redirect(`${routes.admin.templates}?updated=1`);
}

export async function sendTemplatedEmailAction(
  _previousState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const orderId = String(formData.get("orderId") ?? "");

  try {
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "emails:send-optional");
    await queueTemplatedCustomerEmail({ orderId, templateId: String(formData.get("templateId") ?? "") }, profile);
  } catch (error) {
    return errorState(error);
  }

  redirect(`${routes.admin.orderDetails(orderId)}?emailSent=1`);
}
