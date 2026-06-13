import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";

import { getServerEnv } from "@/config/env";
import { getDb } from "@/db/client";
import { customers, orders, trackingLookupAttempts } from "@/db/schema";
import { normalizeCustomerEmail } from "@/features/customers/normalization";
import {
  formatTrackingNumber,
  normalizeManualOrderNumber,
  normalizeTrackingNumber
} from "@/features/orders/identifiers";
import { toPublicOrderSnapshot } from "@/features/orders/public-dto";
import type { AppLocale } from "@/i18n/types";

import { checkTrackingLookupRateLimit } from "./rate-limit";
import { hashLookupValue, readClientIp, readUserAgent } from "./security";
import { createTrackingToken, isTrackingTokenVersionCurrent, verifyTrackingToken } from "./tokens";
import { verifyTurnstileToken } from "./turnstile";

export const genericLookupFailure = "We could not find an active order matching the information provided.";

export type PublicTrackingOrder = ReturnType<typeof toPublicOrderSnapshot> & {
  customerFirstName: string;
  formattedTrackingNumber: string;
  lastUpdatedAt: string;
};

export type TrackingLookupResult =
  | {
      ok: true;
      order: PublicTrackingOrder;
      token: string;
    }
  | {
      ok: false;
      reason: "invalid" | "not_found" | "rate_limited" | "turnstile_failed" | "token_invalid";
    };

const manualLookupSchema = z.object({
  email: z.email().max(254),
  identifier: z.string().trim().min(3).max(80),
  turnstileToken: z.string().trim().max(4096).optional()
});

type PublicOrderRow = {
  currentEstimatedDeliveryDate: string;
  customerFirstName: string;
  id: string;
  lastUpdatedAt: Date;
  orderNumber: string;
  preferredLanguage: string;
  productDescription: string | null;
  status: typeof orders.$inferSelect.status;
  trackingLinkVersion: number;
  trackingNumber: string;
};

function getTrackingSecret() {
  const env = getServerEnv();

  if (env.TRACKING_LINK_SECRET) {
    return env.TRACKING_LINK_SECRET;
  }

  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    throw new Error("TRACKING_LINK_SECRET is required in production.");
  }

  return "development-tracking-link-secret";
}

function normalizeLocale(locale: string): AppLocale {
  return locale === "en" ? "en" : "de";
}

function toPublicTrackingOrder(row: PublicOrderRow): PublicTrackingOrder {
  return {
    ...toPublicOrderSnapshot({
      currentEstimatedDeliveryDate: row.currentEstimatedDeliveryDate,
      orderNumber: row.orderNumber,
      preferredLanguage: normalizeLocale(row.preferredLanguage),
      productDescription: row.productDescription,
      status: row.status,
      trackingNumber: row.trackingNumber
    }),
    customerFirstName: row.customerFirstName,
    formattedTrackingNumber: formatTrackingNumber(row.trackingNumber),
    lastUpdatedAt: row.lastUpdatedAt.toISOString()
  };
}

function normalizeLookupIdentifier(identifier: string) {
  const normalizedOrderNumber = normalizeManualOrderNumber(identifier);
  const normalizedTrackingNumber = normalizeTrackingNumber(identifier);

  return {
    normalizedOrderNumber,
    normalizedTrackingNumber
  };
}

async function logLookupAttempt(input: {
  emailHash: string | null;
  identifierHash: string | null;
  ipHash: string | null;
  result: string;
  userAgentHash: string | null;
}) {
  try {
    await getDb().insert(trackingLookupAttempts).values(input);
  } catch (error) {
    console.error("tracking_lookup_log_failed", error);
  }
}

async function findPublicOrderByManualLookup(identifier: string, email: string) {
  const { normalizedOrderNumber, normalizedTrackingNumber } = normalizeLookupIdentifier(identifier);
  const normalizedEmail = normalizeCustomerEmail(email);

  const rows = await getDb()
    .select({
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      customerFirstName: customers.firstName,
      id: orders.id,
      lastUpdatedAt: orders.updatedAt,
      orderNumber: orders.orderNumber,
      preferredLanguage: customers.preferredLanguage,
      productDescription: orders.productDescription,
      status: orders.status,
      trackingLinkVersion: orders.trackingLinkVersion,
      trackingNumber: orders.trackingNumber
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        isNull(orders.archivedAt),
        isNull(customers.archivedAt),
        eq(customers.emailNormalized, normalizedEmail),
        or(eq(orders.orderNumber, normalizedOrderNumber), eq(orders.trackingNumber, normalizedTrackingNumber))
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

async function findPublicOrderById(orderId: string) {
  const rows = await getDb()
    .select({
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      customerFirstName: customers.firstName,
      id: orders.id,
      lastUpdatedAt: orders.updatedAt,
      orderNumber: orders.orderNumber,
      preferredLanguage: customers.preferredLanguage,
      productDescription: orders.productDescription,
      status: orders.status,
      trackingLinkVersion: orders.trackingLinkVersion,
      trackingNumber: orders.trackingNumber
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(and(isNull(orders.archivedAt), isNull(customers.archivedAt), eq(orders.id, orderId)))
    .limit(1);

  return rows[0] ?? null;
}

export function parseManualLookupInput(input: unknown) {
  const result = manualLookupSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  return result.data;
}

export async function lookupTrackingOrder(input: unknown, headers: Headers): Promise<TrackingLookupResult> {
  const parsed = parseManualLookupInput(input);
  const secret = getTrackingSecret();
  const ipAddress = readClientIp(headers);
  const userAgent = readUserAgent(headers);

  if (!parsed) {
    return { ok: false, reason: "invalid" };
  }

  const emailHash = hashLookupValue(parsed.email, secret);
  const identifierHash = hashLookupValue(parsed.identifier, secret);
  const ipHash = hashLookupValue(ipAddress, secret);
  const userAgentHash = hashLookupValue(userAgent, secret);
  const identityHash = hashLookupValue(`${parsed.identifier}:${parsed.email}`, secret);

  const rateLimit = await checkTrackingLookupRateLimit(ipHash, identityHash);
  if (!rateLimit.ok) {
    await logLookupAttempt({ emailHash, identifierHash, ipHash, result: "rate_limited", userAgentHash });
    return { ok: false, reason: "rate_limited" };
  }

  const turnstile = await verifyTurnstileToken(parsed.turnstileToken, ipAddress);
  if (!turnstile.ok) {
    await logLookupAttempt({ emailHash, identifierHash, ipHash, result: "turnstile_failed", userAgentHash });
    return { ok: false, reason: "turnstile_failed" };
  }

  const row = await findPublicOrderByManualLookup(parsed.identifier, parsed.email);
  if (!row) {
    await logLookupAttempt({ emailHash, identifierHash, ipHash, result: "not_found", userAgentHash });
    return { ok: false, reason: "not_found" };
  }

  const token = await createTrackingToken({ orderId: row.id, tokenVersion: row.trackingLinkVersion }, secret);
  await logLookupAttempt({ emailHash, identifierHash, ipHash, result: "success", userAgentHash });

  return {
    ok: true,
    order: toPublicTrackingOrder(row),
    token
  };
}

export async function getTrackingOrderByToken(token: string): Promise<TrackingLookupResult> {
  const secret = getTrackingSecret();
  const payload = await verifyTrackingToken(token, secret);

  if (!payload) {
    return { ok: false, reason: "token_invalid" };
  }

  const row = await findPublicOrderById(payload.orderId);

  if (!row || !isTrackingTokenVersionCurrent(payload, row.trackingLinkVersion)) {
    return { ok: false, reason: "token_invalid" };
  }

  return {
    ok: true,
    order: toPublicTrackingOrder(row),
    token
  };
}

export function getTrackingUrl(token: string) {
  return `/track/${encodeURIComponent(token)}`;
}
