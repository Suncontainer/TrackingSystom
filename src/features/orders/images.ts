import "server-only";

import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { routes } from "@/config/routes";
import { getDb } from "@/db/client";
import { orderImages, orders } from "@/db/schema";
import { isDemoMode } from "@/features/demo/store";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { createSupabaseServiceClient, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/admin";

export type OrderImage = { id: string; url: string };
export type ImageUploadTarget = { path: string; token: string };

const MAX_FILES = 10;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

export async function listOrderImages(orderId: string): Promise<OrderImage[]> {
  if (isDemoMode()) {
    return [];
  }

  const db = getDb();

  return db
    .select({ id: orderImages.id, url: orderImages.url })
    .from(orderImages)
    .where(eq(orderImages.orderId, orderId))
    .orderBy(asc(orderImages.createdAt));
}

// Step 1 of a direct browser upload: create one signed upload URL per file so the
// browser sends the bytes straight to storage (bypassing server-action body limits).
export async function createImageUploadTargets(orderId: string, fileNames: string[]): Promise<ImageUploadTarget[]> {
  if (isDemoMode()) {
    throw new ValidationError("Image upload is not available in demo mode.");
  }

  if (fileNames.length === 0) {
    throw new ValidationError("Select at least one image.");
  }

  if (fileNames.length > MAX_FILES) {
    throw new ValidationError(`Upload at most ${MAX_FILES} images at a time.`);
  }

  const db = getDb();
  const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).limit(1);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  const storage = createSupabaseServiceClient().storage.from(PRODUCT_IMAGES_BUCKET);
  const targets: ImageUploadTarget[] = [];

  for (const fileName of fileNames) {
    const ext = (fileName.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : "jpg";
    const path = `${orderId}/${randomUUID()}.${safeExt}`;
    const { data, error } = await storage.createSignedUploadUrl(path);

    if (error || !data) {
      throw new ValidationError(`Could not prepare the upload: ${error?.message ?? "unknown error"}`);
    }

    targets.push({ path: data.path, token: data.token });
  }

  return targets;
}

// Step 2: after the browser uploaded the files, record them. Paths are confined to
// this order's folder so a caller can't attach arbitrary objects.
export async function recordOrderImages(orderId: string, paths: string[], actorId: string) {
  if (isDemoMode()) {
    throw new ValidationError("Image upload is not available in demo mode.");
  }

  const prefix = `${orderId}/`;
  const cleanPaths = [...new Set(paths.filter((path) => path.startsWith(prefix)))];

  if (cleanPaths.length === 0) {
    return;
  }

  const storage = createSupabaseServiceClient().storage.from(PRODUCT_IMAGES_BUCKET);
  const rows = cleanPaths.map((path) => ({
    orderId,
    storagePath: path,
    url: storage.getPublicUrl(path).data.publicUrl,
    createdBy: actorId
  }));

  await getDb().insert(orderImages).values(rows);
  revalidatePath(routes.admin.orderDetails(orderId));
}

export async function deleteOrderImage(imageId: string) {
  if (isDemoMode()) {
    throw new ValidationError("Image management is not available in demo mode.");
  }

  const db = getDb();
  const [image] = await db
    .select({ id: orderImages.id, orderId: orderImages.orderId, storagePath: orderImages.storagePath })
    .from(orderImages)
    .where(eq(orderImages.id, imageId))
    .limit(1);

  if (!image) {
    throw new NotFoundError("Image not found.");
  }

  await createSupabaseServiceClient().storage.from(PRODUCT_IMAGES_BUCKET).remove([image.storagePath]);
  await db.delete(orderImages).where(eq(orderImages.id, imageId));
  revalidatePath(routes.admin.orderDetails(image.orderId));

  return { orderId: image.orderId };
}
