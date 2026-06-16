import { describe, expect, it } from "vitest";

import {
  getDeliveredFields,
  getPermittedStandardNextStatus,
  getStatusEmailType,
  isOverrideStatusTransition,
  shouldQueueStatusCustomerEmail
} from "@/features/orders/workflow";

describe("order workflow rules", () => {
  it("allows normal users to move forward one status at a time", () => {
    expect(getPermittedStandardNextStatus("ORDER_CONFIRMED")).toBe("PROCUREMENT");
    expect(getPermittedStandardNextStatus("PROCUREMENT")).toBe("IN_PRODUCTION");
    expect(getPermittedStandardNextStatus("IN_PRODUCTION")).toBe("IN_TRANSIT");
    expect(getPermittedStandardNextStatus("IN_TRANSIT")).toBe("DELIVERED");
    expect(getPermittedStandardNextStatus("DELIVERED")).toBeNull();
  });

  it("detects skipped or backward status changes as overrides", () => {
    expect(isOverrideStatusTransition("ORDER_CONFIRMED", "PROCUREMENT")).toBe(false);
    expect(isOverrideStatusTransition("ORDER_CONFIRMED", "IN_TRANSIT")).toBe(true);
    expect(isOverrideStatusTransition("IN_TRANSIT", "IN_PRODUCTION")).toBe(true);
  });

  it("maps statuses to mandatory email types", () => {
    expect(getStatusEmailType("ORDER_CONFIRMED")).toBe("ORDER_RECEIVED");
    expect(getStatusEmailType("PROCUREMENT")).toBe("PROCUREMENT_STARTED");
    expect(getStatusEmailType("IN_PRODUCTION")).toBe("PRODUCTION_STARTED");
    expect(getStatusEmailType("IN_TRANSIT")).toBe("IN_TRANSIT");
    expect(getStatusEmailType("DELIVERED")).toBe("DELIVERED");
  });

  it("never disables standard forward-transition customer emails", () => {
    expect(
      shouldQueueStatusCustomerEmail({
        currentStatus: "ORDER_CONFIRMED",
        decision: "skip",
        nextStatus: "PROCUREMENT"
      })
    ).toBe(true);
  });

  it("requires explicit override email decisions", () => {
    expect(
      shouldQueueStatusCustomerEmail({
        currentStatus: "IN_TRANSIT",
        decision: null,
        nextStatus: "IN_PRODUCTION"
      })
    ).toBe(false);
    expect(
      shouldQueueStatusCustomerEmail({
        currentStatus: "IN_TRANSIT",
        decision: "send",
        nextStatus: "IN_PRODUCTION"
      })
    ).toBe(true);
  });

  it("sets delivered fields only when entering delivered", () => {
    const delivered = getDeliveredFields("DELIVERED", "2026-09-12");
    const inTransit = getDeliveredFields("IN_TRANSIT", "2026-09-12");

    expect(delivered.actualDeliveryDate).toBe("2026-09-12");
    expect(delivered.deliveredAt).toBeInstanceOf(Date);
    expect(inTransit).toEqual({
      actualDeliveryDate: null,
      deliveredAt: null
    });
  });
});
