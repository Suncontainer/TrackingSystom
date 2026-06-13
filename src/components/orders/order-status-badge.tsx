import { orderStatusContent, type OrderStatus } from "@/features/orders/status";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return <span className={`order-status order-status--${status.toLowerCase()}`}>{orderStatusContent[status].de.label}</span>;
}
