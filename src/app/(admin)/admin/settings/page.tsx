import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = {
  title: "Einstellungen"
};

export default function SettingsPage() {
  return (
    <AdminPageShell eyebrow="System" title="Einstellungen">
      <AdminPlaceholder>
        <p>Noch keine Systemeinstellungen verfügbar.</p>
      </AdminPlaceholder>
    </AdminPageShell>
  );
}
