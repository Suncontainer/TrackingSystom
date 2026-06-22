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
  currentEstimatedDeliveryDateEnd: string;
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
  currentEstimatedDeliveryDateEnd,
  currentStatus,
  orderId,
  version,
  locale,
  dict
}: StatusChangeFormProps) {
  const [state, formAction, pending] = useActionState(changeOrderStatusAction, initialOrderFormState);
  const nextStandardStatus = getPermittedStandardNextStatus(currentStatus);
  // Super admins can set the order to any of the five statuses (keeping the current
  // one just applies a delivery-date update); everyone else moves one step forward.
  const selectableStatuses = canOverride
    ? [...orderStatuses]
    : nextStandardStatus
      ? [nextStandardStatus]
      : [];
  const defaultStatus = selectableStatuses.includes(currentStatus)
    ? currentStatus
    : (selectableStatuses[0] ?? "");

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
          <select defaultValue={defaultStatus} id="status-new-status" name="newStatus" required>
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
          <label htmlFor="status-estimated-delivery-date">{dict.estimatedDeliveryFrom}</label>
          <input
            defaultValue={currentEstimatedDeliveryDate}
            id="status-estimated-delivery-date"
            name="estimatedDeliveryDate"
            required
            type="date"
          />
          {getFieldError(state.fieldErrors, "estimatedDeliveryDate") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "estimatedDeliveryDate")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="status-estimated-delivery-date-end">{dict.estimatedDeliveryTo}</label>
          <input
            defaultValue={currentEstimatedDeliveryDateEnd}
            id="status-estimated-delivery-date-end"
            name="estimatedDeliveryDateEnd"
            required
            type="date"
          />
          {getFieldError(state.fieldErrors, "estimatedDeliveryDateEnd") ? (
            <p className="field-error">{getFieldError(state.fieldErrors, "estimatedDeliveryDateEnd")}</p>
          ) : null}
        </div>
      </div>

      {canOverride ? (
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
      ) : null}

      <button className="button-base button-primary" disabled={pending || selectableStatuses.length === 0} type="submit">
        {pending ? dict.changing : dict.submit}
      </button>
    </form>
  );
}
