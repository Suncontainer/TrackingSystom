import "server-only";

import { Resend } from "resend";
import { desc, eq, isNull, lt, sql } from "drizzle-orm";

import { getServerEnv } from "@/config/env";
import { siteConfig } from "@/config/site";
import { getDb } from "@/db/client";
import { customers, emailOutbox, emailSuppressions, orders, type EmailStatus, type EmailType } from "@/db/schema";
import type { AppLocale } from "@/i18n/types";
import { formatCustomerName } from "@/features/customers/normalization";
import { isDemoMode, listDemoEmailHistory } from "@/features/demo/store";
import { getAppSettings } from "@/features/settings/service";
import { createTrackingToken } from "@/features/tracking/tokens";

import { getNextAttemptAt, getStaleProcessingCutoff } from "./backoff";
import { renderEmailTemplate, type EmailTemplateVariables } from "./templates";

type ClaimedEmail = {
  attemptCount: number;
  category: string;
  customerEmail: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  currentEstimatedDeliveryDate: string | null;
  currentEstimatedDeliveryDateEnd: string | null;
  emailType: EmailType;
  id: string;
  idempotencyKey: string;
  locale: string;
  maxAttempts: number;
  orderId: string | null;
  orderNumber: string | null;
  productDescription: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  templateKey: string;
  templateVariables: EmailTemplateVariables;
  trackingLinkVersion: number | null;
  trackingNumber: string | null;
};

export type ProcessEmailOutboxResult = {
  claimed: number;
  failed: number;
  sent: number;
  simulated: number;
  suppressed: number;
};

function normalizeLocale(locale: string): AppLocale {
  return locale === "en" ? "en" : "de";
}

function getTrackingSecret() {
  const env = getServerEnv();

  if (env.TRACKING_LINK_SECRET) {
    return env.TRACKING_LINK_SECRET;
  }

  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    throw new Error("TRACKING_LINK_SECRET is required to render tracking email links.");
  }

  return "development-tracking-link-secret";
}

function getAbsoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? siteConfig.appUrl;
  return new URL(path, base).toString();
}

function getTemplateVariables(row: ClaimedEmail, secureTrackingUrl: string | undefined) {
  const customerName = [row.customerFirstName, row.customerLastName].filter(Boolean).join(" ") || row.recipientName || undefined;
  const variables: EmailTemplateVariables = { ...row.templateVariables };

  if (!variables.currentEstimatedDeliveryDate && row.currentEstimatedDeliveryDate) {
    variables.currentEstimatedDeliveryDate = row.currentEstimatedDeliveryDate;
  }

  if (!variables.currentEstimatedDeliveryDateEnd && row.currentEstimatedDeliveryDateEnd) {
    variables.currentEstimatedDeliveryDateEnd = row.currentEstimatedDeliveryDateEnd;
  }

  if (!variables.customerEmail && row.customerEmail) {
    variables.customerEmail = row.customerEmail;
  }

  if (!variables.customerName && customerName) {
    variables.customerName = customerName;
  }

  if (!variables.estimatedDeliveryDate && row.currentEstimatedDeliveryDate) {
    variables.estimatedDeliveryDate = row.currentEstimatedDeliveryDate;
  }

  if (!variables.estimatedDeliveryDateEnd && row.currentEstimatedDeliveryDateEnd) {
    variables.estimatedDeliveryDateEnd = row.currentEstimatedDeliveryDateEnd;
  }

  if (!variables.orderAdminUrl && row.orderId) {
    variables.orderAdminUrl = getAbsoluteUrl(`/admin/orders/${row.orderId}`);
  }

  if (!variables.orderNumber && row.orderNumber) {
    variables.orderNumber = row.orderNumber;
  }

  if (!variables.productDescription && row.productDescription) {
    variables.productDescription = row.productDescription;
  }

  if (secureTrackingUrl) {
    variables.secureTrackingUrl = secureTrackingUrl;
  }

  if (!variables.publicTrackingUrl) {
    variables.publicTrackingUrl = getAbsoluteUrl("/");
  }

  if (!variables.trackingNumber && row.trackingNumber) {
    variables.trackingNumber = row.trackingNumber;
  }

  return variables;
}

async function isSuppressed(recipientEmail: string) {
  const normalized = recipientEmail.trim().toLowerCase();
  const [suppression] = await getDb()
    .select({ id: emailSuppressions.id })
    .from(emailSuppressions)
    .where(sql`${emailSuppressions.emailNormalized} = ${normalized} and ${emailSuppressions.removedAt} is null`)
    .limit(1);

  return Boolean(suppression);
}

async function claimEligibleEmails(limit: number, workerId: string) {
  const db = getDb();
  const staleCutoff = getStaleProcessingCutoff();

  const rows = await db.execute(sql<ClaimedEmail>`
    with eligible as (
      select ${emailOutbox.id}
      from ${emailOutbox}
      where (
        (${emailOutbox.status} = 'QUEUED' and ${emailOutbox.nextAttemptAt} <= now())
        or (${emailOutbox.status} = 'FAILED' and ${emailOutbox.nextAttemptAt} <= now() and ${emailOutbox.attemptCount} < ${emailOutbox.maxAttempts})
        or (${emailOutbox.status} = 'PROCESSING' and ${lt(emailOutbox.lockedAt, staleCutoff)})
      )
      order by ${emailOutbox.createdAt}
      for update skip locked
      limit ${limit}
    )
    update ${emailOutbox}
    set status = 'PROCESSING',
        locked_at = now(),
        locked_by = ${workerId},
        attempt_count = ${emailOutbox.attemptCount} + 1,
        updated_at = now()
    from eligible
    where ${emailOutbox.id} = eligible.id
    returning
      ${emailOutbox.id} as "id",
      ${emailOutbox.orderId} as "orderId",
      ${emailOutbox.emailType} as "emailType",
      ${emailOutbox.category} as "category",
      ${emailOutbox.recipientEmail} as "recipientEmail",
      ${emailOutbox.recipientName} as "recipientName",
      ${emailOutbox.locale} as "locale",
      ${emailOutbox.templateKey} as "templateKey",
      ${emailOutbox.templateVariables} as "templateVariables",
      ${emailOutbox.subject} as "subject",
      ${emailOutbox.idempotencyKey} as "idempotencyKey",
      ${emailOutbox.attemptCount} as "attemptCount",
      ${emailOutbox.maxAttempts} as "maxAttempts",
      (select ${orders.orderNumber} from ${orders} where ${orders.id} = ${emailOutbox.orderId}) as "orderNumber",
      (select ${orders.trackingNumber} from ${orders} where ${orders.id} = ${emailOutbox.orderId}) as "trackingNumber",
      (select ${orders.trackingLinkVersion} from ${orders} where ${orders.id} = ${emailOutbox.orderId}) as "trackingLinkVersion",
      (select ${orders.currentEstimatedDeliveryDate} from ${orders} where ${orders.id} = ${emailOutbox.orderId}) as "currentEstimatedDeliveryDate",
      (select ${orders.currentEstimatedDeliveryDateEnd} from ${orders} where ${orders.id} = ${emailOutbox.orderId}) as "currentEstimatedDeliveryDateEnd",
      (select ${orders.productDescription} from ${orders} where ${orders.id} = ${emailOutbox.orderId}) as "productDescription",
      (select ${customers.firstName} from ${customers} where ${customers.id} = ${emailOutbox.customerId}) as "customerFirstName",
      (select ${customers.lastName} from ${customers} where ${customers.id} = ${emailOutbox.customerId}) as "customerLastName",
      (select ${customers.email} from ${customers} where ${customers.id} = ${emailOutbox.customerId}) as "customerEmail"
  `);

  return rows as unknown as ClaimedEmail[];
}

async function markEmailStatus(id: string, values: {
  failedAt?: Date | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  nextAttemptAt?: Date;
  providerMessageId?: string | null;
  sentAt?: Date | null;
  status: EmailStatus;
}) {
  await getDb()
    .update(emailOutbox)
    .set({
      failedAt: values.failedAt,
      lastErrorCode: values.lastErrorCode,
      lastErrorMessage: values.lastErrorMessage,
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: values.nextAttemptAt,
      providerMessageId: values.providerMessageId,
      sentAt: values.sentAt,
      status: values.status,
      updatedAt: new Date()
    })
    .where(eq(emailOutbox.id, id));
}

async function sendEmail(row: ClaimedEmail, html: string, text: string, subject: string) {
  const env = getServerEnv();

  if (env.EMAIL_MODE !== "production") {
    return {
      mode: env.EMAIL_MODE,
      providerMessageId: `simulated:${row.id}`
    };
  }

  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required for production email delivery.");
  }

  const settings = await getAppSettings();
  const from = settings.emailFromAddress
    ? `${settings.emailFromName} <${settings.emailFromAddress}>`
    : env.EMAIL_FROM;

  const resend = new Resend(env.RESEND_API_KEY);
  const response = await resend.emails.send({
    from,
    headers: {
      "Idempotency-Key": row.idempotencyKey
    },
    html,
    replyTo: env.EMAIL_REPLY_TO,
    subject,
    text,
    to: row.recipientEmail
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    mode: "production",
    providerMessageId: response.data?.id ?? null
  };
}

async function processClaimedEmail(row: ClaimedEmail): Promise<"sent" | "simulated" | "suppressed" | "failed"> {
  if (await isSuppressed(row.recipientEmail)) {
    await markEmailStatus(row.id, {
      failedAt: new Date(),
      lastErrorCode: "suppressed",
      lastErrorMessage: "Recipient is suppressed.",
      status: "SUPPRESSED"
    });
    return "suppressed";
  }

  try {
    const secureTrackingUrl = row.orderId && row.trackingLinkVersion
      ? getAbsoluteUrl(`/track/${encodeURIComponent(await createTrackingToken({ orderId: row.orderId, tokenVersion: row.trackingLinkVersion }, getTrackingSecret()))}`)
      : undefined;
    const variables = getTemplateVariables(row, secureTrackingUrl);
    const rendered = await renderEmailTemplate({
      emailType: row.emailType,
      locale: normalizeLocale(row.locale),
      templateVariables: variables
    });
    const sent = await sendEmail(row, rendered.html, rendered.text, rendered.subject || row.subject);

    await markEmailStatus(row.id, {
      providerMessageId: sent.providerMessageId,
      sentAt: new Date(),
      status: sent.mode === "production" ? "SENT" : "SIMULATED"
    });

    return sent.mode === "production" ? "sent" : "simulated";
  } catch (error) {
    const nextAttemptCount = row.attemptCount;
    const exhausted = nextAttemptCount >= row.maxAttempts;

    await markEmailStatus(row.id, {
      failedAt: exhausted ? new Date() : null,
      lastErrorCode: "send_failed",
      lastErrorMessage: error instanceof Error ? error.message.slice(0, 500) : "Unknown email send failure.",
      nextAttemptAt: getNextAttemptAt(nextAttemptCount),
      status: "FAILED"
    });

    return "failed";
  }
}

export async function processEmailOutbox(limit = 25): Promise<ProcessEmailOutboxResult> {
  const workerId = `worker:${Date.now()}:${Math.random().toString(16).slice(2)}`;
  const rows = await claimEligibleEmails(limit, workerId);
  const result: ProcessEmailOutboxResult = {
    claimed: rows.length,
    failed: 0,
    sent: 0,
    simulated: 0,
    suppressed: 0
  };

  for (const row of rows) {
    const outcome = await processClaimedEmail(row);
    result[outcome] += 1;
  }

  return result;
}

export async function triggerImmediateEmailDispatch(limit = 5) {
  try {
    await processEmailOutbox(limit);
  } catch (error) {
    console.error("email_outbox_immediate_dispatch_failed", error);
  }
}

export async function retryEmailOutboxEntry(emailId: string) {
  const db = getDb();
  const [entry] = await db
    .select({
      customerId: emailOutbox.customerId,
      id: emailOutbox.id,
      recipientEmail: emailOutbox.recipientEmail,
      recipientName: emailOutbox.recipientName
    })
    .from(emailOutbox)
    .where(eq(emailOutbox.id, emailId))
    .limit(1);

  if (!entry) {
    throw new Error("Email outbox entry not found.");
  }

  const [customer] = entry.customerId
    ? await db
      .select({
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName
      })
      .from(customers)
      .where(eq(customers.id, entry.customerId))
      .limit(1)
    : [];
  const recipientEmail = customer?.email ?? entry.recipientEmail;
  const recipientName = customer ? formatCustomerName(customer.firstName, customer.lastName) : entry.recipientName;

  await db
    .update(emailOutbox)
    .set({
      attemptCount: 0,
      bouncedAt: null,
      complainedAt: null,
      deliveredAt: null,
      failedAt: null,
      idempotencyKey: `manual-retry/${entry.id}/${Date.now()}`,
      lastErrorCode: null,
      lastErrorMessage: null,
      lockedAt: null,
      lockedBy: null,
      nextAttemptAt: new Date(),
      providerMessageId: null,
      recipientEmail,
      recipientName,
      sentAt: null,
      status: "QUEUED",
      updatedAt: new Date()
    })
    .where(eq(emailOutbox.id, entry.id));

  await triggerImmediateEmailDispatch(1);
}

export async function listEmailHistory() {
  if (isDemoMode()) {
    return listDemoEmailHistory();
  }

  return getDb()
    .select({
      attemptCount: emailOutbox.attemptCount,
      category: emailOutbox.category,
      createdAt: emailOutbox.createdAt,
      bouncedAt: emailOutbox.bouncedAt,
      complainedAt: emailOutbox.complainedAt,
      deliveredAt: emailOutbox.deliveredAt,
      emailType: emailOutbox.emailType,
      failedAt: emailOutbox.failedAt,
      id: emailOutbox.id,
      lastErrorCode: emailOutbox.lastErrorCode,
      lastErrorMessage: emailOutbox.lastErrorMessage,
      orderId: emailOutbox.orderId,
      providerMessageId: emailOutbox.providerMessageId,
      recipientEmail: emailOutbox.recipientEmail,
      sentAt: emailOutbox.sentAt,
      status: emailOutbox.status,
      subject: emailOutbox.subject
    })
    .from(emailOutbox)
    .where(isNull(emailOutbox.lockedAt))
    .orderBy(desc(emailOutbox.createdAt))
    .limit(100);
}
