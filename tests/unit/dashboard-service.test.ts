import { describe, expect, it } from "vitest";

import { getDashboardPeriodStart, parseDashboardPeriod } from "@/features/dashboard/helpers";

describe("dashboard service helpers", () => {
  it("parses supported dashboard periods and defaults to 30 days", () => {
    expect(parseDashboardPeriod("7")).toBe("7");
    expect(parseDashboardPeriod("90")).toBe("90");
    expect(parseDashboardPeriod("365")).toBe("30");
    expect(parseDashboardPeriod(undefined)).toBe("30");
    expect(parseDashboardPeriod(["7", "90"])).toBe("7");
  });

  it("calculates period start dates from the selected day window", () => {
    expect(getDashboardPeriodStart("30", new Date("2026-06-13T12:00:00.000Z")).toISOString()).toBe(
      "2026-05-14T12:00:00.000Z"
    );
  });
});
