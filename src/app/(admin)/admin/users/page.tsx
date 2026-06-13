import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = {
  title: "Benutzer"
};

export default function UsersPage() {
  return (
    <AdminPageShell eyebrow="Berechtigungen" title="Benutzerverwaltung">
      <AdminPlaceholder>
        <p>Noch keine Benutzerliste verfügbar.</p>
      </AdminPlaceholder>
    </AdminPageShell>
  );
}
