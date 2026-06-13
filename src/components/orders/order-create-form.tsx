"use client";

import { useActionState } from "react";

import { createOrderAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";

type CustomerMatch = {
  archivedAt: Date | null;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  preferredLanguage: string;
};

type SalespersonOption = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  role: string;
};

type OrderCreateFormProps = {
  customerMatches: CustomerMatch[];
  customerSearchQuery: string;
  salespeople: SalespersonOption[];
};

function getFieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function OrderCreateForm({
  customerMatches,
  customerSearchQuery,
  salespeople
}: OrderCreateFormProps) {
  const [state, formAction, pending] = useActionState(createOrderAction, initialOrderFormState);

  return (
    <form action={formAction} className="admin-form admin-form--stacked">
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Kundenmodus</h2>
          <p>Bestehenden Kunden bewusst wiederverwenden oder neuen Kunden anlegen.</p>
        </div>
        <div className="form-segmented">
          <label>
            <input defaultChecked name="customerMode" type="radio" value="new" />
            <span>Neuer Kunde</span>
          </label>
          <label>
            <input name="customerMode" type="radio" value="existing" />
            <span>Bestehender Kunde</span>
          </label>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="customer-first-name">Vorname</label>
            <input id="customer-first-name" name="customerFirstName" required type="text" />
            {getFieldError(state.fieldErrors, "customerFirstName") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "customerFirstName")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="customer-last-name">Nachname</label>
            <input id="customer-last-name" name="customerLastName" required type="text" />
            {getFieldError(state.fieldErrors, "customerLastName") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "customerLastName")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="customer-email">E-Mail</label>
            <input id="customer-email" name="customerEmail" required type="email" />
            {getFieldError(state.fieldErrors, "customerEmail") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "customerEmail")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="customer-phone">Telefon</label>
            <input id="customer-phone" name="customerPhone" type="text" />
          </div>
          <div className="form-field">
            <label htmlFor="preferred-language">Sprache</label>
            <select defaultValue="de" id="preferred-language" name="preferredLanguage">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="existing-customer-panel">
          <div>
            <p className="panel-label">Bestehende Treffer</p>
            <p className="panel-copy">
              Suchbegriff: <strong>{customerSearchQuery || "kein Filter"}</strong>
            </p>
          </div>
          <div className="existing-customer-list">
            {customerMatches.length > 0 ? (
              customerMatches.map((customer) => (
                <label className="existing-customer-item" key={customer.id}>
                  <input name="existingCustomerId" type="radio" value={customer.id} />
                  <span>
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>
                    <small>
                      {customer.email} · {customer.preferredLanguage.toUpperCase()}
                      {customer.archivedAt ? " · archiviert" : ""}
                    </small>
                  </span>
                </label>
              ))
            ) : (
              <p className="panel-empty">Keine passenden Bestandskunden gefunden.</p>
            )}
          </div>
          {getFieldError(state.fieldErrors, "existingCustomerId") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "existingCustomerId")}</p>
          ) : null}
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Auftragsdaten</h2>
          <p>Tracking-Nummer wird bei der Erstellung automatisch und zufaellig erzeugt.</p>
        </div>
        <div className="form-segmented">
          <label>
            <input defaultChecked name="orderNumberMode" type="radio" value="auto" />
            <span>Auftragsnummer automatisch</span>
          </label>
          <label>
            <input name="orderNumberMode" type="radio" value="manual" />
            <span>Auftragsnummer manuell</span>
          </label>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="manual-order-number">Manuelle Auftragsnummer</label>
            <input id="manual-order-number" name="manualOrderNumber" placeholder="SC-2026-000001" type="text" />
            {getFieldError(state.fieldErrors, "manualOrderNumber") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "manualOrderNumber")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="estimated-delivery-date">Voraussichtliche Lieferung</label>
            <input id="estimated-delivery-date" name="initialEstimatedDeliveryDate" required type="date" />
            {getFieldError(state.fieldErrors, "initialEstimatedDeliveryDate") ? (
              <p className="field-error">
                {getFieldError(state.fieldErrors, "initialEstimatedDeliveryDate")}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="assigned-salesperson-id">Zugewiesener Vertrieb</label>
            <select defaultValue="" id="assigned-salesperson-id" name="assignedSalespersonId">
              <option value="">Nicht direkt zugewiesen</option>
              {salespeople.map((salesperson) => (
                <option key={salesperson.id} value={salesperson.id}>
                  {salesperson.firstName} {salesperson.lastName} · {salesperson.role}
                </option>
              ))}
            </select>
            {getFieldError(state.fieldErrors, "assignedSalespersonId") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "assignedSalespersonId")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="assigned-salesperson-email">Fallback Vertriebs-E-Mail</label>
            <input id="assigned-salesperson-email" name="assignedSalespersonEmail" type="email" />
            {getFieldError(state.fieldErrors, "assignedSalespersonEmail") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "assignedSalespersonEmail")}</p>
            ) : null}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="product-description">Produktbeschreibung</label>
          <textarea id="product-description" name="productDescription" rows={4} />
        </div>
        <div className="form-field">
          <label htmlFor="initial-note">Initiale interne Notiz</label>
          <textarea id="initial-note" name="initialInternalNote" rows={4} />
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">Hinweise</h2>
          <p>Kundenbestaetigung und Vertriebsbenachrichtigung werden als Pflicht-E-Mails in die Outbox gestellt.</p>
        </div>
        <button className="button-base button-primary" disabled={pending} type="submit">
          {pending ? "Auftrag wird erstellt..." : "Auftrag anlegen"}
        </button>
      </section>
    </form>
  );
}
