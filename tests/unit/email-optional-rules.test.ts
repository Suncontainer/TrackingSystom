import { describe, expect, it } from "vitest";

import { isOptionalEmailEligible } from "@/features/email/optional-rules";

describe("optional email eligibility", () => {
  it("requires opt-in, no suppression, and a delivered order", () => {
    expect(
      isOptionalEmailEligible({
        emailType: "REVIEW_REQUEST",
        lastDeliveredOrderId: "order-1",
        preferenceAllowed: true,
        suppressed: false
      })
    ).toBe(true);

    expect(
      isOptionalEmailEligible({
        emailType: "REVIEW_REQUEST",
        lastDeliveredOrderId: "order-1",
        preferenceAllowed: false,
        suppressed: false
      })
    ).toBe(false);

    expect(
      isOptionalEmailEligible({
        emailType: "REVIEW_REQUEST",
        lastDeliveredOrderId: "order-1",
        preferenceAllowed: true,
        suppressed: true
      })
    ).toBe(false);

    expect(
      isOptionalEmailEligible({
        emailType: "REVIEW_REQUEST",
        lastDeliveredOrderId: null,
        preferenceAllowed: true,
        suppressed: false
      })
    ).toBe(false);
  });

  it("keeps promotional email disabled in the MVP", () => {
    expect(
      isOptionalEmailEligible({
        emailType: "PROMOTIONAL",
        lastDeliveredOrderId: "order-1",
        preferenceAllowed: true,
        suppressed: false
      })
    ).toBe(false);
  });
});
