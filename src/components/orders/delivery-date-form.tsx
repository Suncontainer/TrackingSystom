"use client";

import { useActionState } from "react";

import { updateEstimatedDeliveryDateAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";

type DeliveryDateFormProps = {
  currentDate: string;
  orderId: string;
  version: number;
};

function getFieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function DeliveryDateForm({ currentDate, orderId, version }: DeliveryDateFormProps) {
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
          <label htmlFor="delivery-new-date">Neue Lieferprognose</label>
          <input defaultValue={currentDate} id="delivery-new-date" name="newDate" required type="date" />
          {getFieldError(state.fieldErrors, "newDate") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "newDate")}</p>
          ) : null}
        </div>
        <label className="filter-checkbox">
          <input name="customerNotificationRequested" type="checkbox" value="true" />
          <span>Kundenbenachrichtigung einreihen</span>
        </label>
      </div>
      <div className="form-field">
        <label htmlFor="delivery-reason">Grund</label>
        <textarea id="delivery-reason" name="reason" rows={3} />
      </div>
      <button className="button-base button-secondary" disabled={pending} type="submit">
        {pending ? "Datum wird gespeichert..." : "Lieferdatum aktualisieren"}
      </button>
    </form>
  );
}
