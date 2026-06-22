import { CalendarDays, PackageCheck } from "lucide-react";

import type { PublicTrackingOrder } from "@/features/tracking/lookup";
import { getOrderStatusIndex, orderStatusContent, orderStatusIcon, orderStatuses } from "@/features/orders/status";
import { getPublicDictionary } from "@/i18n/get-locale";
import type { AppLocale } from "@/i18n/types";

type TrackingResultProps = {
  order: PublicTrackingOrder;
  locale: AppLocale;
};

function formatDateRange(start: string, end: string, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    dateStyle: "medium"
  });

  if (!end || start === end) {
    return formatter.format(new Date(start));
  }

  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

export function TrackingResult({ order, locale }: TrackingResultProps) {
  const dictionary = getPublicDictionary(locale);
  const currentStatusIndex = getOrderStatusIndex(order.status);
  const statusCopy = orderStatusContent[order.status][locale];

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

      <ol className="tracking-timeline" aria-label={dictionary.result.timelineAriaLabel}>
        {orderStatuses.map((status, index) => {
          const content = orderStatusContent[status][locale];
          const isComplete = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          const itemClass = [
            "tracking-timeline__item",
            isComplete ? "tracking-timeline__item--complete" : "",
            isCurrent ? "tracking-timeline__item--current" : ""
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li className={itemClass} key={status}>
              <video
                className="tracking-timeline__icon"
                src={orderStatusIcon[status]}
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
              />
              <strong>{content.label}</strong>
            </li>
          );
        })}
      </ol>

      <div className="tracking-details tracking-details--single">
        <div>
          <CalendarDays size={20} aria-hidden="true" />
          <span>{dictionary.result.estimatedDelivery}</span>
          <strong>
            {formatDateRange(order.currentEstimatedDeliveryDate, order.currentEstimatedDeliveryDateEnd, locale)}
          </strong>
        </div>
      </div>

      {order.images.length > 0 ? (
        <div className="tracking-images">
          <p className="eyebrow">{dictionary.result.productImages}</p>
          <div className="tracking-images__grid">
            {order.images.map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" key={image.id} loading="lazy" src={image.url} />
            ))}
          </div>
        </div>
      ) : null}

      <p className="tracking-notice">{dictionary.result.estimateNotice}</p>
    </section>
  );
}
