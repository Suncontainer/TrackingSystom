"use client";

import { useActionState, useRef } from "react";

import { createOrderAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";
import type { CreateFormDict, OrderFormFieldsDict } from "@/i18n/admin";

const DEFAULT_DELIVERY_WINDOW_DAYS = 3;

function addDaysToDateInput(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type CustomerMatch = {
  archivedAt: Date | null;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  preferredLanguage: string;
};

type SellerOption = {
  id: string;
  name: string;
  email: string;
};

type OrderCreateFormProps = {
  customerMatches: CustomerMatch[];
  customerSearchQuery: string;
  sellers: SellerOption[];
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
  sellers,
  fields,
  dict
}: OrderCreateFormProps) {
  const [state, formAction, pending] = useActionState(createOrderAction, initialOrderFormState);
  const values = state.values;

  const latestDeliveryRef = useRef<HTMLInputElement>(null);
  const latestDeliveryTouched = useRef(false);

  function handleEarliestDeliveryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const latest = latestDeliveryRef.current;
    if (!latest || latestDeliveryTouched.current) {
      return;
    }
    const suggestion = event.target.value
      ? addDaysToDateInput(event.target.value, DEFAULT_DELIVERY_WINDOW_DAYS)
      : "";
    latest.value = suggestion;
  }

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
            <label htmlFor="estimated-delivery-date">{dict.estimatedDeliveryFrom}</label>
            <input
              defaultValue={fieldValue(values, "initialEstimatedDeliveryDate")}
              id="estimated-delivery-date"
              name="initialEstimatedDeliveryDate"
              onChange={handleEarliestDeliveryChange}
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
            <label htmlFor="estimated-delivery-date-end">{dict.estimatedDeliveryTo}</label>
            <input
              defaultValue={fieldValue(values, "initialEstimatedDeliveryDateEnd")}
              id="estimated-delivery-date-end"
              name="initialEstimatedDeliveryDateEnd"
              onChange={() => {
                latestDeliveryTouched.current = true;
              }}
              ref={latestDeliveryRef}
              required
              type="date"
            />
            {getFieldError(state.fieldErrors, "initialEstimatedDeliveryDateEnd") ? (
              <p className="field-error">
                {getFieldError(state.fieldErrors, "initialEstimatedDeliveryDateEnd")}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="assigned-seller-email">{fields.seller}</label>
            <select
              defaultValue={fieldValue(values, "assignedSellerEmail")}
              id="assigned-seller-email"
              name="assignedSellerEmail"
              required
            >
              <option disabled value="">
                {fields.chooseSeller}
              </option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.email}>
                  {seller.name} · {seller.email}
                </option>
              ))}
            </select>
            {getFieldError(state.fieldErrors, "assignedSellerEmail") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "assignedSellerEmail")}</p>
            ) : null}
          </div>
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
