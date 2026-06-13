import { orderStatusContent } from "@/features/orders/status";
import type { toPublicOrderSnapshot } from "@/features/orders/public-dto";

type CustomerPreviewProps = {
  snapshot: ReturnType<typeof toPublicOrderSnapshot>;
};

export function CustomerPreview({ snapshot }: CustomerPreviewProps) {
  const content = orderStatusContent[snapshot.status][snapshot.locale];

  return (
    <div className="customer-preview">
      <div>
        <p className="detail-label">Kundenansicht</p>
        <h3 className="font-heading">{content.label}</h3>
        <p>{content.message}</p>
      </div>
      <dl>
        <div>
          <dt>Auftrag</dt>
          <dd>{snapshot.orderNumber}</dd>
        </div>
        <div>
          <dt>Tracking</dt>
          <dd>{snapshot.trackingNumber}</dd>
        </div>
        <div>
          <dt>Lieferprognose</dt>
          <dd>{snapshot.currentEstimatedDeliveryDate}</dd>
        </div>
      </dl>
    </div>
  );
}
