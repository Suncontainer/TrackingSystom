import { AlertTriangle, Boxes, CalendarClock, MailWarning, PackagePlus } from "lucide-react";
import type { ReactNode } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { hasPermission } from "@/features/auth/permissions";
import { parseDashboardPeriod, type DashboardPeriod } from "@/features/dashboard/helpers";
import { getDashboardData } from "@/features/dashboard/service";
import { orderStatusContent, orderStatusIcon } from "@/features/orders/status";
import { getAdminContext } from "@/i18n/get-admin-locale";
import type { AppLocale } from "@/i18n/types";
import Link from "next/link";

function statusVideoIcon(src: string): ReactNode {
  return (
    <video className="metric-icon__video" src={src} autoPlay loop muted playsInline aria-hidden="true" />
  );
}

export const metadata = {
  title: "Admin Dashboard"
};

type AdminDashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function dateLocale(locale: AppLocale) {
  return locale === "en" ? "en-GB" : "de-DE";
}

function formatDate(value: string | Date | null, locale: AppLocale) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(dateLocale(locale), { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | Date | null, locale: AppLocale) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(dateLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function buildPeriodHref(period: DashboardPeriod) {
  return `${routes.admin.home}?period=${period}`;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const profile = await requirePermission("dashboard:read");
  const { locale, t } = await getAdminContext();
  const params = searchParams ? await searchParams : {};
  const period = parseDashboardPeriod(params.period);
  const dashboard = await getDashboardData(profile, period);
  const canCreateOrders = hasPermission(profile.role, "orders:create");
  const d = t.dashboard;
  const metrics: Array<{ label: string; value: number; tone: string; icon: ReactNode }> = [
    { label: d.metricActiveOrders, value: dashboard.metrics.activeOrders, tone: "neutral", icon: <Boxes size={22} aria-hidden="true" /> },
    { label: d.metricOrderConfirmed, value: dashboard.metrics.orderConfirmed, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.ORDER_CONFIRMED) },
    { label: d.metricProcurement, value: dashboard.metrics.procurement, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.PROCUREMENT) },
    { label: d.metricInProduction, value: dashboard.metrics.inProduction, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.IN_PRODUCTION) },
    { label: d.metricInTransit, value: dashboard.metrics.inTransit, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.IN_TRANSIT) },
    { label: `${d.metricDeliveredInPeriod} (${period} ${d.days})`, value: dashboard.metrics.deliveredInPeriod, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.DELIVERED) },
    { label: d.metricOverdueActive, value: dashboard.metrics.overdueActive, tone: dashboard.metrics.overdueActive > 0 ? "warning" : "neutral", icon: <AlertTriangle size={22} aria-hidden="true" /> },
    { label: d.metricDueSoon, value: dashboard.metrics.dueSoon, tone: "neutral", icon: <CalendarClock size={22} aria-hidden="true" /> },
    {
      label: d.metricEmailWarnings,
      value: dashboard.metrics.failedMandatoryEmails,
      tone: dashboard.metrics.failedMandatoryEmails > 0 ? "danger" : "neutral",
      icon: <MailWarning size={22} aria-hidden="true" />
    }
  ];

  return (
    <AdminPageShell eyebrow={d.eyebrow} title={d.title}>
      <section className="admin-card admin-section dashboard-toolbar" aria-label={d.overviewHeading}>
        <div>
          <h2 className="font-heading">{d.overviewHeading}</h2>
          <p>{d.overviewIntro}</p>
        </div>
        <div className="dashboard-actions">
          <nav className="segmented-control" aria-label={d.periodAria}>
            <Link href={buildPeriodHref("7")} aria-current={period === "7" ? "true" : undefined}>
              7 {d.days}
            </Link>
            <Link href={buildPeriodHref("30")} aria-current={period === "30" ? "true" : undefined}>
              30 {d.days}
            </Link>
            <Link href={buildPeriodHref("90")} aria-current={period === "90" ? "true" : undefined}>
              90 {d.days}
            </Link>
          </nav>
          {canCreateOrders ? (
            <Link className="button-base button-primary" href={routes.admin.newOrder}>
              <PackagePlus size={18} aria-hidden="true" />
              {t.common.createOrder}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="admin-grid dashboard-metrics" aria-label="Kennzahlen">
        {metrics.map((metric) => (
          <article className={`admin-card metric-card metric-card--${metric.tone}`} key={metric.label}>
            <span className={`metric-icon metric-icon--${metric.tone}`}>{metric.icon}</span>
            <span className="metric-label">{metric.label}</span>
            <p className="metric-value">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-panels" aria-label={d.overdueHeading}>
        <article className="admin-card admin-section">
          <div className="section-heading section-heading--inline">
            <div>
              <h2 className="font-heading">
                <AlertTriangle size={20} aria-hidden="true" />
                {d.overdueHeading}
              </h2>
              <p>{d.overdueIntro}</p>
            </div>
            <Link href={`${routes.admin.orders}?overdue=1`} className="auth-link">
              {t.common.showAll}
            </Link>
          </div>
          {dashboard.overdueOrders.length > 0 ? (
            <div className="alert-list">
              {dashboard.overdueOrders.map((order) => (
                <Link href={routes.admin.orderDetails(order.id)} className="alert-row" key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <p>{order.customerName} · {order.trackingNumberDisplay}</p>
                  </div>
                  <div>
                    <OrderStatusBadge status={order.status} locale={locale} />
                    <p>{formatDate(order.currentEstimatedDeliveryDate, locale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">{d.overdueEmpty}</p>
          )}
        </article>

        <article className="admin-card admin-section">
          <div className="section-heading section-heading--inline">
            <div>
              <h2 className="font-heading">
                <CalendarClock size={20} aria-hidden="true" />
                {d.dueSoonHeading}
              </h2>
              <p>{d.dueSoonIntro}</p>
            </div>
            <Link href={`${routes.admin.orders}?dateTo=${dashboard.dueSoonDateTo}&sort=eta_asc`} className="auth-link">
              {t.common.showAll}
            </Link>
          </div>
          {dashboard.dueSoonOrders.length > 0 ? (
            <div className="alert-list">
              {dashboard.dueSoonOrders.map((order) => (
                <Link href={routes.admin.orderDetails(order.id)} className="alert-row" key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <p>{order.customerName} · {order.trackingNumberDisplay}</p>
                  </div>
                  <div>
                    <OrderStatusBadge status={order.status} locale={locale} />
                    <p>{formatDate(order.currentEstimatedDeliveryDate, locale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">{d.dueSoonEmpty}</p>
          )}
        </article>
      </section>

      <section className="dashboard-panels" aria-label={d.failedEmailsHeading}>
        <article className="admin-card admin-section">
          <div className="section-heading section-heading--inline">
            <div>
              <h2 className="font-heading">
                <MailWarning size={20} aria-hidden="true" />
                {d.failedEmailsHeading}
              </h2>
              <p>{d.failedEmailsIntro}</p>
            </div>
            <Link href={routes.admin.emails} className="auth-link">
              {d.historyLink}
            </Link>
          </div>
          {dashboard.failedEmails.length > 0 ? (
            <div className="alert-list">
              {dashboard.failedEmails.map((email) => (
                <Link href={routes.admin.orderDetails(email.orderId)} className="alert-row" key={email.id}>
                  <div>
                    <strong>{email.orderNumber}</strong>
                    <p>{email.emailType} · {email.recipientEmail}</p>
                  </div>
                  <div>
                    <span className="order-status email-status--warning">{email.status}</span>
                    <p>{email.lastErrorCode ?? formatDateTime(email.createdAt, locale)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">{d.failedEmailsEmpty}</p>
          )}
        </article>

        <article className="admin-card admin-section">
          <div className="section-heading">
            <h2 className="font-heading">{d.recentChangesHeading}</h2>
            <p>{d.recentChangesIntro}</p>
          </div>
          {dashboard.recentStatusChanges.length > 0 ? (
            <div className="activity-list">
              {dashboard.recentStatusChanges.map((change) => (
                <Link
                  href={routes.admin.orderDetails(change.orderId)}
                  className="activity-row"
                  key={`${change.orderId}-${change.createdAt.toISOString()}`}
                >
                  <div>
                    <strong>{orderStatusContent[change.newStatus][locale].label}</strong>
                    <p>
                      {change.orderNumber} · {change.customerName}
                    </p>
                  </div>
                  <span>{formatDateTime(change.createdAt, locale)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">{d.recentChangesEmpty}</p>
          )}
        </article>
      </section>
    </AdminPageShell>
  );
}
