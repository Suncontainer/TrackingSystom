import { CalendarDays, Mail, PackageCheck } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import type { PublicTrackingOrder } from "@/features/tracking/lookup";
import { getOrderStatusIndex, orderStatusContent, orderStatuses } from "@/features/orders/status";
import { getPublicDictionary } from "@/i18n/get-locale";

type TrackingResultProps = {
  order: PublicTrackingOrder;
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function TrackingResult({ order }: TrackingResultProps) {
  const locale = order.locale;
  const dictionary = getPublicDictionary(locale);
  const currentStatusIndex = getOrderStatusIndex(order.status);
  const statusCopy = orderStatusContent[order.status][locale];
  const productDescription = order.productDescription ?? dictionary.result.productFallback;

  return (
    <section className="tracking-result" aria-labelledby="tracking-result-title">
      <div className="tracking-result__heading">
        <p className="eyebrow">
          <PackageCheck size={20} aria-hidden="true" />
          {dictionary.result.eyebrow}
        </p>
        <h1 id="tracking-result-title" className="font-heading">
          {dictionary.result.greeting.replace("{name}", order.customerFirstName)}
        </h1>
        <p>{statusCopy.message}</p>
      </div>

      <div className="tracking-summary" aria-label={dictionary.result.summaryAriaLabel}>
        <div>
          <span>{dictionary.result.orderNumber}</span>
          <strong>{order.orderNumber}</strong>
        </div>
        <div>
          <span>{dictionary.result.trackingNumber}</span>
          <strong>{order.formattedTrackingNumber}</strong>
        </div>
        <div>
          <span>{dictionary.result.product}</span>
          <strong>{productDescription}</strong>
        </div>
        <div>
          <span>{dictionary.result.currentStatus}</span>
          <strong>{statusCopy.label}</strong>
        </div>
      </div>

      <ol className="tracking-timeline" aria-label={dictionary.result.timelineAriaLabel}>
        {orderStatuses.map((status, index) => {
          const content = orderStatusContent[status][locale];
          const isComplete = index <= currentStatusIndex;

          return (
            <li className={isComplete ? "tracking-timeline__item tracking-timeline__item--complete" : "tracking-timeline__item"} key={status}>
              <span aria-hidden="true">{index + 1}</span>
              <strong>{content.label}</strong>
            </li>
          );
        })}
      </ol>

      <div className="tracking-details">
        <div>
          <CalendarDays size={20} aria-hidden="true" />
          <span>{dictionary.result.estimatedDelivery}</span>
          <strong>{formatDate(order.currentEstimatedDeliveryDate, locale)}</strong>
        </div>
        <div>
          <CalendarDays size={20} aria-hidden="true" />
          <span>{dictionary.result.lastUpdated}</span>
          <strong>{formatDate(order.lastUpdatedAt, locale)}</strong>
        </div>
        <div>
          <Mail size={20} aria-hidden="true" />
          <span>{dictionary.result.support}</span>
          <Link href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</Link>
        </div>
      </div>

      <p className="tracking-notice">{dictionary.result.estimateNotice}</p>
    </section>
  );
}
