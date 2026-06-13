"use client";

import { useActionState } from "react";

import { changeOrderStatusAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";
import { getPermittedStandardNextStatus } from "@/features/orders/workflow";
import { orderStatusContent, orderStatuses, type OrderStatus } from "@/features/orders/status";

type StatusChangeFormProps = {
  canOverride: boolean;
  currentEstimatedDeliveryDate: string;
  currentStatus: OrderStatus;
  orderId: string;
  version: number;
};

function getFieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function StatusChangeForm({
  canOverride,
  currentEstimatedDeliveryDate,
  currentStatus,
  orderId,
  version
}: StatusChangeFormProps) {
  const [state, formAction, pending] = useActionState(changeOrderStatusAction, initialOrderFormState);
  const nextStandardStatus = getPermittedStandardNextStatus(currentStatus);
  const selectableStatuses = canOverride
    ? orderStatuses.filter((status) => status !== currentStatus)
    : nextStandardStatus
      ? [nextStandardStatus]
      : [];

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
          <label htmlFor="status-new-status">Neuer Status</label>
          <select id="status-new-status" name="newStatus" required>
            {selectableStatuses.length > 0 ? (
              selectableStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusContent[status].de.label}
                </option>
              ))
            ) : (
              <option value="">Kein weiterer Standardstatus</option>
            )}
          </select>
          {getFieldError(state.fieldErrors, "newStatus") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "newStatus")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="status-actual-delivery-date">Tatsaechliche Lieferung</label>
          <input id="status-actual-delivery-date" name="actualDeliveryDate" type="date" />
          {getFieldError(state.fieldErrors, "actualDeliveryDate") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "actualDeliveryDate")}</p>
          ) : null}
        </div>
      </div>

      {canOverride ? (
        <>
          <div className="form-field">
            <label htmlFor="status-reason">Override-Grund</label>
            <textarea id="status-reason" name="reason" rows={3} />
            {getFieldError(state.fieldErrors, "reason") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "reason")}</p>
            ) : null}
          </div>
          <div className="form-segmented">
            <label>
              <input name="customerEmailDecision" type="radio" value="send" />
              <span>Kunden-E-Mail senden</span>
            </label>
            <label>
              <input name="customerEmailDecision" type="radio" value="skip" />
              <span>Kunden-E-Mail nicht senden</span>
            </label>
          </div>
        </>
      ) : null}

      <div className="preview-strip">
        <span>Aktuell: {orderStatusContent[currentStatus].de.label}</span>
        <span>ETA: {currentEstimatedDeliveryDate}</span>
        <span>Pflicht-E-Mail wird bei Standardwechsel eingereiht.</span>
      </div>

      <button className="button-base button-primary" disabled={pending || selectableStatuses.length === 0} type="submit">
        {pending ? "Status wird geaendert..." : "Status aendern"}
      </button>
    </form>
  );
}
