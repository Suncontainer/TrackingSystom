export const orderListStatuses = ["ORDER_RECEIVED", "IN_PRODUCTION", "IN_TRANSIT", "DELIVERED"] as const;
export const archivedFilterValues = ["active", "archived", "all"] as const;
export const sortValues = ["updated_desc", "created_desc", "eta_asc", "eta_desc"] as const;

export type OrderListFilters = {
  archived: (typeof archivedFilterValues)[number];
  dateFrom: string;
  dateTo: string;
  overdue: boolean;
  page: number;
  query: string;
  salespersonId: string;
  sort: (typeof sortValues)[number];
  status: "" | (typeof orderListStatuses)[number];
};

function normalizeOrderListQuery(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function parseOrderListFilters(searchParams: Record<string, string | string[] | undefined>) {
  const rawPage = Number.parseInt(normalizeOrderListQuery(searchParams.page), 10);
  const rawStatus = normalizeOrderListQuery(searchParams.status);
  const rawArchived = normalizeOrderListQuery(searchParams.archived);
  const rawSort = normalizeOrderListQuery(searchParams.sort);

  return {
    archived: archivedFilterValues.includes(rawArchived as (typeof archivedFilterValues)[number])
      ? (rawArchived as (typeof archivedFilterValues)[number])
      : "active",
    dateFrom: normalizeOrderListQuery(searchParams.dateFrom),
    dateTo: normalizeOrderListQuery(searchParams.dateTo),
    overdue: normalizeOrderListQuery(searchParams.overdue) === "1",
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    query: normalizeOrderListQuery(searchParams.query).trim(),
    salespersonId: normalizeOrderListQuery(searchParams.salespersonId).trim(),
    sort: sortValues.includes(rawSort as (typeof sortValues)[number])
      ? (rawSort as (typeof sortValues)[number])
      : "updated_desc",
    status: orderListStatuses.includes(rawStatus as (typeof orderListStatuses)[number])
      ? (rawStatus as (typeof orderListStatuses)[number])
      : ""
  } satisfies OrderListFilters;
}
