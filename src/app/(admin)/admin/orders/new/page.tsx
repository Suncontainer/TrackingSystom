import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { OrderCreateForm } from "@/components/orders/order-create-form";
import { requirePermission } from "@/features/auth/guards";
import { listActiveSellers } from "@/features/sellers/service";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Neuer Auftrag"
};

export default async function NewOrderPage() {
  await requirePermission("orders:create");
  const { t } = await getAdminContext();
  const p = t.forms.newOrderPage;
  const sellers = await listActiveSellers();

  return (
    <AdminPageShell eyebrow={p.eyebrow} title={p.title}>
      <OrderCreateForm sellers={sellers} fields={t.forms.fields} dict={t.forms.create} />
    </AdminPageShell>
  );
}
