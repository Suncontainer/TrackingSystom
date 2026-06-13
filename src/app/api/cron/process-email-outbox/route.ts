import { NextResponse } from "next/server";

import { getServerEnv } from "@/config/env";
import { isAuthorizedCronRequest } from "@/features/email/cron-auth";
import { processEmailOutbox } from "@/features/email/outbox";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const env = getServerEnv();

  if (!isAuthorizedCronRequest(request.headers, env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await processEmailOutbox();

  return NextResponse.json({
    ok: true,
    result
  });
}
