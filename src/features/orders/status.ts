export const orderStatuses = [
  "ORDER_CONFIRMED",
  "PROCUREMENT",
  "IN_PRODUCTION",
  "IN_TRANSIT",
  "DELIVERED"
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type Locale = "de" | "en";

export const orderStatusContent = {
  ORDER_CONFIRMED: {
    de: {
      label: "Auftrag bestätigt",
      message: "Ihr Auftrag wurde erfolgreich bestätigt."
    },
    en: {
      label: "Order Confirmed",
      message: "Your order has been confirmed."
    }
  },
  PROCUREMENT: {
    de: {
      label: "Beschaffung läuft",
      message: "Die Beschaffung für Ihren Auftrag läuft."
    },
    en: {
      label: "Procurement in Progress",
      message: "Procurement for your order is in progress."
    }
  },
  IN_PRODUCTION: {
    de: {
      label: "In Produktion",
      message: "Ihr Auftrag befindet sich derzeit in Produktion."
    },
    en: {
      label: "In Production",
      message: "Your order is currently in production."
    }
  },
  IN_TRANSIT: {
    de: {
      label: "Im Transport",
      message: "Ihr Auftrag wurde versandt und befindet sich auf dem Weg zu Ihnen."
    },
    en: {
      label: "In Transit",
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

export const orderStatusIcon = {
  ORDER_CONFIRMED: "/icons/order-confirmed.mp4",
  PROCUREMENT: "/icons/procurement.mp4",
  IN_PRODUCTION: "/icons/in-production.mp4",
  IN_TRANSIT: "/icons/in-transit.mp4",
  DELIVERED: "/icons/delivered.mp4"
} satisfies Record<OrderStatus, string>;

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
