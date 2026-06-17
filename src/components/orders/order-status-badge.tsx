import { orderStatusContent, type OrderStatus } from "@/features/orders/status";
import type { AppLocale } from "@/i18n/types";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  locale?: AppLocale;
};

export function OrderStatusBadge({ status, locale = "de" }: OrderStatusBadgeProps) {
  return <span className={`order-status order-status--${status.toLowerCase()}`}>{orderStatusContent[status][locale].label}</span>;
}
