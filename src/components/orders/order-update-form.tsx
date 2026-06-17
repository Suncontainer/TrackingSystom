"use client";

import { useActionState } from "react";

import { updateOrderAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";
import type { OrderFormFieldsDict } from "@/i18n/admin";

type SalespersonOption = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  role: string;
};

type OrderUpdateFormProps = {
  order: {
    assignedSalespersonEmail: string | null;
    assignedSalespersonId: string | null;
    customerEmail: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string | null;
    id: string;
    preferredLanguage: string;
    productDescription: string | null;
    version: number;
  };
  salespeople: SalespersonOption[];
  fields: OrderFormFieldsDict;
  saving: string;
  saveChanges: string;
};

function getFieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function OrderUpdateForm({ order, salespeople, fields, saving, saveChanges }: OrderUpdateFormProps) {
  const [state, formAction, pending] = useActionState(updateOrderAction, initialOrderFormState);

  return (
    <form action={formAction} className="admin-form">
      <input name="orderId" type="hidden" value={order.id} />
      <input name="version" type="hidden" value={String(order.version)} />
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="edit-customer-first-name">{fields.firstName}</label>
          <input defaultValue={order.customerFirstName} id="edit-customer-first-name" name="customerFirstName" type="text" />
          {getFieldError(state.fieldErrors, "customerFirstName") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "customerFirstName")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="edit-customer-last-name">{fields.lastName}</label>
          <input defaultValue={order.customerLastName} id="edit-customer-last-name" name="customerLastName" type="text" />
          {getFieldError(state.fieldErrors, "customerLastName") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "customerLastName")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="edit-customer-email">{fields.email}</label>
          <input defaultValue={order.customerEmail} id="edit-customer-email" name="customerEmail" type="email" />
          {getFieldError(state.fieldErrors, "customerEmail") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "customerEmail")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="edit-customer-phone">{fields.phone}</label>
          <input defaultValue={order.customerPhone ?? ""} id="edit-customer-phone" name="customerPhone" type="text" />
        </div>
        <div className="form-field">
          <label htmlFor="edit-preferred-language">{fields.language}</label>
          <select defaultValue={order.preferredLanguage} id="edit-preferred-language" name="preferredLanguage">
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="edit-assigned-salesperson-id">{fields.assignedSalesperson}</label>
          <select defaultValue={order.assignedSalespersonId ?? ""} id="edit-assigned-salesperson-id" name="assignedSalespersonId">
            <option value="">{fields.notAssigned}</option>
            {salespeople.map((salesperson) => (
              <option key={salesperson.id} value={salesperson.id}>
                {salesperson.firstName} {salesperson.lastName} · {salesperson.role}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="edit-assigned-salesperson-email">{fields.fallbackSalesEmail}</label>
          <input
            defaultValue={order.assignedSalespersonEmail ?? ""}
            id="edit-assigned-salesperson-email"
            name="assignedSalespersonEmail"
            type="email"
          />
          {getFieldError(state.fieldErrors, "assignedSalespersonEmail") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "assignedSalespersonEmail")}</p>
          ) : null}
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="edit-product-description">{fields.productDescription}</label>
        <textarea
          defaultValue={order.productDescription ?? ""}
          id="edit-product-description"
          name="productDescription"
          rows={4}
        />
      </div>
      <button className="button-base button-primary" disabled={pending} type="submit">
        {pending ? saving : saveChanges}
      </button>
    </form>
  );
}
