import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getServerEnv } from "@/config/env";

type RateLimitCheck = {
  ok: boolean;
  mode: "limited" | "skipped";
};

let ipLimiter: Ratelimit | null = null;
let identityLimiter: Ratelimit | null = null;

function createRedisClient() {
  const env = getServerEnv();

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  return new Redis({
    token: env.UPSTASH_REDIS_REST_TOKEN,
    url: env.UPSTASH_REDIS_REST_URL
  });
}

function getIpLimiter() {
  if (!ipLimiter) {
    const redis = createRedisClient();

    if (!redis) {
      return null;
    }

    ipLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      prefix: "tracking_lookup_ip"
    });
  }

  return ipLimiter;
}

function getIdentityLimiter() {
  if (!identityLimiter) {
    const redis = createRedisClient();

    if (!redis) {
      return null;
    }

    identityLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "tracking_lookup_identity"
    });
  }

  return identityLimiter;
}

export async function checkTrackingLookupRateLimit(ipHash: string | null, identityHash: string | null): Promise<RateLimitCheck> {
  if (process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL) {
    return { ok: true, mode: "skipped" };
  }

  const env = getServerEnv();
  const limiterChecks: Array<Promise<{ success: boolean }>> = [];

  const ipLimiterInstance = getIpLimiter();
  if (ipLimiterInstance && ipHash) {
    limiterChecks.push(ipLimiterInstance.limit(ipHash));
  }

  const identityLimiterInstance = getIdentityLimiter();
  if (identityLimiterInstance && identityHash) {
    limiterChecks.push(identityLimiterInstance.limit(identityHash));
  }

  if (limiterChecks.length === 0) {
    return env.NODE_ENV === "production" || env.VERCEL_ENV === "production"
      ? { ok: false, mode: "limited" }
      : { ok: true, mode: "skipped" };
  }

  const results = await Promise.all(limiterChecks);
  return {
    ok: results.every((result) => result.success),
    mode: "limited"
  };
}
