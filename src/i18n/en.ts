import type { PublicDictionary } from "./types";

export const en = {
  localeName: "English",
  lookup: {
    eyebrow: "Customer portal",
    formAriaLabel: "Order lookup",
    title: "Track your order",
    intro:
      "Check the current status of your Sun Container order with your order or tracking number.",
    identifierLabel: "Order or tracking number",
    identifierPlaceholder: "e.g. SC-2026-000001",
    emailLabel: "Email address",
    emailPlaceholder: "name@company.com",
    submit: "Check status",
    privacy: "Privacy",
    fallback: "Contact: info@suncontainer.de",
    mainSite: "Main website"
  },
  result: {
    currentStatus: "Current status",
    estimateNotice: "Delivery dates are current estimates and may change as the order progresses.",
    estimatedDelivery: "Estimated delivery",
    eyebrow: "Tracking status",
    greeting: "Hello {name}, your order is on its way.",
    lastUpdated: "Last updated",
    orderNumber: "Order number",
    product: "Product",
    productFallback: "Sun Container order",
    support: "Support",
    summaryAriaLabel: "Order summary",
    timelineAriaLabel: "Progress",
    trackingNumber: "Tracking number"
  }
} satisfies PublicDictionary;
