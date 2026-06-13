import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ArchiveOrderForm } from "@/components/orders/archive-order-form";
import { CustomerPreview } from "@/components/orders/customer-preview";
import { DeliveryDateForm } from "@/components/orders/delivery-date-form";
import { InternalNoteForm } from "@/components/orders/internal-note-form";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderUpdateForm } from "@/components/orders/order-update-form";
import { StatusChangeForm } from "@/components/orders/status-change-form";
import { routes } from "@/config/routes";
import { AuthorizationError } from "@/features/auth/errors";
import { requireOrderAccess } from "@/features/auth/guards";
import { listAssignableSalespeople, getOrderDetail } from "@/features/orders/service";
import { NotFoundError } from "@/lib/errors/app-error";

export const metadata = {
  title: "Auftragsdetails"
};

type OrderDetailsPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrderDetailsPage({ params, searchParams }: OrderDetailsPageProps) {
  const { orderId } = await params;
  const query = (searchParams ? await searchParams : {}) ?? {};
  const { detail, salespeople } = await loadOrderPageData(orderId);

  return (
    <AdminPageShell eyebrow="Auftrag" title={detail.order.orderNumber}>
      {getSearchValue(query.created) === "1" ? (
        <p className="form-feedback" role="status">
          Auftrag erstellt. Pflicht-E-Mails wurden in die Outbox eingereiht.
        </p>
      ) : null}
      {getSearchValue(query.updated) === "1" ? (
        <p className="form-feedback" role="status">
          Auftrag aktualisiert.
        </p>
      ) : null}
      {getSearchValue(query.noted) === "1" ? (
        <p className="form-feedback" role="status">
          Interne Notiz hinzugefuegt.
        </p>
      ) : null}
      {getSearchValue(query.statusChanged) === "1" ? (
        <p className="form-feedback" role="status">
          Status aktualisiert. Die passende Historie und E-Mail-Outbox wurden geschrieben.
        </p>
      ) : null}
      {getSearchValue(query.dateChanged) === "1" ? (
        <p className="form-feedback" role="status">
          Lieferdatum aktualisiert.
        </p>
      ) : null}
      {getSearchValue(query.archived) === "1" ? (
        <p className="form-feedback" role="status">
          Auftrag archiviert und Tracking-Link-Version erhoeht.
        </p>
      ) : null}
      {getSearchValue(query.restored) === "1" ? (
        <p className="form-feedback" role="status">
          Auftrag wiederhergestellt.
        </p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="detail-header">
          <div>
            <p className="detail-label">Tracking</p>
            <h2 className="font-heading">{detail.order.trackingNumberDisplay}</h2>
          </div>
          <OrderStatusBadge status={detail.order.status} />
        </div>
        <div className="detail-grid">
          <div>
            <p className="detail-label">Kunde</p>
            <p>
              <Link href={routes.admin.customerDetails(detail.order.customerId)}>{detail.customerName}</Link>
            </p>
          </div>
          <div>
            <p className="detail-label">E-Mail</p>
            <p>{detail.order.customerEmail}</p>
          </div>
          <div>
            <p className="detail-label">Lieferung geplant</p>
            <p>{formatDate(detail.order.currentEstimatedDeliveryDate)}</p>
          </div>
          <div>
            <p className="detail-label">Vertrieb</p>
            <p>{detail.order.assignedSalespersonLabel || detail.order.assignedSalespersonEmail || "—"}</p>
          </div>
          <div>
            <p className="detail-label">Version</p>
            <p>{detail.order.version}</p>
          </div>
          <div>
            <p className="detail-label">Tracking-Link Version</p>
            <p>{detail.order.trackingLinkVersion}</p>
          </div>
          <div>
            <p className="detail-label">Archiv</p>
            <p>{detail.order.archivedAt ? `Archiviert am ${formatDate(detail.order.archivedAt)}` : "Aktiv"}</p>
          </div>
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Status aendern</h2>
          <p>Standardwechsel gehen nur einen Schritt nach vorn. Overrides sind Super-Admins vorbehalten.</p>
        </div>
        {detail.canUpdateWorkflow ? (
          <StatusChangeForm
            canOverride={detail.canOverrideStatus}
            currentEstimatedDeliveryDate={detail.order.currentEstimatedDeliveryDate}
            currentStatus={detail.order.status}
            orderId={detail.order.id}
            version={detail.order.version}
          />
        ) : (
          <p className="panel-empty">Keine Berechtigung fuer Statusaenderungen.</p>
        )}
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Lieferdatum</h2>
          <p>Aenderungen schreiben eine eigene Historie und koennen optional eine Kunden-E-Mail einreihen.</p>
        </div>
        {detail.canUpdateWorkflow ? (
          <DeliveryDateForm
            currentDate={detail.order.currentEstimatedDeliveryDate}
            orderId={detail.order.id}
            version={detail.order.version}
          />
        ) : (
          <p className="panel-empty">Keine Berechtigung fuer Lieferdatumaenderungen.</p>
        )}
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Kundenvorschau</h2>
        </div>
        <CustomerPreview snapshot={detail.customerPreview} />
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Kunde und Auftrag</h2>
          <p>Felder in dieser Phase werden ueber `orders.version` gegen parallele Aenderungen geschuetzt.</p>
        </div>
        {detail.canEdit ? (
          <OrderUpdateForm
            order={{
              assignedSalespersonEmail: detail.order.assignedSalespersonEmail,
              assignedSalespersonId: detail.order.assignedSalespersonId,
              customerEmail: detail.order.customerEmail,
              customerFirstName: detail.order.customerFirstName,
              customerLastName: detail.order.customerLastName,
              customerPhone: detail.order.customerPhone,
              id: detail.order.id,
              preferredLanguage: detail.order.preferredLanguage,
              productDescription: detail.order.productDescription,
              version: detail.order.version
            }}
            salespeople={salespeople}
          />
        ) : (
          <div className="detail-grid">
            <div>
              <p className="detail-label">Produktbeschreibung</p>
              <p>{detail.order.productDescription || "—"}</p>
            </div>
            <div>
              <p className="detail-label">Telefon</p>
              <p>{detail.order.customerPhone || "—"}</p>
            </div>
            <div>
              <p className="detail-label">Sprache</p>
              <p>{detail.order.preferredLanguage.toUpperCase()}</p>
            </div>
          </div>
        )}
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Statusverlauf</h2>
        </div>
        <div className="stack-list">
          {detail.statusHistory.map((entry) => (
            <article className="stack-list__item" key={entry.id}>
              <div className="stack-list__heading">
                <OrderStatusBadge status={entry.newStatus} />
                <span>{formatDate(entry.createdAt)}</span>
              </div>
              <p className="table-secondary">
                {entry.changeType} · ETA {formatDate(entry.estimatedDeliveryDateSnapshot)}
              </p>
              {entry.reason ? <p>{entry.reason}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Lieferdatum-Historie</h2>
        </div>
        {detail.dateHistory.length > 0 ? (
          <div className="stack-list">
            {detail.dateHistory.map((entry) => (
              <article className="stack-list__item" key={entry.id}>
                <div className="stack-list__heading">
                  <strong>
                    {formatDate(entry.previousDate)} &gt; {formatDate(entry.newDate)}
                  </strong>
                  <span>{formatDate(entry.createdAt)}</span>
                </div>
                <p className="table-secondary">
                  Kundenbenachrichtigung: {entry.customerNotificationRequested ? "ja" : "nein"}
                </p>
                {entry.reason ? <p>{entry.reason}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="panel-empty">Noch keine Lieferdatum-Aenderungen vorhanden.</p>
        )}
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Pflicht-E-Mails</h2>
        </div>
        {detail.emailHistory.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Empfaenger</th>
                  <th>Status</th>
                  <th>Versuche</th>
                  <th>Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {detail.emailHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="table-primary">{entry.type}</div>
                      <div className="table-secondary">{entry.subject}</div>
                    </td>
                    <td>{entry.recipientEmail}</td>
                    <td>{entry.status}</td>
                    <td>{entry.attemptCount}</td>
                    <td>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="panel-empty">Noch keine E-Mail-Historie vorhanden.</p>
        )}
      </section>

      {detail.notes.length > 0 || detail.canCreateNotes ? (
        <section className="admin-card admin-section">
          <div className="section-heading">
            <h2 className="font-heading">Interne Notizen</h2>
          </div>
          {detail.canCreateNotes ? <InternalNoteForm orderId={detail.order.id} /> : null}
          {detail.notes.length > 0 ? (
            <div className="stack-list">
              {detail.notes.map((note) => (
                <article className="stack-list__item" key={note.id}>
                  <div className="stack-list__heading">
                    <strong>Interne Notiz</strong>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {detail.auditHistory.length > 0 ? (
        <section className="admin-card admin-section">
          <div className="section-heading">
            <h2 className="font-heading">Audit</h2>
          </div>
          <div className="stack-list">
            {detail.auditHistory.map((entry) => (
              <article className="stack-list__item" key={entry.id}>
                <div className="stack-list__heading">
                  <strong>{entry.action}</strong>
                  <span>{formatDate(entry.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {detail.canArchive ? (
        <section className="admin-card admin-section">
          <div className="section-heading">
            <h2 className="font-heading">{detail.order.archivedAt ? "Auftrag wiederherstellen" : "Auftrag archivieren"}</h2>
            <p>Archivieren sperrt public access und erhoeht die Tracking-Link-Version.</p>
          </div>
          <ArchiveOrderForm
            archived={Boolean(detail.order.archivedAt)}
            orderId={detail.order.id}
            version={detail.order.version}
          />
        </section>
      ) : null}
    </AdminPageShell>
  );
}

async function loadOrderPageData(orderId: string) {
  try {
    const profile = await requireOrderAccess(orderId);
    const [detail, salespeople] = await Promise.all([
      getOrderDetail(orderId, profile),
      listAssignableSalespeople()
    ]);

    return { detail, salespeople };
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}
