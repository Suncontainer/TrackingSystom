import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { requirePermission } from "@/features/auth/guards";
import { listEmailHistory } from "@/features/email/outbox";

export const metadata = {
  title: "E-Mails"
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function EmailsPage() {
  await requirePermission("emails:read");
  const emails = await listEmailHistory().catch(() => []);

  return (
    <AdminPageShell eyebrow="Kommunikation" title="E-Mail Verlauf">
      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Outbox und Zustellung</h2>
          <p>Pflicht-E-Mails und interne Benachrichtigungen mit aktuellem Zustellstatus.</p>
        </div>
        {emails.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Empfaenger</th>
                  <th>Status</th>
                  <th>Versuche</th>
                  <th>Provider</th>
                  <th>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td>
                      <div className="table-primary">{email.emailType}</div>
                      <div className="table-secondary">{email.subject}</div>
                    </td>
                    <td>{email.recipientEmail}</td>
                    <td>{email.status}</td>
                    <td>{email.attemptCount}</td>
                    <td>{email.providerMessageId ?? email.lastErrorCode ?? "-"}</td>
                    <td>{formatDate(email.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-copy">Noch keine E-Mail-Ereignisse vorhanden.</p>
        )}
      </section>
    </AdminPageShell>
  );
}
