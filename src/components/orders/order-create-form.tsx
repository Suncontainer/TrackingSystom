"use client";

import { useActionState } from "react";

import { createOrderAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";
import type { CreateFormDict, OrderFormFieldsDict } from "@/i18n/admin";

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
  fields: OrderFormFieldsDict;
  dict: CreateFormDict;
};

function getFieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

function fieldValue(values: Record<string, string> | undefined, field: string) {
  return values?.[field] ?? "";
}

function isOptionChecked(
  values: Record<string, string> | undefined,
  field: string,
  optionValue: string,
  fallbackChecked: boolean
) {
  const submitted = values?.[field];
  return submitted ? submitted === optionValue : fallbackChecked;
}

export function OrderCreateForm({
  customerMatches,
  customerSearchQuery,
  salespeople,
  fields,
  dict
}: OrderCreateFormProps) {
  const [state, formAction, pending] = useActionState(createOrderAction, initialOrderFormState);
  const values = state.values;

  return (
    <form action={formAction} className="admin-form admin-form--stacked">
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dict.customerModeHeading}</h2>
          <p>{dict.customerModeIntro}</p>
        </div>
        <div className="form-segmented">
          <label>
            <input
              defaultChecked={isOptionChecked(values, "customerMode", "new", true)}
              name="customerMode"
              type="radio"
              value="new"
            />
            <span>{dict.newCustomer}</span>
          </label>
          <label>
            <input
              defaultChecked={isOptionChecked(values, "customerMode", "existing", false)}
              name="customerMode"
              type="radio"
              value="existing"
            />
            <span>{dict.existingCustomer}</span>
          </label>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="customer-first-name">{fields.firstName}</label>
            <input
              defaultValue={fieldValue(values, "customerFirstName")}
              id="customer-first-name"
              name="customerFirstName"
              required
              type="text"
            />
            {getFieldError(state.fieldErrors, "customerFirstName") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "customerFirstName")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="customer-last-name">{fields.lastName}</label>
            <input
              defaultValue={fieldValue(values, "customerLastName")}
              id="customer-last-name"
              name="customerLastName"
              required
              type="text"
            />
            {getFieldError(state.fieldErrors, "customerLastName") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "customerLastName")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="customer-email">{fields.email}</label>
            <input
              defaultValue={fieldValue(values, "customerEmail")}
              id="customer-email"
              name="customerEmail"
              required
              type="email"
            />
            {getFieldError(state.fieldErrors, "customerEmail") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "customerEmail")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="customer-phone">{fields.phone}</label>
            <input
              defaultValue={fieldValue(values, "customerPhone")}
              id="customer-phone"
              name="customerPhone"
              type="text"
            />
          </div>
          <div className="form-field">
            <label htmlFor="preferred-language">{fields.language}</label>
            <select
              defaultValue={values?.preferredLanguage ?? "de"}
              id="preferred-language"
              name="preferredLanguage"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="existing-customer-panel">
          <div>
            <p className="panel-label">{dict.existingMatches}</p>
            <p className="panel-copy">
              {dict.searchTerm}: <strong>{customerSearchQuery || dict.noFilter}</strong>
            </p>
          </div>
          <div className="existing-customer-list">
            {customerMatches.length > 0 ? (
              customerMatches.map((customer) => (
                <label className="existing-customer-item" key={customer.id}>
                  <input
                    defaultChecked={values?.existingCustomerId === customer.id}
                    name="existingCustomerId"
                    type="radio"
                    value={customer.id}
                  />
                  <span>
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>
                    <small>
                      {customer.email} · {customer.preferredLanguage.toUpperCase()}
                      {customer.archivedAt ? dict.archivedSuffix : ""}
                    </small>
                  </span>
                </label>
              ))
            ) : (
              <p className="panel-empty">{dict.noMatches}</p>
            )}
          </div>
          {getFieldError(state.fieldErrors, "existingCustomerId") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "existingCustomerId")}</p>
          ) : null}
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dict.orderDataHeading}</h2>
          <p>{dict.orderDataIntro}</p>
        </div>
        <div className="form-segmented">
          <label>
            <input
              defaultChecked={isOptionChecked(values, "orderNumberMode", "auto", true)}
              name="orderNumberMode"
              type="radio"
              value="auto"
            />
            <span>{dict.orderNumberAuto}</span>
          </label>
          <label>
            <input
              defaultChecked={isOptionChecked(values, "orderNumberMode", "manual", false)}
              name="orderNumberMode"
              type="radio"
              value="manual"
            />
            <span>{dict.orderNumberManual}</span>
          </label>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="manual-order-number">{dict.manualOrderNumber}</label>
            <input
              defaultValue={fieldValue(values, "manualOrderNumber")}
              id="manual-order-number"
              name="manualOrderNumber"
              placeholder="SC-2026-000001"
              type="text"
            />
            {getFieldError(state.fieldErrors, "manualOrderNumber") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "manualOrderNumber")}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="estimated-delivery-date">{dict.estimatedDelivery}</label>
            <input
              defaultValue={fieldValue(values, "initialEstimatedDeliveryDate")}
              id="estimated-delivery-date"
              name="initialEstimatedDeliveryDate"
              required
              type="date"
            />
            {getFieldError(state.fieldErrors, "initialEstimatedDeliveryDate") ? (
              <p className="field-error">
                {getFieldError(state.fieldErrors, "initialEstimatedDeliveryDate")}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="assigned-salesperson-id">{fields.assignedSalesperson}</label>
            <select
              defaultValue={fieldValue(values, "assignedSalespersonId")}
              id="assigned-salesperson-id"
              name="assignedSalespersonId"
            >
              <option value="">{fields.notAssigned}</option>
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
            <label htmlFor="assigned-salesperson-email">{fields.fallbackSalesEmail}</label>
            <input
              defaultValue={fieldValue(values, "assignedSalespersonEmail")}
              id="assigned-salesperson-email"
              name="assignedSalespersonEmail"
              type="email"
            />
            {getFieldError(state.fieldErrors, "assignedSalespersonEmail") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "assignedSalespersonEmail")}</p>
            ) : null}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="product-description">{fields.productDescription}</label>
          <textarea
            defaultValue={fieldValue(values, "productDescription")}
            id="product-description"
            name="productDescription"
            rows={4}
          />
        </div>
        <div className="form-field">
          <label htmlFor="initial-note">{dict.initialNote}</label>
          <textarea
            defaultValue={fieldValue(values, "initialInternalNote")}
            id="initial-note"
            name="initialInternalNote"
            rows={4}
          />
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dict.notesHeading}</h2>
          <p>{dict.notesIntro}</p>
        </div>
        <button className="button-base button-primary" disabled={pending} type="submit">
          {pending ? dict.creating : dict.submit}
        </button>
      </section>
    </form>
  );
}
