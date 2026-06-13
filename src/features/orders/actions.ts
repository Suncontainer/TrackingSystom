"use server";

import { redirect } from "next/navigation";

import { requireOrderAccess, requirePermission } from "@/features/auth/guards";
import { assertCan } from "@/features/auth/permissions";
import { ValidationError, ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { routes } from "@/config/routes";

import type { OrderFormState } from "./form-state";
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

function getActionErrorState(error: unknown): OrderActionState {
  if (error instanceof ValidationError) {
    return {
      fieldErrors: error.fieldErrors,
      formError: error.message
    };
  }

  if (error instanceof ConflictError || error instanceof NotFoundError) {
    return {
      fieldErrors: {},
      formError: error.message
    };
  }

  return {
    fieldErrors: {},
    formError: "The request could not be completed."
  };
}

export async function createOrderAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const profile = await requirePermission("orders:create");
    const order = await createOrder(formDataToObject(formData), profile);

    redirect(`${routes.admin.orderDetails(order.id)}?created=1`);
  } catch (error) {
    return getActionErrorState(error);
  }
}

export async function updateOrderAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const profile = await requirePermission("orders:update");
    const result = await updateOrderDetails(formDataToObject(formData), profile);

    redirect(`${routes.admin.orderDetails(result.id)}?updated=1`);
  } catch (error) {
    return getActionErrorState(error);
  }
}

export async function addInternalNoteAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const orderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "notes:create");
    const note = await addInternalNote(formDataToObject(formData), profile);

    redirect(`${routes.admin.orderDetails(note.orderId)}?noted=1`);
  } catch (error) {
    return getActionErrorState(error);
  }
}

export async function changeOrderStatusAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const orderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:update");
    const order = await changeOrderStatus(formDataToObject(formData), profile);

    redirect(`${routes.admin.orderDetails(order.id)}?statusChanged=1`);
  } catch (error) {
    return getActionErrorState(error);
  }
}

export async function updateEstimatedDeliveryDateAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const orderId = String(formData.get("orderId") ?? "");
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:update");
    const order = await updateEstimatedDeliveryDate(formDataToObject(formData), profile);

    redirect(`${routes.admin.orderDetails(order.id)}?dateChanged=1`);
  } catch (error) {
    return getActionErrorState(error);
  }
}

export async function setOrderArchiveStateAction(
  _previousState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  try {
    const orderId = String(formData.get("orderId") ?? "");
    const mode = String(formData.get("mode") ?? "archive");
    const profile = await requireOrderAccess(orderId);
    assertCan(profile.role, "orders:archive");
    const order = await setOrderArchiveState(formDataToObject(formData), profile);

    redirect(`${routes.admin.orderDetails(order.id)}?${mode === "restore" ? "restored" : "archived"}=1`);
  } catch (error) {
    return getActionErrorState(error);
  }
}
