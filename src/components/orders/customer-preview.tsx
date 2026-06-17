import { orderStatusContent } from "@/features/orders/status";
import type { toPublicOrderSnapshot } from "@/features/orders/public-dto";
import type { AdminDictionary } from "@/i18n/admin";

type CustomerPreviewProps = {
  snapshot: ReturnType<typeof toPublicOrderSnapshot>;
  dict: AdminDictionary["forms"]["customerPreview"];
};

export function CustomerPreview({ snapshot, dict }: CustomerPreviewProps) {
  const content = orderStatusContent[snapshot.status][snapshot.locale];

  return (
    <div className="customer-preview">
      <div>
        <p className="detail-label">{dict.heading}</p>
        <h3 className="font-heading">{content.label}</h3>
        <p>{content.message}</p>
      </div>
      <dl>
        <div>
          <dt>{dict.order}</dt>
          <dd>{snapshot.orderNumber}</dd>
        </div>
        <div>
          <dt>{dict.tracking}</dt>
          <dd>{snapshot.trackingNumber}</dd>
        </div>
        <div>
          <dt>{dict.deliveryForecast}</dt>
          <dd>{snapshot.currentEstimatedDeliveryDate}</dd>
        </div>
      </dl>
    </div>
  );
}
