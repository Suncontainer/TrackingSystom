"use server";

import { requireOrderAccess } from "@/features/auth/guards";
import { assertCan } from "@/features/auth/permissions";
import { AppError, ValidationError } from "@/lib/errors/app-error";

import { addOrderImages, deleteOrderImage } from "./images";

export type ImageActionState = {
  formError: string | null;
  ok: boolean;
};

export const initialImageActionState: ImageActionState = {
  formError: null,
  ok: false
};

function errorState(error: unknown): ImageActionState {
  if (error instanceof ValidationError || error instanceof AppError) {
    return { formError: error.message, ok: false };
  }

  return { formError: "The request could not be completed.", ok: false };
}

export async function uploadOrderImagesAction(
  _previousState: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  try {
    const orderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:update");
    const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
    await addOrderImages(orderId, files, profile.id);
  } catch (error) {
    return errorState(error);
  }

  return { formError: null, ok: true };
}

export async function deleteOrderImageAction(
  _previousState: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  try {
    const orderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:update");
    await deleteOrderImage(String(formData.get("imageId") ?? ""));
  } catch (error) {
    return errorState(error);
  }

  return { formError: null, ok: true };
}
