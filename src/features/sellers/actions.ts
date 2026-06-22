"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { AppError, ValidationError } from "@/lib/errors/app-error";

import { type SellerFormState } from "./form-state";
import { createSeller, deleteSeller } from "./service";

function errorState(error: unknown, values?: Record<string, string>): SellerFormState {
  const submitted = values ? { values } : {};

  if (error instanceof ValidationError) {
    return { fieldErrors: error.fieldErrors, formError: error.message, ...submitted };
  }

  if (error instanceof AppError) {
    return { fieldErrors: {}, formError: error.message, ...submitted };
  }

  return { fieldErrors: {}, formError: "The request could not be completed.", ...submitted };
}

export async function createSellerAction(
  _previousState: SellerFormState,
  formData: FormData
): Promise<SellerFormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "")
  };

  try {
    await requirePermission("sellers:manage");
    await createSeller(values);
  } catch (error) {
    return errorState(error, values);
  }

  revalidatePath(routes.admin.sellers);
  redirect(`${routes.admin.sellers}?created=1`);
}

export async function deleteSellerAction(
  _previousState: SellerFormState,
  formData: FormData
): Promise<SellerFormState> {
  try {
    await requirePermission("sellers:manage");
    await deleteSeller(String(formData.get("sellerId") ?? ""));
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(routes.admin.sellers);
  redirect(`${routes.admin.sellers}?removed=1`);
}
