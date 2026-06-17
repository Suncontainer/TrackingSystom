import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { requirePermission } from "@/features/auth/guards";
import { hasPermission } from "@/features/auth/permissions";
import { retryEmailAction } from "@/features/email/actions";
import { listEmailHistory } from "@/features/email/outbox";
import { getAdminContext } from "@/i18n/get-admin-locale";
import type { AppLocale } from "@/i18n/types";

export const metadata = {
  title: "E-Mails"
};

function formatDate(value: string | Date | null, locale: AppLocale) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function canRetryStatus(status: string) {
  return ["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED"].includes(status);
}

export default async function EmailsPage() {
  const profile = await requirePermission("emails:read");
  const { locale, t } = await getAdminContext();
  const e = t.emails;
  const canRetry = hasPermission(profile.role, "emails:retry");
  const emails = await listEmailHistory().catch(() => []);

  return (
    <AdminPageShell eyebrow={e.eyebrow} title={e.title}>
      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{e.heading}</h2>
          <p>{e.intro}</p>
        </div>
        {emails.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{e.colType}</th>
                  <th>{e.colRecipient}</th>
                  <th>{e.colStatus}</th>
                  <th>{e.colAttempts}</th>
                  <th>{e.colTimes}</th>
                  <th>{e.colNote}</th>
                  {canRetry ? <th>{e.colAction}</th> : null}
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
                    <td>
                      <div className="table-secondary">{e.queue}: {formatDate(email.createdAt, locale)}</div>
                      <div className="table-secondary">{e.sent}: {formatDate(email.sentAt, locale)}</div>
                      <div className="table-secondary">{e.delivered}: {formatDate(email.deliveredAt, locale)}</div>
                      <div className="table-secondary">
                        {e.failed}: {formatDate(email.bouncedAt ?? email.complainedAt ?? email.failedAt, locale)}
                      </div>
                    </td>
                    <td>{email.lastErrorCode ?? email.providerMessageId ?? "-"}</td>
                    {canRetry ? (
                      <td>
                        {canRetryStatus(email.status) ? (
                          <form action={retryEmailAction}>
                            <input type="hidden" name="emailId" value={email.id} />
                            <button type="submit" className="auth-link">{e.retry}</button>
                          </form>
                        ) : (
                          "-"
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-copy">{e.empty}</p>
        )}
      </section>
    </AdminPageShell>
  );
}
