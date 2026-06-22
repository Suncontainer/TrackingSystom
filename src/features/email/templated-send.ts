import "server-only";

import { randomUUID } from "node:crypto";

import { desc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { customers, emailOutbox, orders } from "@/db/schema";
import { formatCustomerName } from "@/features/customers/normalization";
import { isDemoMode } from "@/features/demo/store";
import { formatTrackingNumber } from "@/features/orders/identifiers";
import { getEmailTemplate } from "@/features/templates/service";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import type { AppLocale } from "@/i18n/types";

import { triggerImmediateEmailDispatch } from "./outbox";

function normalizeLocale(value: string): AppLocale {
  return value === "en" ? "en" : "de";
}

function formatRange(start: string, end: string | null, locale: AppLocale) {
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", { dateStyle: "medium" });

  if (!end || start === end) {
    return formatter.format(new Date(start));
  }

  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

// Maps each order status to the template key sent automatically on a status change.
export const STATUS_TEMPLATE_KEYS: Record<string, string> = {
  ORDER_CONFIRMED: "order-confirmation",
  PROCUREMENT: "procurement",
  IN_PRODUCTION: "in-production",
  IN_TRANSIT: "on-the-way",
  DELIVERED: "delivered"
};

type TemplateContentInput = {
  subjectDe: string;
  bodyDe: string;
  subjectEn: string;
  bodyEn: string;
};

export function renderTemplateContent(
  template: TemplateContentInput,
  locale: AppLocale,
  vars: Record<string, string>
) {
  return {
    subject: interpolate(locale === "de" ? template.subjectDe : template.subjectEn, vars),
    body: interpolate(locale === "de" ? template.bodyDe : template.bodyEn, vars)
  };
}

// Active orders for the Emails-page send composer (where there is no order context).
export async function listSelectableOrders() {
  if (isDemoMode()) {
    return [] as Array<{ id: string; label: string }>;
  }

  const rows = await getDb()
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      firstName: customers.firstName,
      lastName: customers.lastName
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(isNull(orders.archivedAt))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  return rows.map((row) => ({
    id: row.id,
    label: `${row.orderNumber} — ${formatCustomerName(row.firstName, row.lastName)}`
  }));
}

export async function queueTemplatedCustomerEmail(
  input: { orderId: string; templateId: string },
  actor: { id: string }
) {
  if (isDemoMode()) {
    throw new ValidationError("Sending templated emails is not available in demo mode.");
  }

  const template = await getEmailTemplate(input.templateId);

  if (!template) {
    throw new ValidationError("Choose a template to send.", { templateId: ["Select a template."] });
  }

  const db = getDb();
  const [order] = await db
    .select({
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      currentEstimatedDeliveryDateEnd: orders.currentEstimatedDeliveryDateEnd,
      customerEmail: customers.email,
      customerFirstName: customers.firstName,
      customerId: customers.id,
      customerLastName: customers.lastName,
      orderNumber: orders.orderNumber,
      preferredLanguage: customers.preferredLanguage,
      trackingNumber: orders.trackingNumber
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, input.orderId))
    .limit(1);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  const locale = normalizeLocale(order.preferredLanguage);
  const customerName = formatCustomerName(order.customerFirstName, order.customerLastName);
  const vars = {
    customerName,
    orderNumber: order.orderNumber,
    trackingNumber: formatTrackingNumber(order.trackingNumber),
    deliveryDate: formatRange(order.currentEstimatedDeliveryDate, order.currentEstimatedDeliveryDateEnd, locale)
  };

  const subject = interpolate(locale === "de" ? template.subjectDe : template.subjectEn, vars);
  const body = interpolate(locale === "de" ? template.bodyDe : template.bodyEn, vars);

  await db.insert(emailOutbox).values({
    category: "TRANSACTIONAL",
    customerId: order.customerId,
    emailType: "ADMIN_TEMPLATE",
    idempotencyKey: `admin-template/${randomUUID()}`,
    locale,
    orderId: input.orderId,
    queuedBy: actor.id,
    recipientEmail: order.customerEmail,
    recipientName: customerName,
    subject,
    templateKey: template.key,
    templateVariables: {
      customBody: body,
      customSubject: subject,
      customerName,
      orderNumber: order.orderNumber,
      trackingNumber: vars.trackingNumber
    }
  });

  await triggerImmediateEmailDispatch(1);

  return { orderId: input.orderId };
}
