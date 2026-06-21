import { describe, expect, it } from "vitest";

import { toPublicOrderSnapshot } from "@/features/orders/public-dto";

describe("public order dto", () => {
  it("keeps customer-facing fields only and excludes internal notes or audit data", () => {
    const snapshot = toPublicOrderSnapshot({
      currentEstimatedDeliveryDate: "2026-08-12",
      currentEstimatedDeliveryDateEnd: "2026-08-19",
      orderNumber: "SC-2026-000123",
      preferredLanguage: "de",
      productDescription: "40ft HC container",
      status: "IN_TRANSIT",
      trackingNumber: "SC7K9M4XPQ82DH"
    });

    expect(snapshot).toEqual({
      currentEstimatedDeliveryDate: "2026-08-12",
      currentEstimatedDeliveryDateEnd: "2026-08-19",
      locale: "de",
      orderNumber: "SC-2026-000123",
      productDescription: "40ft HC container",
      status: "IN_TRANSIT",
      trackingNumber: "SC7K9M4XPQ82DH"
    });
    expect("notes" in snapshot).toBe(false);
    expect("auditHistory" in snapshot).toBe(false);
    expect("assignedSalespersonEmail" in snapshot).toBe(false);
  });
});
