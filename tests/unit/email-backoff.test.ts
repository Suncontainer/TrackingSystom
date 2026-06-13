import { describe, expect, it } from "vitest";

import { getNextAttemptAt, getStaleProcessingCutoff } from "@/features/email/backoff";

describe("email retry backoff", () => {
  const now = new Date("2026-06-14T10:00:00.000Z");

  it("uses deterministic backoff windows by attempt count", () => {
    expect(getNextAttemptAt(1, now).toISOString()).toBe("2026-06-14T10:05:00.000Z");
    expect(getNextAttemptAt(2, now).toISOString()).toBe("2026-06-14T10:30:00.000Z");
    expect(getNextAttemptAt(4, now).toISOString()).toBe("2026-06-14T22:00:00.000Z");
  });

  it("recovers processing locks after the stale window", () => {
    expect(getStaleProcessingCutoff(now).toISOString()).toBe("2026-06-14T09:45:00.000Z");
  });
});
