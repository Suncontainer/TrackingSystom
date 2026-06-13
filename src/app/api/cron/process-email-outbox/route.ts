import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      error: "email_outbox_unavailable"
    },
    {
      status: 503
    }
  );
}
