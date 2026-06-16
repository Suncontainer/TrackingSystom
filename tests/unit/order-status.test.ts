import { describe, expect, it } from "vitest";

import {
  getNextOrderStatus,
  isStandardForwardTransition,
  orderStatusContent,
  orderStatuses
} from "@/features/orders/status";

describe("order status foundation", () => {
  it("keeps the MVP statuses in the approved order", () => {
    expect(orderStatuses).toEqual([
      "ORDER_CONFIRMED",
      "PROCUREMENT",
      "IN_PRODUCTION",
      "IN_TRANSIT",
      "DELIVERED"
    ]);
  });

  it("returns the next standard status", () => {
    expect(getNextOrderStatus("ORDER_CONFIRMED")).toBe("PROCUREMENT");
    expect(getNextOrderStatus("PROCUREMENT")).toBe("IN_PRODUCTION");
    expect(getNextOrderStatus("DELIVERED")).toBeNull();
  });

  it("allows only one-step standard forward transitions", () => {
    expect(isStandardForwardTransition("ORDER_CONFIRMED", "PROCUREMENT")).toBe(true);
    expect(isStandardForwardTransition("ORDER_CONFIRMED", "IN_TRANSIT")).toBe(false);
    expect(isStandardForwardTransition("IN_TRANSIT", "IN_PRODUCTION")).toBe(false);
  });

  it("has German and English customer-facing copy for every status", () => {
    for (const status of orderStatuses) {
      expect(orderStatusContent[status].de.label).toBeTruthy();
      expect(orderStatusContent[status].de.message).toBeTruthy();
      expect(orderStatusContent[status].en.label).toBeTruthy();
      expect(orderStatusContent[status].en.message).toBeTruthy();
    }
  });
});
