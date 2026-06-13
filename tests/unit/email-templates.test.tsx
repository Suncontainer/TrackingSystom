// @vitest-environment node

import { describe, expect, it } from "vitest";

import { renderEmailTemplate } from "@/features/email/templates";

describe("email templates", () => {
  const baseVariables = {
    customerEmail: "customer@example.com",
    customerName: "Ada Lovelace",
    estimatedDeliveryDate: "2026-07-10",
    orderAdminUrl: "https://example.com/admin/orders/order-1",
    orderNumber: "SC-2026-0001",
    productDescription: "20ft container",
    secureTrackingUrl: "https://example.com/track/token",
    trackingNumber: "SCT-ABC123"
  };

  it("renders customer order confirmation without internal notes", async () => {
    const rendered = await renderEmailTemplate({
      emailType: "ORDER_RECEIVED",
      locale: "de",
      templateVariables: baseVariables
    });

    expect(rendered.subject).toContain("Sun Container");
    expect(rendered.html).toContain("SC-2026-0001");
    expect(rendered.html).toContain("https://example.com/track/token");
    expect(rendered.text).toContain("SCT-ABC123");
    expect(rendered.html).not.toContain("internal");
    expect(rendered.text).not.toContain("internal");
  });

  it("renders mandatory status emails in English", async () => {
    const rendered = await renderEmailTemplate({
      emailType: "IN_TRANSIT",
      locale: "en",
      templateVariables: baseVariables
    });

    expect(rendered.subject).toBe("Your Order Is On The Way");
    expect(rendered.html).toContain("Your order is on the way");
    expect(rendered.text).toContain("https://example.com/track/token");
  });

  it("renders the internal salesperson notification with the admin link", async () => {
    const rendered = await renderEmailTemplate({
      emailType: "SALESPERSON_NEW_ORDER",
      locale: "de",
      templateVariables: baseVariables
    });

    expect(rendered.subject).toContain("SC-2026-0001");
    expect(rendered.text).toContain("customer@example.com");
    expect(rendered.html).toContain("https://example.com/admin/orders/order-1");
  });

  it("renders optional service emails after explicit opt-in flow", async () => {
    const rendered = await renderEmailTemplate({
      emailType: "REVIEW_REQUEST",
      locale: "de",
      templateVariables: baseVariables
    });

    expect(rendered.subject).toBe("Ihre Bewertung fuer Sun Container");
    expect(rendered.html).toContain("Wie war Ihre Erfahrung?");
    expect(rendered.text).toContain("https://example.com/track/token");
  });
});
