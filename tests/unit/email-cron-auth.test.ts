import { describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "@/features/email/cron-auth";

describe("email cron authorization", () => {
  it("accepts the configured bearer token", () => {
    const headers = new Headers({ authorization: "Bearer cron-secret" });

    expect(isAuthorizedCronRequest(headers, "cron-secret")).toBe(true);
  });

  it("rejects missing, malformed, or mismatched tokens", () => {
    expect(isAuthorizedCronRequest(new Headers(), "cron-secret")).toBe(false);
    expect(isAuthorizedCronRequest(new Headers({ authorization: "cron-secret" }), "cron-secret")).toBe(false);
    expect(isAuthorizedCronRequest(new Headers({ authorization: "Bearer wrong-secret" }), "cron-secret")).toBe(false);
    expect(isAuthorizedCronRequest(new Headers({ authorization: "Bearer cron-secret" }), undefined)).toBe(false);
  });
});
