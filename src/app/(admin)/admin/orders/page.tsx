import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { hasPermission } from "@/features/auth/permissions";
import { parseOrderListFilters } from "@/features/orders/filters";
import { listAssignableSalespeople, listOrders } from "@/features/orders/service";

export const metadata = {
  title: "Aufträge"
};

type OrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

function buildPageHref(
  filters: ReturnType<typeof parseOrderListFilters>,
  page: number
) {
  const searchParams = new URLSearchParams();

  if (filters.query) {
    searchParams.set("query", filters.query);
  }
  if (filters.status) {
    searchParams.set("status", filters.status);
  }
  if (filters.salespersonId) {
    searchParams.set("salespersonId", filters.salespersonId);
  }
  if (filters.dateFrom) {
    searchParams.set("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    searchParams.set("dateTo", filters.dateTo);
  }
  if (filters.overdue) {
    searchParams.set("overdue", "1");
  }
  if (filters.archived !== "active") {
    searchParams.set("archived", filters.archived);
  }
  if (filters.sort !== "updated_desc") {
    searchParams.set("sort", filters.sort);
  }
  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `${routes.admin.orders}?${query}` : routes.admin.orders;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const profile = await requirePermission("orders:read");
  const filters = parseOrderListFilters((searchParams ? await searchParams : {}) ?? {});
  const [orderList, salespeople] = await Promise.all([
    listOrders(filters, profile),
    profile.role === "SALES" ? Promise.resolve([]) : listAssignableSalespeople()
  ]);
  const canCreateOrders = hasPermission(profile.role, "orders:create");

  return (
    <AdminPageShell eyebrow="Auftragsverwaltung" title="Aufträge">
      <section className="admin-card admin-section">
        <form action={routes.admin.orders} className="admin-filters">
          <div className="form-field">
            <label htmlFor="orders-query">Suche</label>
            <input
              defaultValue={filters.query}
              id="orders-query"
              name="query"
              placeholder="Auftragsnummer, Tracking, Kunde, E-Mail"
              type="search"
            />
          </div>
          <div className="form-field">
            <label htmlFor="orders-status">Status</label>
            <select defaultValue={filters.status} id="orders-status" name="status">
              <option value="">Alle</option>
              <option value="ORDER_RECEIVED">Auftrag eingegangen</option>
              <option value="IN_PRODUCTION">In Produktion</option>
              <option value="IN_TRANSIT">Unterwegs</option>
              <option value="DELIVERED">Geliefert</option>
            </select>
          </div>
          {profile.role !== "SALES" ? (
            <div className="form-field">
              <label htmlFor="orders-salesperson">Vertrieb</label>
              <select defaultValue={filters.salespersonId} id="orders-salesperson" name="salespersonId">
                <option value="">Alle</option>
                {salespeople.map((salesperson) => (
                  <option key={salesperson.id} value={salesperson.id}>
                    {salesperson.firstName} {salesperson.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="form-field">
            <label htmlFor="orders-date-from">Lieferung ab</label>
            <input defaultValue={filters.dateFrom} id="orders-date-from" name="dateFrom" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="orders-date-to">Lieferung bis</label>
            <input defaultValue={filters.dateTo} id="orders-date-to" name="dateTo" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="orders-archived">Archiv</label>
            <select defaultValue={filters.archived} id="orders-archived" name="archived">
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
              <option value="all">Alle</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="orders-sort">Sortierung</label>
            <select defaultValue={filters.sort} id="orders-sort" name="sort">
              <option value="updated_desc">Zuletzt aktualisiert</option>
              <option value="created_desc">Zuletzt erstellt</option>
              <option value="eta_asc">Lieferung aufsteigend</option>
              <option value="eta_desc">Lieferung absteigend</option>
            </select>
          </div>
          <label className="filter-checkbox">
            <input defaultChecked={filters.overdue} name="overdue" type="checkbox" value="1" />
            <span>Nur ueberfaellige Auftraege</span>
          </label>
          <div className="filters-actions">
            <button className="button-base button-secondary" type="submit">
              Filter anwenden
            </button>
            {canCreateOrders ? (
              <Link className="button-base button-primary" href={routes.admin.newOrder}>
                Auftrag anlegen
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading section-heading--inline">
          <h2 className="font-heading">Ergebnisse</h2>
          <p>
            {orderList.total} Auftraege · Seite {filters.page} / {orderList.totalPages}
          </p>
        </div>

        {orderList.rows.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Auftragsnummer</th>
                    <th>Tracking</th>
                    <th>Kunde</th>
                    <th>Status</th>
                    <th>Lieferung</th>
                    <th>Vertrieb</th>
                    <th>E-Mail</th>
                    <th>Aktualisiert</th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={routes.admin.orderDetails(row.id)}>{row.orderNumber}</Link>
                      </td>
                      <td>{row.trackingNumberDisplay}</td>
                      <td>
                        <div className="table-primary">{row.customerName}</div>
                        <div className="table-secondary">{row.customerEmail}</div>
                      </td>
                      <td>
                        <OrderStatusBadge status={row.status} />
                      </td>
                      <td>{formatDate(row.currentEstimatedDeliveryDate)}</td>
                      <td>{row.assignedSalespersonLabel || "—"}</td>
                      <td>{row.hasEmailWarning ? "Warnung" : "OK"}</td>
                      <td>{formatDate(row.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-card-list">
              {orderList.rows.map((row) => (
                <article className="order-card" key={row.id}>
                  <div className="order-card__header">
                    <div>
                      <Link className="table-primary" href={routes.admin.orderDetails(row.id)}>
                        {row.orderNumber}
                      </Link>
                      <p className="table-secondary">{row.trackingNumberDisplay}</p>
                    </div>
                    <OrderStatusBadge status={row.status} />
                  </div>
                  <div className="order-card__meta">
                    <p>{row.customerName}</p>
                    <p>{formatDate(row.currentEstimatedDeliveryDate)}</p>
                    <p>{row.assignedSalespersonLabel || "—"}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="pagination-row">
              <span>
                Seite {filters.page} von {orderList.totalPages}
              </span>
              <div className="pagination-actions">
                {filters.page > 1 ? (
                  <Link className="button-base button-secondary" href={buildPageHref(filters, filters.page - 1)}>
                    Zurueck
                  </Link>
                ) : null}
                {filters.page < orderList.totalPages ? (
                  <Link className="button-base button-secondary" href={buildPageHref(filters, filters.page + 1)}>
                    Weiter
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>Keine Auftraege fuer diese Filter gefunden.</p>
            {canCreateOrders ? (
              <Link className="button-base button-primary" href={routes.admin.newOrder}>
                Auftrag anlegen
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
