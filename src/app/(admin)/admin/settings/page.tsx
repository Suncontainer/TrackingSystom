import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Einstellungen"
};

export default async function SettingsPage() {
  const { t } = await getAdminContext();

  return (
    <AdminPageShell eyebrow={t.settings.eyebrow} title={t.settings.title}>
      <AdminPlaceholder>
        <p>{t.settings.placeholder}</p>
      </AdminPlaceholder>
    </AdminPageShell>
  );
}
