import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Benutzer"
};

export default async function UsersPage() {
  const { t } = await getAdminContext();

  return (
    <AdminPageShell eyebrow={t.users.eyebrow} title={t.users.title}>
      <AdminPlaceholder>
        <p>{t.users.placeholder}</p>
      </AdminPlaceholder>
    </AdminPageShell>
  );
}
