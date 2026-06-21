import type { AppLocale } from "@/i18n/types";
import type { DbOrderStatus } from "@/db/schema";

type PublicOrderSnapshotInput = {
  currentEstimatedDeliveryDate: string;
  currentEstimatedDeliveryDateEnd: string;
  orderNumber: string;
  preferredLanguage: AppLocale;
  productDescription: string | null;
  status: DbOrderStatus;
  trackingNumber: string;
};

export function toPublicOrderSnapshot(input: PublicOrderSnapshotInput) {
  return {
    currentEstimatedDeliveryDate: input.currentEstimatedDeliveryDate,
    currentEstimatedDeliveryDateEnd: input.currentEstimatedDeliveryDateEnd,
    locale: input.preferredLanguage,
    orderNumber: input.orderNumber,
    productDescription: input.productDescription,
    status: input.status,
    trackingNumber: input.trackingNumber
  };
}
