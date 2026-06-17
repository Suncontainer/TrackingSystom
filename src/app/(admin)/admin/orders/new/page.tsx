import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderCreateForm } from "@/components/orders/order-create-form";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/guards";
import { listAssignableSalespeople, searchCustomersForReuse } from "@/features/orders/service";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Neuer Auftrag"
};

type NewOrderPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  await requirePermission("orders:create");
  const { t } = await getAdminContext();
  const p = t.forms.newOrderPage;
  const params = (searchParams ? await searchParams : {}) ?? {};
  const customerQuery = getSearchValue(params.customerQuery).trim();
  const [salespeople, customerMatches] = await Promise.all([
    listAssignableSalespeople(),
    customerQuery ? searchCustomersForReuse(customerQuery) : Promise.resolve([])
  ]);

  return (
    <AdminPageShell eyebrow={p.eyebrow} title={p.title}>
      <section className="admin-card admin-section">
        <div className="section-heading section-heading--inline">
          <div>
            <h2 className="font-heading">{p.searchHeading}</h2>
            <p>{p.searchIntro}</p>
          </div>
          <Link className="button-base button-secondary" href={routes.admin.orders}>
            {p.toOrderList}
          </Link>
        </div>
        <form action={routes.admin.newOrder} className="admin-inline-form">
          <input
            defaultValue={customerQuery}
            name="customerQuery"
            placeholder={p.searchPlaceholder}
            type="search"
          />
          <button className="button-base button-secondary" type="submit">
            {p.search}
          </button>
        </form>
      </section>

      <OrderCreateForm
        customerMatches={customerMatches}
        customerSearchQuery={customerQuery}
        salespeople={salespeople}
        fields={t.forms.fields}
        dict={t.forms.create}
      />
    </AdminPageShell>
  );
}
