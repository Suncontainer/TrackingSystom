import "server-only";

import { getServerEnv } from "@/config/env";

export type TurnstileResult = {
  ok: boolean;
  mode: "verified" | "skipped" | "failed";
};

type TurnstileResponse = {
  success?: boolean;
};

export async function verifyTurnstileToken(token: string | null | undefined, ipAddress?: string): Promise<TurnstileResult> {
  if (process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL) {
    return { ok: true, mode: "skipped" };
  }

  const env = getServerEnv();

  if (!env.TURNSTILE_SECRET_KEY) {
    return env.NODE_ENV === "production" || env.VERCEL_ENV === "production"
      ? { ok: false, mode: "failed" }
      : { ok: true, mode: "skipped" };
  }

  if (!token) {
    return { ok: false, mode: "failed" };
  }

  const body = new URLSearchParams({
    response: token,
    secret: env.TURNSTILE_SECRET_KEY
  });

  if (ipAddress && ipAddress !== "unknown") {
    body.set("remoteip", ipAddress);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      body,
      method: "POST"
    });
    const result = (await response.json()) as TurnstileResponse;

    return result.success ? { ok: true, mode: "verified" } : { ok: false, mode: "failed" };
  } catch {
    return { ok: false, mode: "failed" };
  }
}
