import "server-only";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { sellers } from "@/db/schema";
import { isDemoMode } from "@/features/demo/store";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

export type Seller = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};

const createSellerInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().min(1, "Email is required.")
});

const DEMO_WRITE_MESSAGE = "Seller management is not available in demo mode.";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

// Active sellers for the order assignment dropdowns.
export async function listActiveSellers(): Promise<Seller[]> {
  if (isDemoMode()) {
    return [];
  }

  const db = getDb();

  return db
    .select({ id: sellers.id, name: sellers.name, email: sellers.email, isActive: sellers.isActive })
    .from(sellers)
    .where(eq(sellers.isActive, true))
    .orderBy(asc(sellers.name));
}

// All sellers for the management page.
export async function listSellers(): Promise<Seller[]> {
  if (isDemoMode()) {
    return [];
  }

  const db = getDb();

  return db
    .select({ id: sellers.id, name: sellers.name, email: sellers.email, isActive: sellers.isActive })
    .from(sellers)
    .orderBy(asc(sellers.name));
}

export async function createSeller(input: unknown) {
  const parsed = createSellerInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Seller data is invalid.", toFieldErrors(parsed.error));
  }

  if (!z.email().safeParse(parsed.data.email).success) {
    throw new ValidationError("Seller data is invalid.", { email: ["Email is invalid."] });
  }

  if (isDemoMode()) {
    throw new ValidationError(DEMO_WRITE_MESSAGE);
  }

  const db = getDb();
  const emailNormalized = normalizeEmail(parsed.data.email);

  const [existing] = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.emailNormalized, emailNormalized))
    .limit(1);

  if (existing) {
    throw new ConflictError("A seller with this email already exists.");
  }

  const [created] = await db
    .insert(sellers)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      emailNormalized
    })
    .returning({ id: sellers.id });

  return created;
}

export async function deleteSeller(sellerId: string) {
  if (!z.string().uuid().safeParse(sellerId).success) {
    throw new ValidationError("Seller is invalid.");
  }

  if (isDemoMode()) {
    throw new ValidationError(DEMO_WRITE_MESSAGE);
  }

  const db = getDb();
  const [deleted] = await db.delete(sellers).where(eq(sellers.id, sellerId)).returning({ id: sellers.id });

  if (!deleted) {
    throw new NotFoundError("Seller not found.");
  }

  return deleted;
}

function toFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key === "string") {
      (fieldErrors[key] ??= []).push(issue.message);
    }
  }

  return fieldErrors;
}
