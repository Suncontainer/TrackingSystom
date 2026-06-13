import { describe, expect, it } from "vitest";

import { hashLookupValue, readClientIp } from "@/features/tracking/security";

describe("tracking lookup security helpers", () => {
  it("hashes lookup identifiers without preserving raw PII", () => {
    const hash = hashLookupValue("Customer@Example.com", "lookup-secret");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("Customer");
    expect(hash).not.toContain("example.com");
    expect(hash).toBe(hashLookupValue(" customer@example.com ", "lookup-secret"));
  });

  it("uses trusted deployment metadata before generic forwarded headers", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.2",
      "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1"
    });

    expect(readClientIp(headers)).toBe("203.0.113.10");
  });
});
