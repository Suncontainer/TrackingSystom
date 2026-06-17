import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { routes } from "@/config/routes";
import { AuthorizationError } from "@/features/auth/errors";
import { requirePermission } from "@/features/auth/guards";
import { hasPermission } from "@/features/auth/permissions";
import {
  sendOptionalEmailAction,
  updateCustomerCommunicationPreferencesAction
} from "@/features/email/actions";
import {
  getCustomerOptionalEmailState,
  isOptionalEmailEligible,
  optionalEmailDefinitions,
  optionalEmailTypes
} from "@/features/email/optional";
import { getCustomerDetail } from "@/features/orders/service";
import { getAdminContext } from "@/i18n/get-admin-locale";
import type { AppLocale } from "@/i18n/types";
import { NotFoundError } from "@/lib/errors/app-error";

export const metadata = {
  title: "Kundendetails"
};

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

function formatDate(value: string | Date | null, locale: AppLocale) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" }).format(new Date(value));
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = await params;
  const { locale, t } = await getAdminContext();
  const c = t.forms.customerDetail;
  const detail = await loadCustomerPageData(customerId);

  return (
    <AdminPageShell eyebrow={c.eyebrow} title={detail.customerName}>
      <section className="admin-card admin-section">
        <div className="detail-grid">
          <div>
            <p className="detail-label">{c.email}</p>
            <p>{detail.customer.email}</p>
          </div>
          <div>
            <p className="detail-label">{c.phone}</p>
            <p>{detail.customer.phone || "—"}</p>
          </div>
          <div>
            <p className="detail-label">{c.language}</p>
            <p>{detail.customer.preferredLanguage.toUpperCase()}</p>
          </div>
          <div>
            <p className="detail-label">{c.updated}</p>
            <p>{formatDate(detail.customer.updatedAt, locale)}</p>
          </div>
        </div>
      </section>

      {detail.canManageOptionalEmail ? (
        <section className="admin-card admin-section">
          <div className="section-heading">
            <h2 className="font-heading">{c.optionalHeading}</h2>
            <p>{c.optionalIntro}</p>
          </div>

          <form action={updateCustomerCommunicationPreferencesAction} className="form-grid">
            <input type="hidden" name="customerId" value={detail.customer.id} />
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="reviewRequestAllowed"
                defaultChecked={detail.optionalEmailState.preferences.reviewRequestAllowed}
              />
              {c.reviewRequestAllowed}
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="satisfactionSurveyAllowed"
                defaultChecked={detail.optionalEmailState.preferences.satisfactionSurveyAllowed}
              />
              {c.satisfactionSurveyAllowed}
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="maintenanceRecommendationAllowed"
                defaultChecked={detail.optionalEmailState.preferences.maintenanceRecommendationAllowed}
              />
              {c.maintenanceRecommendationAllowed}
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name="warrantyReminderAllowed"
                defaultChecked={detail.optionalEmailState.preferences.warrantyReminderAllowed}
              />
              {c.warrantyReminderAllowed}
            </label>
            <label className="checkbox-row checkbox-row--muted">
              <input type="checkbox" disabled />
              {c.promotionDisabled}
            </label>
            <button type="submit" className="button-base button-primary">{c.savePreferences}</button>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{c.colTemplate}</th>
                  <th>{c.colStatus}</th>
                  <th>{c.colSoFar}</th>
                  <th>{c.colPreview}</th>
                  <th>{c.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {optionalEmailTypes.map((emailType) => {
                  const definition = optionalEmailDefinitions[emailType];
                  const preferenceAllowed = detail.optionalEmailState.preferences[definition.preferenceKey];
                  const eligible = isOptionalEmailEligible({
                    emailType,
                    lastDeliveredOrderId: detail.optionalEmailState.lastDeliveredOrderId,
                    preferenceAllowed,
                    suppressed: detail.optionalEmailState.suppressed
                  });

                  return (
                    <tr key={emailType}>
                      <td>
                        <div className="table-primary">{definition.label}</div>
                        <div className="table-secondary">{definition.subject}</div>
                      </td>
                      <td>{eligible ? c.ready : c.blocked}</td>
                      <td>{detail.optionalEmailState.sentCounts[emailType]}</td>
                      <td>{definition.preview}</td>
                      <td>
                        {eligible ? (
                          <form action={sendOptionalEmailAction}>
                            <input type="hidden" name="customerId" value={detail.customer.id} />
                            <input type="hidden" name="emailType" value={emailType} />
                            <input type="hidden" name="previewed" value="yes" />
                            <label className="checkbox-row">
                              <input type="checkbox" name="confirmed" value="yes" required />
                              {c.confirmed}
                            </label>
                            <button type="submit" className="auth-link">{c.send}</button>
                          </form>
                        ) : (
                          c.notAvailable
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{c.ordersHeading}</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{c.colOrderNumber}</th>
                <th>{c.colTracking}</th>
                <th>{c.colStatus}</th>
                <th>{c.colDelivery}</th>
                <th>{c.colUpdated}</th>
              </tr>
            </thead>
            <tbody>
              {detail.orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={routes.admin.orderDetails(order.id)}>{order.orderNumber}</Link>
                  </td>
                  <td>{order.trackingNumberDisplay}</td>
                  <td>
                    <OrderStatusBadge status={order.status} locale={locale} />
                  </td>
                  <td>{formatDate(order.currentEstimatedDeliveryDate, locale)}</td>
                  <td>{formatDate(order.updatedAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminPageShell>
  );
}

async function loadCustomerPageData(customerId: string) {
  try {
    const profile = await requirePermission("orders:read");
    const detail = await getCustomerDetail(customerId, profile);

    return {
      ...detail,
      canManageOptionalEmail: hasPermission(profile.role, "emails:send-optional"),
      optionalEmailState: await getCustomerOptionalEmailState(customerId)
    };
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}
