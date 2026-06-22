import "server-only";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { emailTemplates } from "@/db/schema";
import { isDemoMode } from "@/features/demo/store";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

export type EmailTemplate = {
  id: string;
  key: string;
  name: string;
  subjectDe: string;
  bodyDe: string;
  subjectEn: string;
  bodyEn: string;
};

const columns = {
  id: emailTemplates.id,
  key: emailTemplates.key,
  name: emailTemplates.name,
  subjectDe: emailTemplates.subjectDe,
  bodyDe: emailTemplates.bodyDe,
  subjectEn: emailTemplates.subjectEn,
  bodyEn: emailTemplates.bodyEn
};

const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required."),
  subjectDe: z.string().trim().min(1, "German subject is required."),
  bodyDe: z.string().trim().min(1, "German body is required."),
  subjectEn: z.string().trim().min(1, "English subject is required."),
  bodyEn: z.string().trim().min(1, "English body is required.")
});

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  if (isDemoMode()) {
    return [];
  }

  return getDb().select(columns).from(emailTemplates).orderBy(asc(emailTemplates.name));
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate | null> {
  if (isDemoMode() || !z.string().uuid().safeParse(id).success) {
    return null;
  }

  const [template] = await getDb().select(columns).from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  return template ?? null;
}

export async function updateEmailTemplate(input: unknown) {
  const parsed = updateTemplateSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        (fieldErrors[key] ??= []).push(issue.message);
      }
    }
    throw new ValidationError("Template data is invalid.", fieldErrors);
  }

  if (isDemoMode()) {
    throw new ValidationError("Template editing is not available in demo mode.");
  }

  const { id, ...values } = parsed.data;
  const [updated] = await getDb()
    .update(emailTemplates)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id))
    .returning({ id: emailTemplates.id });

  if (!updated) {
    throw new NotFoundError("Template not found.");
  }

  return updated;
}
