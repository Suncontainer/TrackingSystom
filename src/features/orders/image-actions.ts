"use server";

import { requireOrderAccess } from "@/features/auth/guards";
import { assertCan } from "@/features/auth/permissions";
import { AppError } from "@/lib/errors/app-error";

import { createImageUploadTargets, deleteOrderImage, recordOrderImages, type ImageUploadTarget } from "./images";

function errorMessage(error: unknown) {
  return error instanceof AppError ? error.message : "The request could not be completed.";
}

type UploadTargetsResult =
  | { ok: true; targets: ImageUploadTarget[] }
  | { ok: false; error: string };

export async function createImageUploadTargetsAction(
  orderId: string,
  fileNames: string[]
): Promise<UploadTargetsResult> {
  try {
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:update");
    const targets = await createImageUploadTargets(orderId, fileNames);
    return { ok: true, targets };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function recordOrderImagesAction(
  orderId: string,
  paths: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:update");
    await recordOrderImages(orderId, paths, profile.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteOrderImageAction(
  orderId: string,
  imageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:update");
    await deleteOrderImage(imageId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
