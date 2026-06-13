import { describe, expect, it } from "vitest";

import {
  formatOrderNumber,
  formatTrackingNumber,
  generateTrackingNumber,
  normalizeManualOrderNumber,
  normalizeTrackingNumber,
  validateManualOrderNumber
} from "@/features/orders/identifiers";
import { parseOrderListFilters } from "@/features/orders/filters";
import { ValidationError } from "@/lib/errors/app-error";

describe("order identifiers", () => {
  it("formats order numbers with the approved SC-year-sequence shape", () => {
    expect(formatOrderNumber(2026, 1)).toBe("SC-2026-000001");
    expect(formatOrderNumber(2026, 42, "SUN")).toBe("SUN-2026-000042");
  });

  it("normalizes and validates manual order numbers", () => {
    expect(normalizeManualOrderNumber("  sc-2026-000321 ")).toBe("SC-2026-000321");
    expect(validateManualOrderNumber("sc-2026-000321")).toBe("SC-2026-000321");
    expect(() => validateManualOrderNumber("bad-value")).toThrow(ValidationError);
  });

  it("generates tracking numbers with the non-ambiguous alphabet and expected format", () => {
    const trackingNumber = generateTrackingNumber();

    expect(trackingNumber).toMatch(/^SC[A-HJ-NP-Z2-9]{12}$/);
    expect(formatTrackingNumber(trackingNumber)).toMatch(/^SC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("normalizes and re-formats tracking numbers with or without separators", () => {
    expect(normalizeTrackingNumber("sc-7k9m-4xpq-82dh")).toBe("SC7K9M4XPQ82DH");
    expect(formatTrackingNumber("SC7K9M4XPQ82DH")).toBe("SC-7K9M-4XPQ-82DH");
  });
});

describe("order list filters", () => {
  it("normalizes pagination, booleans, and defaults", () => {
    expect(parseOrderListFilters({})).toEqual({
      archived: "active",
      dateFrom: "",
      dateTo: "",
      overdue: false,
      page: 1,
      query: "",
      salespersonId: "",
      sort: "updated_desc",
      status: ""
    });

    expect(
      parseOrderListFilters({
        archived: "all",
        dateFrom: "2026-01-01",
        dateTo: "2026-02-01",
        overdue: "1",
        page: "3",
        query: " SC-2026",
        salespersonId: "profile-1",
        sort: "eta_asc",
        status: "IN_TRANSIT"
      })
    ).toEqual({
      archived: "all",
      dateFrom: "2026-01-01",
      dateTo: "2026-02-01",
      overdue: true,
      page: 3,
      query: "SC-2026",
      salespersonId: "profile-1",
      sort: "eta_asc",
      status: "IN_TRANSIT"
    });
  });
});
