import { CalendarDays, Mail, PackageCheck } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import type { PublicTrackingOrder } from "@/features/tracking/lookup";
import { getOrderStatusIndex, orderStatusContent, orderStatusIcon, orderStatuses } from "@/features/orders/status";
import { getPublicDictionary } from "@/i18n/get-locale";
import type { AppLocale } from "@/i18n/types";

type TrackingResultProps = {
  order: PublicTrackingOrder;
  locale: AppLocale;
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatDateRange(start: string, end: string, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    dateStyle: "medium"
  });

  if (!end || start === end) {
    return formatter.format(new Date(start));
  }

  return formatter.formatRange(new Date(start), new Date(end));
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

          return (
            <li className={isComplete ? "tracking-timeline__item tracking-timeline__item--complete" : "tracking-timeline__item"} key={status}>
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

      <div className="tracking-details">
        <div>
          <CalendarDays size={20} aria-hidden="true" />
          <span>{dictionary.result.estimatedDelivery}</span>
          <strong>
            {formatDateRange(order.currentEstimatedDeliveryDate, order.currentEstimatedDeliveryDateEnd, locale)}
          </strong>
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
