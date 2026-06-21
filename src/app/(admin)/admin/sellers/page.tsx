import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { SellerAddForm } from "@/components/sellers/seller-add-form";
import { SellerDeleteButton } from "@/components/sellers/seller-delete-button";
import { requirePermission } from "@/features/auth/guards";
import { listSellers } from "@/features/sellers/service";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Verkäufer"
};

type SellersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SellersPage({ searchParams }: SellersPageProps) {
  await requirePermission("sellers:manage");
  const { t } = await getAdminContext();
  const s = t.sellers;
  const params = (await searchParams) ?? {};
  const flash =
    params.created === "1" ? s.created : params.removed === "1" ? s.removed : null;

  const sellers = await listSellers().catch(() => []);

  return (
    <AdminPageShell eyebrow={s.eyebrow} title={s.title}>
      {flash ? (
        <p className="form-feedback" role="status">
          {flash}
        </p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{s.addHeading}</h2>
          <p>{s.intro}</p>
        </div>
        <SellerAddForm dict={s} />
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{s.heading}</h2>
        </div>
        {sellers.length === 0 ? (
          <p className="panel-empty">{s.empty}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{s.colName}</th>
                  <th>{s.colEmail}</th>
                  <th>{s.colStatus}</th>
                  <th>{s.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id}>
                    <td>{seller.name}</td>
                    <td>{seller.email}</td>
                    <td>
                      <span className={seller.isActive ? "badge badge--success" : "badge badge--muted"}>
                        {seller.isActive ? s.active : s.inactive}
                      </span>
                    </td>
                    <td>
                      <SellerDeleteButton
                        confirmMessage={s.confirmRemove}
                        label={s.remove}
                        sellerId={seller.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
