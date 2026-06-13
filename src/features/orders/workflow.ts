import type { DbOrderStatus, EmailType } from "@/db/schema";

import { getNextOrderStatus, isStandardForwardTransition } from "./status";

export const customerEmailDecisionValues = ["send", "skip"] as const;
export type CustomerEmailDecision = (typeof customerEmailDecisionValues)[number];

export function getStatusEmailType(status: DbOrderStatus): EmailType {
  switch (status) {
    case "ORDER_RECEIVED":
      return "ORDER_RECEIVED";
    case "IN_PRODUCTION":
      return "PRODUCTION_STARTED";
    case "IN_TRANSIT":
      return "IN_TRANSIT";
    case "DELIVERED":
      return "DELIVERED";
  }
}

export function isOverrideStatusTransition(currentStatus: DbOrderStatus, nextStatus: DbOrderStatus) {
  return !isStandardForwardTransition(currentStatus, nextStatus);
}

export function getPermittedStandardNextStatus(status: DbOrderStatus) {
  return getNextOrderStatus(status);
}

export function shouldQueueStatusCustomerEmail(params: {
  currentStatus: DbOrderStatus;
  decision: CustomerEmailDecision | null;
  nextStatus: DbOrderStatus;
}) {
  if (!isOverrideStatusTransition(params.currentStatus, params.nextStatus)) {
    return true;
  }

  return params.decision === "send";
}

export function getDeliveredFields(nextStatus: DbOrderStatus, requestedActualDeliveryDate: string | null) {
  if (nextStatus !== "DELIVERED") {
    return {
      actualDeliveryDate: null,
      deliveredAt: null
    };
  }

  return {
    actualDeliveryDate: requestedActualDeliveryDate,
    deliveredAt: new Date()
  };
}
