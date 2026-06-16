/**
 * One-off go-live verification. Run with env loaded:
 *   set -a; . ./.env.local; set +a; pnpm tsx scripts/verify-go-live.ts
 */
import { Resend } from "resend";
import { Redis } from "@upstash/redis";

const results: Array<{ name: string; ok: boolean; detail: string }> = [];
function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
}

async function checkProductionEnv() {
  // Replicate the Vercel production environment exactly and run the app's own validator.
  const penv = process.env as Record<string, string | undefined>;
  penv.NODE_ENV = "production";
  penv.VERCEL_ENV = "production";
  penv.EMAIL_MODE = "production";
  try {
    const { getServerEnv } = await import("../src/config/env-core");
    getServerEnv();
    record("Production env validation", true, "all required variables present");
  } catch (error) {
    record("Production env validation", false, error instanceof Error ? error.message : String(error));
  } finally {
    penv.NODE_ENV = "development";
    delete penv.VERCEL_ENV;
    penv.EMAIL_MODE = "log";
  }
}

async function checkUpstash() {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });
    const key = "golive:verify";
    await redis.set(key, "ok", { ex: 30 });
    const value = await redis.get(key);
    record("Upstash Redis", value === "ok", `set/get round-trip = ${String(value)}`);
  } catch (error) {
    record("Upstash Redis", false, error instanceof Error ? error.message : String(error));
  }
}

async function checkTurnstile() {
  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: "dummy-token-to-test-secret"
    });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body
    });
    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    const codes = data["error-codes"] ?? [];
    // A valid secret with a bad token returns "invalid-input-response".
    // A wrong secret returns "invalid-input-secret".
    const secretAccepted = !codes.includes("invalid-input-secret");
    record("Turnstile secret", secretAccepted, secretAccepted ? "secret accepted by Cloudflare (token rejected as expected)" : "invalid-input-secret — wrong secret key");
  } catch (error) {
    record("Turnstile secret", false, error instanceof Error ? error.message : String(error));
  }
}

async function checkResend(sendTestEmail: boolean) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const domains = await resend.domains.list();
    const list = (domains.data as unknown as { data?: Array<{ name: string; status: string }> } | undefined);
    const arr = (list?.data ?? (domains.data as unknown as Array<{ name: string; status: string }>) ?? []) as Array<{ name: string; status: string }>;
    const verified = arr.find((d) => d.name === "tracking.suncontainer.de");
    record("Resend domain", Boolean(verified && verified.status === "verified"), verified ? `tracking.suncontainer.de = ${verified.status}` : `domains: ${arr.map((d) => `${d.name}(${d.status})`).join(", ") || "none returned"}`);

    if (sendTestEmail) {
      const sent = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: process.env.CREATE_ADMIN_EMAIL!,
        subject: "Sun Container — go-live test email",
        html: "<p>This confirms <strong>Resend</strong> is wired correctly for the tracking system.</p>",
        text: "This confirms Resend is wired correctly for the tracking system."
      });
      record("Resend live send", !sent.error, sent.error ? sent.error.message : `sent, id=${sent.data?.id}`);
    }
  } catch (error) {
    record("Resend domain", false, error instanceof Error ? error.message : String(error));
  }
}

async function main() {
  const sendTestEmail = process.argv.includes("--send-email");
  await checkProductionEnv();
  await checkUpstash();
  await checkTurnstile();
  await checkResend(sendTestEmail);

  console.log("\n================ GO-LIVE VERIFICATION ================");
  for (const r of results) {
    console.log(`${r.ok ? "✅" : "❌"}  ${r.name.padEnd(26)} ${r.detail}`);
  }
  const allOk = results.every((r) => r.ok);
  console.log("=====================================================");
  console.log(allOk ? "ALL CHECKS PASSED ✅" : "SOME CHECKS FAILED ❌");
  process.exitCode = allOk ? 0 : 1;
}

main();
