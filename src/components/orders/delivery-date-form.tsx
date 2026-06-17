"use client";

import { useActionState } from "react";

import { updateEstimatedDeliveryDateAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";
import type { DeliveryDateDict } from "@/i18n/admin";

type DeliveryDateFormProps = {
  currentDate: string;
  orderId: string;
  version: number;
  dict: DeliveryDateDict;
};

function getFieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function DeliveryDateForm({ currentDate, orderId, version, dict }: DeliveryDateFormProps) {
  const [state, formAction, pending] = useActionState(updateEstimatedDeliveryDateAction, initialOrderFormState);

  return (
    <form action={formAction} className="admin-form">
      <input name="orderId" type="hidden" value={orderId} />
      <input name="version" type="hidden" value={String(version)} />
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="delivery-new-date">{dict.newDate}</label>
          <input defaultValue={currentDate} id="delivery-new-date" name="newDate" required type="date" />
          {getFieldError(state.fieldErrors, "newDate") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "newDate")}</p>
          ) : null}
        </div>
        <label className="filter-checkbox">
          <input name="customerNotificationRequested" type="checkbox" value="true" />
          <span>{dict.notifyCustomer}</span>
        </label>
      </div>
      <div className="form-field">
        <label htmlFor="delivery-reason">{dict.reason}</label>
        <textarea id="delivery-reason" name="reason" rows={3} />
      </div>
      <button className="button-base button-secondary" disabled={pending} type="submit">
        {pending ? dict.saving : dict.submit}
      </button>
    </form>
  );
}
