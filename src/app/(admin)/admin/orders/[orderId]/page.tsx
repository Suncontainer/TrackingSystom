import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderImagesSection } from "@/components/orders/order-images-section";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderUpdateForm } from "@/components/orders/order-update-form";
import { StatusChangeForm } from "@/components/orders/status-change-form";
import { routes } from "@/config/routes";
import { AuthorizationError } from "@/features/auth/errors";
import { requireOrderAccess } from "@/features/auth/guards";
import { listOrderImages } from "@/features/orders/images";
import { getOrderDetail } from "@/features/orders/service";
import { listActiveSellers } from "@/features/sellers/service";
import { getAdminContext } from "@/i18n/get-admin-locale";
import type { AppLocale } from "@/i18n/types";
import { NotFoundError } from "@/lib/errors/app-error";

export const metadata = {
  title: "Auftragsdetails"
};

type OrderDetailsPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | Date | null, locale: AppLocale) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateRange(start: string | null, end: string | null, locale: AppLocale) {
  if (!start) {
    return "—";
  }

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" });

  if (!end || start === end) {
    return formatter.format(new Date(start));
  }

  return formatter.formatRange(new Date(start), new Date(end));
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrderDetailsPage({ params, searchParams }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const { locale, t } = await getAdminContext();
  const dt = t.forms.orderDetail;
  const query = (searchParams ? await searchParams : {}) ?? {};
  const { detail, sellers, images } = await loadOrderPageData(orderId);

  return (
    <AdminPageShell eyebrow={dt.eyebrow} title={detail.order.orderNumber}>
      {getSearchValue(query.created) === "1" ? (
        <p className="form-feedback" role="status">{dt.flashCreated}</p>
      ) : null}
      {getSearchValue(query.updated) === "1" ? (
        <p className="form-feedback" role="status">{dt.flashUpdated}</p>
      ) : null}
      {getSearchValue(query.noted) === "1" ? (
        <p className="form-feedback" role="status">{dt.flashNoted}</p>
      ) : null}
      {getSearchValue(query.statusChanged) === "1" ? (
        <p className="form-feedback" role="status">{dt.flashStatusChanged}</p>
      ) : null}
      {getSearchValue(query.emailSent) === "1" ? (
        <p className="form-feedback" role="status">{t.templates.send.flashSent}</p>
      ) : null}
      {getSearchValue(query.dateChanged) === "1" ? (
        <p className="form-feedback" role="status">{dt.flashDateChanged}</p>
      ) : null}
      {getSearchValue(query.archived) === "1" ? (
        <p className="form-feedback" role="status">{dt.flashArchived}</p>
      ) : null}
      {getSearchValue(query.restored) === "1" ? (
        <p className="form-feedback" role="status">{dt.flashRestored}</p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="detail-header">
          <div>
            <p className="detail-label">{dt.tracking}</p>
            <h2 className="font-heading">{detail.order.trackingNumberDisplay}</h2>
          </div>
          <OrderStatusBadge status={detail.order.status} locale={locale} />
        </div>
        <div className="detail-grid">
          <div>
            <p className="detail-label">{dt.customer}</p>
            <p>
              <Link href={routes.admin.customerDetails(detail.order.customerId)}>{detail.customerName}</Link>
            </p>
          </div>
          <div>
            <p className="detail-label">{dt.email}</p>
            <p>{detail.order.customerEmail}</p>
          </div>
          <div>
            <p className="detail-label">{dt.deliveryPlanned}</p>
            <p>
              {formatDateRange(
                detail.order.currentEstimatedDeliveryDate,
                detail.order.currentEstimatedDeliveryDateEnd,
                locale
              )}
            </p>
          </div>
          <div>
            <p className="detail-label">{dt.sales}</p>
            <p>{detail.order.assignedSalespersonLabel || detail.order.assignedSalespersonEmail || "—"}</p>
          </div>
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dt.statusChangeHeading}</h2>
          <p>{dt.statusChangeIntro}</p>
        </div>
        {detail.canUpdateWorkflow ? (
          <StatusChangeForm
            canOverride={detail.canOverrideStatus}
            currentEstimatedDeliveryDate={detail.order.currentEstimatedDeliveryDate}
            currentEstimatedDeliveryDateEnd={detail.order.currentEstimatedDeliveryDateEnd}
            currentStatus={detail.order.status}
            orderId={detail.order.id}
            version={detail.order.version}
            locale={locale}
            dict={t.forms.statusChange}
          />
        ) : (
          <p className="panel-empty">{dt.noStatusPermission}</p>
        )}
        {detail.canEdit ? (
          <OrderImagesSection dict={t.forms.orderImages} images={images} orderId={detail.order.id} />
        ) : null}
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dt.customerOrderHeading}</h2>
          <p>{dt.customerOrderIntro}</p>
        </div>
        {detail.canEdit ? (
          <OrderUpdateForm
            order={{
              assignedSalespersonEmail: detail.order.assignedSalespersonEmail,
              assignedSalespersonId: detail.order.assignedSalespersonId,
              customerEmail: detail.order.customerEmail,
              customerFirstName: detail.order.customerFirstName,
              customerLastName: detail.order.customerLastName,
              customerPhone: detail.order.customerPhone,
              id: detail.order.id,
              preferredLanguage: detail.order.preferredLanguage,
              productDescription: detail.order.productDescription,
              version: detail.order.version
            }}
            sellers={sellers}
            fields={t.forms.fields}
            saving={t.forms.saving}
            saveChanges={t.forms.update.saveChanges}
          />
        ) : (
          <div className="detail-grid">
            <div>
              <p className="detail-label">{dt.productDescription}</p>
              <p>{detail.order.productDescription || "—"}</p>
            </div>
            <div>
              <p className="detail-label">{dt.phone}</p>
              <p>{detail.order.customerPhone || "—"}</p>
            </div>
            <div>
              <p className="detail-label">{dt.language}</p>
              <p>{detail.order.preferredLanguage.toUpperCase()}</p>
            </div>
          </div>
        )}
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dt.statusHistoryHeading}</h2>
        </div>
        <div className="stack-list">
          {detail.statusHistory.map((entry) => (
            <article className="stack-list__item" key={entry.id}>
              <div className="stack-list__heading">
                <OrderStatusBadge status={entry.newStatus} locale={locale} />
                <span>{formatDate(entry.createdAt, locale)}</span>
              </div>
              <p className="table-secondary">
                {entry.changeType} · ETA {formatDate(entry.estimatedDeliveryDateSnapshot, locale)}
              </p>
              {entry.reason ? <p>{entry.reason}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dt.mandatoryEmailsHeading}</h2>
        </div>
        {detail.emailHistory.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{dt.colType}</th>
                  <th>{dt.colRecipient}</th>
                  <th>{dt.colStatus}</th>
                  <th>{dt.colAttempts}</th>
                  <th>{dt.colCreated}</th>
                </tr>
              </thead>
              <tbody>
                {detail.emailHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="table-primary">{entry.type}</div>
                      <div className="table-secondary">{entry.subject}</div>
                    </td>
                    <td>{entry.recipientEmail}</td>
                    <td>{entry.status}</td>
                    <td>{entry.attemptCount}</td>
                    <td>{formatDate(entry.createdAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="panel-empty">{dt.noEmailHistory}</p>
        )}
      </section>

    </AdminPageShell>
  );
}

async function loadOrderPageData(orderId: string) {
  try {
    const profile = await requireOrderAccess(orderId);
    const [detail, sellers, images] = await Promise.all([
      getOrderDetail(orderId, profile),
      listActiveSellers(),
      listOrderImages(orderId)
    ]);

    return { detail, sellers, images };
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}
