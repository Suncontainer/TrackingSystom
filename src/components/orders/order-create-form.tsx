"use client";

import { useActionState } from "react";

import { createOrderAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";
import type { CreateFormDict, OrderFormFieldsDict } from "@/i18n/admin";

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

  return (
    <form action={formAction} className="admin-form admin-form--stacked">
      {/* Every order from this page creates a new customer with an auto order number.
          Delivery dates and notifications are handled later in the order's status section. */}
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
