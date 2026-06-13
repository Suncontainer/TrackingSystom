// @vitest-environment node

import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { describe, expect, it } from "vitest";

import { mapResendEventType, verifyResendWebhook } from "@/features/email/webhook-helpers";

function testSecret() {
  return `whsec_${Buffer.from("phase-7-webhook-secret").toString("base64")}`;
}

function signedHeaders(rawBody: string, eventId = "evt_123") {
  const timestamp = new Date();
  const signature = new Webhook(testSecret()).sign(eventId, timestamp, rawBody);

  return new Headers({
    "webhook-id": eventId,
    "webhook-signature": signature,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000))
  });
}

describe("Resend webhook helpers", () => {
  it("verifies a signed payload and extracts provider ids", () => {
    const rawBody = JSON.stringify({
      created_at: "2026-06-14T08:00:00.000Z",
      data: {
        email_id: "email_123",
        to: ["customer@example.com"]
      },
      type: "email.delivered"
    });
    const verified = verifyResendWebhook(rawBody, signedHeaders(rawBody), testSecret());

    expect(verified).toEqual({
      eventId: "evt_123",
      eventType: "email.delivered",
      payload: JSON.parse(rawBody),
      providerMessageId: "email_123",
      recipientEmail: "customer@example.com"
    });
  });

  it("supports legacy svix header names", () => {
    const rawBody = JSON.stringify({
      data: { id: "email_456", to: "customer@example.com" },
      type: "email.bounced"
    });
    const timestamp = new Date();
    const signature = new Webhook(testSecret()).sign("evt_456", timestamp, rawBody);
    const headers = new Headers({
      "svix-id": "evt_456",
      "svix-signature": signature,
      "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000))
    });
    const verified = verifyResendWebhook(rawBody, headers, testSecret());

    expect(verified.eventId).toBe("evt_456");
    expect(verified.providerMessageId).toBe("email_456");
  });

  it("rejects invalid signatures", () => {
    const rawBody = JSON.stringify({ type: "email.delivered" });
    const headers = signedHeaders(rawBody);
    headers.set("webhook-signature", "v1,bad");

    expect(() => verifyResendWebhook(rawBody, headers, testSecret())).toThrow(WebhookVerificationError);
  });

  it("maps delivery, bounce, complaint, and unknown events", () => {
    expect(mapResendEventType("email.delivered")).toMatchObject({
      shouldSuppress: false,
      status: "DELIVERED",
      timestampField: "deliveredAt"
    });
    expect(mapResendEventType("email.bounced")).toMatchObject({
      errorCode: "hard_bounce",
      shouldSuppress: true,
      status: "BOUNCED",
      timestampField: "bouncedAt"
    });
    expect(mapResendEventType("email.complained")).toMatchObject({
      errorCode: "complaint",
      shouldSuppress: true,
      status: "COMPLAINED",
      timestampField: "complainedAt"
    });
    expect(mapResendEventType("email.opened")).toEqual({
      shouldSuppress: false,
      status: null,
      timestampField: null
    });
  });
});
