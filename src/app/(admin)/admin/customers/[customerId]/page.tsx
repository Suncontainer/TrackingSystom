import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { routes } from "@/config/routes";
import { AuthorizationError } from "@/features/auth/errors";
import { requirePermission } from "@/features/auth/guards";
import { getCustomerDetail } from "@/features/orders/service";
import { NotFoundError } from "@/lib/errors/app-error";

export const metadata = {
  title: "Kundendetails"
};

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = await params;
  const detail = await loadCustomerPageData(customerId);

  return (
    <AdminPageShell eyebrow="Kundenverwaltung" title={detail.customerName}>
      <section className="admin-card admin-section">
        <div className="detail-grid">
          <div>
            <p className="detail-label">E-Mail</p>
            <p>{detail.customer.email}</p>
          </div>
          <div>
            <p className="detail-label">Telefon</p>
            <p>{detail.customer.phone || "—"}</p>
          </div>
          <div>
            <p className="detail-label">Sprache</p>
            <p>{detail.customer.preferredLanguage.toUpperCase()}</p>
          </div>
          <div>
            <p className="detail-label">Aktualisiert</p>
            <p>{formatDate(detail.customer.updatedAt)}</p>
          </div>
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Auftraege des Kunden</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Auftragsnummer</th>
                <th>Tracking</th>
                <th>Status</th>
                <th>Lieferung</th>
                <th>Aktualisiert</th>
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
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td>{formatDate(order.currentEstimatedDeliveryDate)}</td>
                  <td>{formatDate(order.updatedAt)}</td>
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
    return await getCustomerDetail(customerId, profile);
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}
