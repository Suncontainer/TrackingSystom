"use client";

import { useActionState } from "react";

import { changeOrderStatusAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";
import { getPermittedStandardNextStatus } from "@/features/orders/workflow";
import { orderStatusContent, orderStatuses, type OrderStatus } from "@/features/orders/status";
import type { StatusChangeDict } from "@/i18n/admin";
import type { AppLocale } from "@/i18n/types";

type StatusChangeFormProps = {
  canOverride: boolean;
  currentEstimatedDeliveryDate: string;
  currentStatus: OrderStatus;
  orderId: string;
  version: number;
  locale: AppLocale;
  dict: StatusChangeDict;
};

function getFieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function StatusChangeForm({
  canOverride,
  currentEstimatedDeliveryDate,
  currentStatus,
  orderId,
  version,
  locale,
  dict
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
          <label htmlFor="status-new-status">{dict.newStatus}</label>
          <select id="status-new-status" name="newStatus" required>
            {selectableStatuses.length > 0 ? (
              selectableStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusContent[status][locale].label}
                </option>
              ))
            ) : (
              <option value="">{dict.noFurtherStandard}</option>
            )}
          </select>
          {getFieldError(state.fieldErrors, "newStatus") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "newStatus")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="status-actual-delivery-date">{dict.actualDelivery}</label>
          <input id="status-actual-delivery-date" name="actualDeliveryDate" type="date" />
          {getFieldError(state.fieldErrors, "actualDeliveryDate") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "actualDeliveryDate")}</p>
          ) : null}
        </div>
      </div>

      {canOverride ? (
        <>
          <div className="form-field">
            <label htmlFor="status-reason">{dict.overrideReason}</label>
            <textarea id="status-reason" name="reason" rows={3} />
            {getFieldError(state.fieldErrors, "reason") ? (
              <p className="field-error">{getFieldError(state.fieldErrors, "reason")}</p>
            ) : null}
          </div>
          <div className="form-segmented">
            <label>
              <input name="customerEmailDecision" type="radio" value="send" />
              <span>{dict.sendCustomerEmail}</span>
            </label>
            <label>
              <input name="customerEmailDecision" type="radio" value="skip" />
              <span>{dict.skipCustomerEmail}</span>
            </label>
          </div>
        </>
      ) : null}

      <div className="preview-strip">
        <span>{dict.current}: {orderStatusContent[currentStatus][locale].label}</span>
        <span>{dict.eta}: {currentEstimatedDeliveryDate}</span>
        <span>{dict.mandatoryEmailNote}</span>
      </div>

      <button className="button-base button-primary" disabled={pending || selectableStatuses.length === 0} type="submit">
        {pending ? dict.changing : dict.submit}
      </button>
    </form>
  );
}
