import { NextResponse } from "next/server";
import { WebhookVerificationError } from "standardwebhooks";

import { processResendWebhook } from "@/features/email/webhook";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const result = await processResendWebhook(rawBody, request.headers);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("RESEND_WEBHOOK_SECRET")) {
      return NextResponse.json({ error: "webhook_secret_unconfigured" }, { status: 503 });
    }

    console.error("resend_webhook_failed", error);

    return NextResponse.json({ error: "webhook_processing_failed" }, { status: 500 });
  }
}
