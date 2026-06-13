// @vitest-environment node

import { decodeJwt } from "jose";
import { describe, expect, it } from "vitest";

import {
  createTrackingToken,
  isTrackingTokenVersionCurrent,
  trackingTokenPurpose,
  verifyTrackingToken
} from "@/features/tracking/tokens";

describe("tracking tokens", () => {
  const secret = "test-secret-at-least-long-enough-for-hmac";

  it("signs only non-PII claims needed for public tracking", async () => {
    const token = await createTrackingToken(
      {
        orderId: "90000000-0000-4000-8000-000000000123",
        tokenVersion: 3
      },
      secret
    );

    const decoded = decodeJwt(token);

    expect(decoded).toMatchObject({
      purpose: trackingTokenPurpose,
      sub: "90000000-0000-4000-8000-000000000123",
      ver: 3
    });
    expect(decoded).not.toHaveProperty("email");
    expect(decoded).not.toHaveProperty("name");
    expect(decoded).not.toHaveProperty("productDescription");
  });

  it("rejects tokens signed with another secret", async () => {
    const token = await createTrackingToken(
      {
        orderId: "90000000-0000-4000-8000-000000000123",
        tokenVersion: 1
      },
      secret
    );

    await expect(verifyTrackingToken(token, "different-secret")).resolves.toBeNull();
  });

  it("exposes token version comparison for link invalidation", async () => {
    const token = await createTrackingToken(
      {
        orderId: "90000000-0000-4000-8000-000000000123",
        tokenVersion: 1
      },
      secret
    );
    const payload = await verifyTrackingToken(token, secret);

    expect(payload).not.toBeNull();
    expect(isTrackingTokenVersionCurrent(payload!, 1)).toBe(true);
    expect(isTrackingTokenVersionCurrent(payload!, 2)).toBe(false);
  });
});
