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

type SellerOption = {
  id: string;
  name: string;
  email: string;
};

type OrderCreateFormProps = {
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

export function OrderCreateForm({ sellers, fields, dict }: OrderCreateFormProps) {
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
      {/* Every order from this page creates a new customer with an auto order number. */}
      <input name="customerMode" type="hidden" value="new" />
      <input name="orderNumberMode" type="hidden" value="auto" />

      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dict.orderDataHeading}</h2>
          <p>{dict.orderDataIntro}</p>
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
        <button className="button-base button-primary" disabled={pending} type="submit">
          {pending ? dict.creating : dict.submit}
        </button>
      </section>
    </form>
  );
}
