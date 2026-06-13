import { NextResponse } from "next/server";
import { z } from "zod";

import { genericLookupFailure, getTrackingUrl, lookupTrackingOrder } from "@/features/tracking/lookup";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  email: z.string().optional(),
  identifier: z.string().optional(),
  turnstileToken: z.string().optional()
});

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);

  if (length > 8192) {
    return noStoreJson({ error: genericLookupFailure }, 400);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: genericLookupFailure }, 400);
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return noStoreJson({ error: genericLookupFailure }, 400);
  }

  const result = await lookupTrackingOrder(parsed.data, request.headers);

  if (!result.ok) {
    return noStoreJson({ error: genericLookupFailure }, result.reason === "rate_limited" ? 429 : 404);
  }

  return noStoreJson({
    trackingUrl: getTrackingUrl(result.token)
  });
}
