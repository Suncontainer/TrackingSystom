import "server-only";

import { eq } from "drizzle-orm";

import { getServerEnv } from "@/config/env";
import { getDb } from "@/db/client";
import { emailDeliveryEvents, emailOutbox, emailSuppressions, type JsonRecord } from "@/db/schema";
import { normalizeCustomerEmail } from "@/features/customers/normalization";

import { mapResendEventType, verifyResendWebhook } from "./webhook-helpers";

export type ProcessResendWebhookResult = {
  eventId: string;
  eventType: string;
  matched: boolean;
  status: "duplicate" | "processed";
};

function getEventTimestamp(payload: Record<string, unknown>) {
  const value = typeof payload.created_at === "string" ? payload.created_at : null;
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function processResendWebhook(rawBody: string, headers: Headers): Promise<ProcessResendWebhookResult> {
  const env = getServerEnv();

  if (!env.RESEND_WEBHOOK_SECRET) {
    throw new Error("RESEND_WEBHOOK_SECRET is required to process Resend webhooks.");
  }

  const verified = verifyResendWebhook(rawBody, headers, env.RESEND_WEBHOOK_SECRET);
  const mapping = mapResendEventType(verified.eventType);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [existingEvent] = await tx
      .select({ id: emailDeliveryEvents.id })
      .from(emailDeliveryEvents)
      .where(eq(emailDeliveryEvents.providerEventId, verified.eventId))
      .limit(1);

    if (existingEvent) {
      return {
        eventId: verified.eventId,
        eventType: verified.eventType,
        matched: false,
        status: "duplicate"
      };
    }

    const [outboxEntry] = verified.providerMessageId
      ? await tx
        .select({
          id: emailOutbox.id,
          recipientEmail: emailOutbox.recipientEmail
        })
        .from(emailOutbox)
        .where(eq(emailOutbox.providerMessageId, verified.providerMessageId))
        .limit(1)
      : [];

    await tx.insert(emailDeliveryEvents).values({
      emailOutboxId: outboxEntry?.id ?? null,
      eventType: verified.eventType,
      payload: verified.payload as JsonRecord,
      processedAt: new Date(),
      providerEventId: verified.eventId,
      providerMessageId: verified.providerMessageId
    });

    if (outboxEntry && mapping.status) {
      const eventDate = getEventTimestamp(verified.payload);

      await tx
        .update(emailOutbox)
        .set({
          bouncedAt: mapping.timestampField === "bouncedAt" ? eventDate : undefined,
          complainedAt: mapping.timestampField === "complainedAt" ? eventDate : undefined,
          deliveredAt: mapping.timestampField === "deliveredAt" ? eventDate : undefined,
          failedAt: mapping.timestampField === "failedAt" ? eventDate : undefined,
          lastErrorCode: mapping.errorCode,
          lastErrorMessage: mapping.errorCode ? `Resend webhook: ${verified.eventType}` : null,
          sentAt: mapping.timestampField === "sentAt" ? eventDate : undefined,
          status: mapping.status,
          updatedAt: new Date()
        })
        .where(eq(emailOutbox.id, outboxEntry.id));
    }

    if (outboxEntry && mapping.shouldSuppress) {
      const email = verified.recipientEmail ?? outboxEntry.recipientEmail;

      await tx
        .insert(emailSuppressions)
        .values({
          emailNormalized: normalizeCustomerEmail(email),
          providerEventId: verified.eventId,
          reason: mapping.errorCode ?? verified.eventType,
          source: "resend_webhook"
        })
        .onConflictDoNothing();
    }

    return {
      eventId: verified.eventId,
      eventType: verified.eventType,
      matched: Boolean(outboxEntry),
      status: "processed"
    };
  });
}
