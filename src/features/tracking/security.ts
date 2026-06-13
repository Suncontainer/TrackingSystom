import { createHmac } from "node:crypto";

export function hashLookupValue(value: string | null | undefined, secret: string) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return createHmac("sha256", secret).update(normalized).digest("hex");
}

export function readClientIp(headers: Headers) {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function readUserAgent(headers: Headers) {
  return headers.get("user-agent") ?? "unknown";
}
