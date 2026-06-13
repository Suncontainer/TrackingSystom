import { Webhook } from "standardwebhooks";

import type { EmailStatus } from "@/db/schema";

export type VerifiedResendWebhook = {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  providerMessageId: string | null;
  recipientEmail: string | null;
};

export type ResendEventMapping = {
  errorCode?: string;
  shouldSuppress: boolean;
  status: EmailStatus | null;
  timestampField: "sentAt" | "deliveredAt" | "bouncedAt" | "complainedAt" | "failedAt" | null;
};

function getHeader(headers: Headers, primary: string, fallback?: string) {
  return headers.get(primary) ?? (fallback ? headers.get(fallback) : null);
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPayloadData(payload: Record<string, unknown>) {
  return payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown>
    : {};
}

function getFirstRecipient(value: unknown) {
  if (Array.isArray(value)) {
    return getString(value[0]);
  }

  return getString(value);
}

export function mapResendEventType(eventType: string): ResendEventMapping {
  switch (eventType) {
    case "email.sent":
      return {
        shouldSuppress: false,
        status: "SENT",
        timestampField: "sentAt"
      };
    case "email.delivered":
      return {
        shouldSuppress: false,
        status: "DELIVERED",
        timestampField: "deliveredAt"
      };
    case "email.bounced":
      return {
        errorCode: "hard_bounce",
        shouldSuppress: true,
        status: "BOUNCED",
        timestampField: "bouncedAt"
      };
    case "email.complained":
      return {
        errorCode: "complaint",
        shouldSuppress: true,
        status: "COMPLAINED",
        timestampField: "complainedAt"
      };
    case "email.delivery_delayed":
      return {
        errorCode: "delivery_delayed",
        shouldSuppress: false,
        status: "FAILED",
        timestampField: "failedAt"
      };
    default:
      return {
        shouldSuppress: false,
        status: null,
        timestampField: null
      };
  }
}

export function verifyResendWebhook(rawBody: string, headers: Headers, secret: string): VerifiedResendWebhook {
  const eventId = getHeader(headers, "webhook-id", "svix-id");
  const timestamp = getHeader(headers, "webhook-timestamp", "svix-timestamp");
  const signature = getHeader(headers, "webhook-signature", "svix-signature");

  const payload = new Webhook(secret).verify(rawBody, {
    "webhook-id": eventId ?? "",
    "webhook-signature": signature ?? "",
    "webhook-timestamp": timestamp ?? ""
  }) as Record<string, unknown>;
  const data = getPayloadData(payload);
  const eventType = getString(payload.type) ?? getString(payload.event) ?? "unknown";
  const providerMessageId =
    getString(data.email_id) ??
    getString(data.emailId) ??
    getString(data.message_id) ??
    getString(data.id) ??
    getString(payload.email_id) ??
    getString(payload.message_id);

  return {
    eventId: eventId ?? getString(payload.id) ?? "unknown",
    eventType,
    payload,
    providerMessageId,
    recipientEmail: getFirstRecipient(data.to) ?? getString(data.email) ?? null
  };
}
