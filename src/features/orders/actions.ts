"use server";

import { redirect } from "next/navigation";

import { requireOrderAccess, requirePermission } from "@/features/auth/guards";
import { assertCan } from "@/features/auth/permissions";
import { ValidationError, ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { routes } from "@/config/routes";

import { initialOrderFormState, type OrderFormState } from "./form-state";
import {
  addInternalNote,
  changeOrderStatus,
  createOrder,
  setOrderArchiveState,
  updateEstimatedDeliveryDate,
  updateOrderDetails
} from "./service";

type OrderActionState = OrderFormState;

function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getActionErrorState(error: unknown, values?: Record<string, string>): OrderActionState {
  const submitted = values ? { values } : {};

  if (error instanceof ValidationError) {
    return {
      fieldErrors: error.fieldErrors,
      formError: error.message,
      ...submitted
    };
  }

  if (error instanceof ConflictError || error instanceof NotFoundError) {
    return {
      fieldErrors: {},
      formError: error.message,
      ...submitted
    };
  }

  // Unexpected (e.g. database) failure: log the real cause so it stops being an
  // opaque "request could not be completed", then return the generic message.
  console.error("[order-action] unexpected error", error);

  return {
    fieldErrors: {},
    formError: "The request could not be completed.",
    ...submitted
  };
}

// Capture the submitted text fields so the form can repopulate them after an
// error (React 19 resets uncontrolled inputs once the action returns).
function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

export async function createOrderAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  let orderId: string;

  try {
    const profile = await requirePermission("orders:create");
    const order = await createOrder(formDataToObject(formData), profile);
    orderId = order.id;
  } catch (error) {
    return getActionErrorState(error, formValues(formData));
  }

  redirect(`${routes.admin.orderDetails(orderId)}?created=1`);
}

export async function updateOrderAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  let orderId: string;

  try {
    const profile = await requirePermission("orders:update");
    const result = await updateOrderDetails(formDataToObject(formData), profile);
    orderId = result.id;
  } catch (error) {
    return getActionErrorState(error);
  }

  redirect(`${routes.admin.orderDetails(orderId)}?updated=1`);
}

export async function addInternalNoteAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  let orderId: string;

  try {
    const targetOrderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(targetOrderId);
    assertCan(profile.role, "notes:create");
    const note = await addInternalNote(formDataToObject(formData), profile);
    orderId = note.orderId;
  } catch (error) {
    return getActionErrorState(error);
  }

  redirect(`${routes.admin.orderDetails(orderId)}?noted=1`);
}

export async function changeOrderStatusAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  let orderId: string;

  try {
    const targetOrderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(targetOrderId);
    assertCan(profile.role, "orders:update");
    const order = await changeOrderStatus(formDataToObject(formData), profile);
    orderId = order.id;
  } catch (error) {
    return getActionErrorState(error);
  }

  redirect(`${routes.admin.orderDetails(orderId)}?statusChanged=1`);
}

export async function updateEstimatedDeliveryDateAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  let orderId: string;

  try {
    const targetOrderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(targetOrderId);
    assertCan(profile.role, "orders:update");
    const order = await updateEstimatedDeliveryDate(formDataToObject(formData), profile);
    orderId = order.id;
  } catch (error) {
    return getActionErrorState(error);
  }

  redirect(`${routes.admin.orderDetails(orderId)}?dateChanged=1`);
}

export async function setOrderArchiveStateAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  let orderId: string;
  let redirectMode: string;

  try {
    const targetOrderId = String(formData.get("orderId") ?? "");
    const mode = String(formData.get("mode") ?? "archive");
    const profile = await requireOrderAccess(targetOrderId);
    assertCan(profile.role, "orders:archive");
    const order = await setOrderArchiveState(formDataToObject(formData), profile);
    orderId = order.id;
    redirectMode = mode;
  } catch (error) {
    return getActionErrorState(error);
  }

  redirect(`${routes.admin.orderDetails(orderId)}?${redirectMode === "restore" ? "restored" : "archived"}=1`);
}

// Archive/restore triggered from a row on the orders list. Unlike the detail-page
// form this does not redirect away — the service revalidates the list, so the row
// simply disappears (or reappears) in place.
export async function setOrderArchiveStateInlineAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const targetOrderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(targetOrderId);
    assertCan(profile.role, "orders:archive");
    await setOrderArchiveState(formDataToObject(formData), profile);
  } catch (error) {
    return getActionErrorState(error);
  }

  return initialOrderFormState;
}
