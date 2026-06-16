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

function formatDate(value: string | Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function buildPeriodHref(period: DashboardPeriod) {
  return `${routes.admin.home}?period=${period}`;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const profile = await requirePermission("dashboard:read");
  const params = searchParams ? await searchParams : {};
  const period = parseDashboardPeriod(params.period);
  const dashboard = await getDashboardData(profile, period);
  const canCreateOrders = hasPermission(profile.role, "orders:create");
  const metrics: Array<{ label: string; value: number; tone: string; icon: ReactNode }> = [
    { label: "Aktive Aufträge", value: dashboard.metrics.activeOrders, tone: "neutral", icon: <Boxes size={22} aria-hidden="true" /> },
    { label: "Auftrag eingegangen", value: dashboard.metrics.orderReceived, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.ORDER_RECEIVED) },
    { label: "In Produktion", value: dashboard.metrics.inProduction, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.IN_PRODUCTION) },
    { label: "Unterwegs", value: dashboard.metrics.inTransit, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.IN_TRANSIT) },
    { label: `Geliefert (${period} Tage)`, value: dashboard.metrics.deliveredInPeriod, tone: "neutral", icon: statusVideoIcon(orderStatusIcon.DELIVERED) },
    { label: "Überfällig aktiv", value: dashboard.metrics.overdueActive, tone: dashboard.metrics.overdueActive > 0 ? "warning" : "neutral", icon: <AlertTriangle size={22} aria-hidden="true" /> },
    { label: "Fällig in 7 Tagen", value: dashboard.metrics.dueSoon, tone: "neutral", icon: <CalendarClock size={22} aria-hidden="true" /> },
    {
      label: "E-Mail Warnungen",
      value: dashboard.metrics.failedMandatoryEmails,
      tone: dashboard.metrics.failedMandatoryEmails > 0 ? "danger" : "neutral",
      icon: <MailWarning size={22} aria-hidden="true" />
    }
  ];

  return (
    <AdminPageShell eyebrow="Operations" title="Tracking Dashboard">
      <section className="admin-card admin-section dashboard-toolbar" aria-label="Dashboard Filter">
        <div>
          <h2 className="font-heading">Übersicht</h2>
          <p>Alle Kennzahlen respektieren die Berechtigungen des angemeldeten Mitarbeiters.</p>
        </div>
        <div className="dashboard-actions">
          <nav className="segmented-control" aria-label="Zeitraum">
            <Link href={buildPeriodHref("7")} aria-current={period === "7" ? "true" : undefined}>
              7 Tage
            </Link>
            <Link href={buildPeriodHref("30")} aria-current={period === "30" ? "true" : undefined}>
              30 Tage
            </Link>
            <Link href={buildPeriodHref("90")} aria-current={period === "90" ? "true" : undefined}>
              90 Tage
            </Link>
          </nav>
          {canCreateOrders ? (
            <Link className="button-base button-primary" href={routes.admin.newOrder}>
              <PackagePlus size={18} aria-hidden="true" />
              Auftrag anlegen
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

      <section className="dashboard-panels" aria-label="Operative Warnungen">
        <article className="admin-card admin-section">
          <div className="section-heading section-heading--inline">
            <div>
              <h2 className="font-heading">
                <AlertTriangle size={20} aria-hidden="true" />
                Überfällige Aufträge
              </h2>
              <p>Aktive Aufträge mit geschätzter Lieferung vor heute.</p>
            </div>
            <Link href={`${routes.admin.orders}?overdue=1`} className="auth-link">
              Alle anzeigen
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
                    <OrderStatusBadge status={order.status} />
                    <p>{formatDate(order.currentEstimatedDeliveryDate)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Keine überfälligen aktiven Aufträge.</p>
          )}
        </article>

        <article className="admin-card admin-section">
          <div className="section-heading section-heading--inline">
            <div>
              <h2 className="font-heading">
                <CalendarClock size={20} aria-hidden="true" />
                Fällig in 7 Tagen
              </h2>
              <p>Aktive Aufträge mit naher geschätzter Lieferung.</p>
            </div>
            <Link href={`${routes.admin.orders}?dateTo=${dashboard.dueSoonDateTo}&sort=eta_asc`} className="auth-link">
              Alle anzeigen
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
                    <OrderStatusBadge status={order.status} />
                    <p>{formatDate(order.currentEstimatedDeliveryDate)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Keine aktiven Aufträge sind in den nächsten sieben Tagen fällig.</p>
          )}
        </article>
      </section>

      <section className="dashboard-panels" aria-label="Kommunikation und Verlauf">
        <article className="admin-card admin-section">
          <div className="section-heading section-heading--inline">
            <div>
              <h2 className="font-heading">
                <MailWarning size={20} aria-hidden="true" />
                Fehlgeschlagene Pflicht-E-Mails
              </h2>
              <p>Transaktionale E-Mails mit Bounce, Complaint, Failure oder Suppression.</p>
            </div>
            <Link href={routes.admin.emails} className="auth-link">
              Verlauf
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
                    <p>{email.lastErrorCode ?? formatDateTime(email.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Keine fehlgeschlagenen Pflicht-E-Mails.</p>
          )}
        </article>

        <article className="admin-card admin-section">
          <div className="section-heading">
            <h2 className="font-heading">Letzte Statusänderungen</h2>
            <p>Neueste Statusereignisse in Ihrem Berechtigungsbereich.</p>
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
                    <strong>{orderStatusContent[change.newStatus].de.label}</strong>
                    <p>
                      {change.orderNumber} · {change.customerName}
                    </p>
                  </div>
                  <span>{formatDateTime(change.createdAt)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Noch keine Statusänderungen vorhanden.</p>
          )}
        </article>
      </section>
    </AdminPageShell>
  );
}
