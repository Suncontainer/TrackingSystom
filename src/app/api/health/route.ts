import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "sun-container-tracking",
    timestamp: new Date().toISOString()
  });
}
