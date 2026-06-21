import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderRowActions } from "@/components/orders/order-row-actions";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { hasPermission } from "@/features/auth/permissions";
import { parseOrderListFilters } from "@/features/orders/filters";
import { listAssignableSalespeople, listOrders } from "@/features/orders/service";
import { orderStatusContent, orderStatuses } from "@/features/orders/status";
import { getAdminContext } from "@/i18n/get-admin-locale";
import type { AppLocale } from "@/i18n/types";

export const metadata = {
  title: "Aufträge"
};

type OrdersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | Date | null, locale: AppLocale) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" }).format(new Date(value));
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
  const { locale, t } = await getAdminContext();
  const o = t.orders;
  const filters = parseOrderListFilters((searchParams ? await searchParams : {}) ?? {});
  const [orderList, salespeople] = await Promise.all([
    listOrders(filters, profile),
    profile.role === "SALES" ? Promise.resolve([]) : listAssignableSalespeople()
  ]);
  const canCreateOrders = hasPermission(profile.role, "orders:create");
  const canArchiveOrders = hasPermission(profile.role, "orders:archive");
  const rowActionsDict = {
    edit: o.edit,
    remove: o.remove,
    restore: o.restore,
    reason: o.removeReason,
    confirmRemove: o.removeConfirm,
    confirmRestore: o.restoreConfirm
  };

  return (
    <AdminPageShell eyebrow={o.eyebrow} title={o.title}>
      <section className="admin-card admin-section">
        <form action={routes.admin.orders} className="admin-filters">
          <div className="form-field">
            <label htmlFor="orders-query">{o.search}</label>
            <input
              defaultValue={filters.query}
              id="orders-query"
              name="query"
              placeholder={o.searchPlaceholder}
              type="search"
            />
          </div>
          <div className="form-field">
            <label htmlFor="orders-status">{o.status}</label>
            <select defaultValue={filters.status} id="orders-status" name="status">
              <option value="">{t.common.all}</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusContent[status][locale].label}
                </option>
              ))}
            </select>
          </div>
          {profile.role !== "SALES" ? (
            <div className="form-field">
              <label htmlFor="orders-salesperson">{o.salesperson}</label>
              <select defaultValue={filters.salespersonId} id="orders-salesperson" name="salespersonId">
                <option value="">{t.common.all}</option>
                {salespeople.map((salesperson) => (
                  <option key={salesperson.id} value={salesperson.id}>
                    {salesperson.firstName} {salesperson.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="form-field">
            <label htmlFor="orders-date-from">{o.deliveryFrom}</label>
            <input defaultValue={filters.dateFrom} id="orders-date-from" name="dateFrom" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="orders-date-to">{o.deliveryTo}</label>
            <input defaultValue={filters.dateTo} id="orders-date-to" name="dateTo" type="date" />
          </div>
          <div className="form-field">
            <label htmlFor="orders-archived">{o.archive}</label>
            <select defaultValue={filters.archived} id="orders-archived" name="archived">
              <option value="active">{o.archiveActive}</option>
              <option value="archived">{o.archiveArchived}</option>
              <option value="all">{o.archiveAll}</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="orders-sort">{o.sort}</label>
            <select defaultValue={filters.sort} id="orders-sort" name="sort">
              <option value="updated_desc">{o.sortUpdated}</option>
              <option value="created_desc">{o.sortCreated}</option>
              <option value="eta_asc">{o.sortEtaAsc}</option>
              <option value="eta_desc">{o.sortEtaDesc}</option>
            </select>
          </div>
          <label className="filter-checkbox">
            <input defaultChecked={filters.overdue} name="overdue" type="checkbox" value="1" />
            <span>{o.overdueOnly}</span>
          </label>
          <div className="filters-actions">
            <button className="button-base button-secondary" type="submit">
              {t.common.applyFilters}
            </button>
            {canCreateOrders ? (
              <Link className="button-base button-primary" href={routes.admin.newOrder}>
                {t.common.createOrder}
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading section-heading--inline">
          <h2 className="font-heading">{o.resultsHeading}</h2>
          <p>
            {o.ordersCount
              .replace("{total}", String(orderList.total))
              .replace("{page}", String(filters.page))
              .replace("{totalPages}", String(orderList.totalPages))}
          </p>
        </div>

        {orderList.rows.length > 0 ? (
          <>
            <div className="admin-table-wrap orders-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{o.colOrderNumber}</th>
                    <th>{o.colTracking}</th>
                    <th>{o.colCustomer}</th>
                    <th>{o.colStatus}</th>
                    <th>{o.colDelivery}</th>
                    <th>{o.colSales}</th>
                    <th>{o.colEmail}</th>
                    <th>{o.colUpdated}</th>
                    <th>{o.colActions}</th>
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
                        <OrderStatusBadge status={row.status} locale={locale} />
                      </td>
                      <td>{formatDate(row.currentEstimatedDeliveryDate, locale)}</td>
                      <td>{row.assignedSalespersonLabel || "—"}</td>
                      <td>{row.hasEmailWarning ? t.common.warning : t.common.ok}</td>
                      <td>{formatDate(row.updatedAt, locale)}</td>
                      <td>
                        <OrderRowActions
                          archived={Boolean(row.archivedAt)}
                          canArchive={canArchiveOrders}
                          dict={rowActionsDict}
                          editHref={routes.admin.orderDetails(row.id)}
                          orderId={row.id}
                          version={row.version}
                        />
                      </td>
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
                    <OrderStatusBadge status={row.status} locale={locale} />
                  </div>
                  <div className="order-card__meta">
                    <p>{row.customerName}</p>
                    <p>{formatDate(row.currentEstimatedDeliveryDate, locale)}</p>
                    <p>{row.assignedSalespersonLabel || "—"}</p>
                  </div>
                  <div className="order-card__actions">
                    <OrderRowActions
                      archived={Boolean(row.archivedAt)}
                      canArchive={canArchiveOrders}
                      dict={rowActionsDict}
                      editHref={routes.admin.orderDetails(row.id)}
                      orderId={row.id}
                      version={row.version}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="pagination-row">
              <span>
                {o.pageInfo
                  .replace("{page}", String(filters.page))
                  .replace("{totalPages}", String(orderList.totalPages))}
              </span>
              <div className="pagination-actions">
                {filters.page > 1 ? (
                  <Link className="button-base button-secondary" href={buildPageHref(filters, filters.page - 1)}>
                    {t.common.back}
                  </Link>
                ) : null}
                {filters.page < orderList.totalPages ? (
                  <Link className="button-base button-secondary" href={buildPageHref(filters, filters.page + 1)}>
                    {t.common.next}
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>{o.emptyResults}</p>
            {canCreateOrders ? (
              <Link className="button-base button-primary" href={routes.admin.newOrder}>
                {t.common.createOrder}
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
