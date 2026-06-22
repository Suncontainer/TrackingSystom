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

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

export async function addOrderImages(orderId: string, files: File[], actorId: string) {
  if (isDemoMode()) {
    throw new ValidationError("Image upload is not available in demo mode.");
  }

  const valid = files.filter((file) => file && file.size > 0);

  if (valid.length === 0) {
    throw new ValidationError("Select at least one image.");
  }

  if (valid.length > MAX_FILES) {
    throw new ValidationError(`Upload at most ${MAX_FILES} images at a time.`);
  }

  for (const file of valid) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError("Only JPEG, PNG, WebP, or GIF images are allowed.");
    }
    if (file.size > MAX_BYTES) {
      throw new ValidationError("Each image must be 10 MB or smaller.");
    }
  }

  const db = getDb();
  const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).limit(1);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  const storage = createSupabaseServiceClient().storage.from(PRODUCT_IMAGES_BUCKET);
  const rows: Array<{ orderId: string; storagePath: string; url: string; createdBy: string }> = [];

  for (const file of valid) {
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const storagePath = `${orderId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await storage.upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (error) {
      throw new ValidationError(`Image upload failed: ${error.message}`);
    }

    const { data } = storage.getPublicUrl(storagePath);
    rows.push({ orderId, storagePath, url: data.publicUrl, createdBy: actorId });
  }

  await db.insert(orderImages).values(rows);
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
