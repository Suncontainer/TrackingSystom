export const orderStatuses = [
  "ORDER_RECEIVED",
  "IN_PRODUCTION",
  "IN_TRANSIT",
  "DELIVERED"
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type Locale = "de" | "en";

export const orderStatusContent = {
  ORDER_RECEIVED: {
    de: {
      label: "Auftrag eingegangen",
      message: "Ihr Auftrag wurde erfolgreich aufgenommen."
    },
    en: {
      label: "Order received",
      message: "Your order has been received."
    }
  },
  IN_PRODUCTION: {
    de: {
      label: "In Produktion",
      message: "Ihr Auftrag befindet sich derzeit in Produktion."
    },
    en: {
      label: "In production",
      message: "Your order is currently in production."
    }
  },
  IN_TRANSIT: {
    de: {
      label: "Unterwegs",
      message: "Ihr Auftrag wurde versandt und befindet sich auf dem Weg zu Ihnen."
    },
    en: {
      label: "In transit",
      message: "Your order is currently in transit."
    }
  },
  DELIVERED: {
    de: {
      label: "Geliefert",
      message: "Ihr Auftrag wurde erfolgreich geliefert."
    },
    en: {
      label: "Delivered",
      message: "Your order has been delivered."
    }
  }
} satisfies Record<OrderStatus, Record<Locale, { label: string; message: string }>>;

export function getOrderStatusIndex(status: OrderStatus) {
  return orderStatuses.indexOf(status);
}

export function getNextOrderStatus(status: OrderStatus) {
  const nextStatus = orderStatuses[getOrderStatusIndex(status) + 1];
  return nextStatus ?? null;
}

export function isStandardForwardTransition(from: OrderStatus, to: OrderStatus) {
  return getOrderStatusIndex(to) - getOrderStatusIndex(from) === 1;
}
