import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata = {
  title: "E-Mails"
};

export default function EmailsPage() {
  return (
    <AdminPageShell eyebrow="Kommunikation" title="E-Mail Verlauf">
      <AdminPlaceholder>
        <p>Noch keine E-Mail-Ereignisse vorhanden.</p>
      </AdminPlaceholder>
    </AdminPageShell>
  );
}
