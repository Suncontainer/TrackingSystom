import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function POST() {
  return NextResponse.json(
    {
      error: "webhook_unavailable"
    },
    {
      status: 503
    }
  );
}
