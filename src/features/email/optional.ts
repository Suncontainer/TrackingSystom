import "server-only";

import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { routes } from "@/config/routes";
import { getDb } from "@/db/client";
import {
  customerCommunicationPreferences,
  customers,
  emailOutbox,
  emailSuppressions,
  orders
} from "@/db/schema";
import type { Profile } from "@/db/schema/types";
import { insertAuditEntry } from "@/features/audit/service";
import { formatCustomerName, normalizeCustomerEmail } from "@/features/customers/normalization";
import {
  getDemoOptionalEmailState,
  isDemoMode,
  queueDemoOptionalEmail
} from "@/features/demo/store";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { triggerImmediateEmailDispatch } from "./outbox";
import {
  isOptionalEmailEligible,
  optionalEmailDefinitions,
  optionalEmailTypes,
  type OptionalEmailType
} from "./optional-rules";

export { isOptionalEmailEligible, optionalEmailDefinitions, optionalEmailTypes, type OptionalEmailType };

const preferenceInputSchema = z.object({
  customerId: z.string().uuid(),
  maintenanceRecommendationAllowed: z.boolean(),
  reviewRequestAllowed: z.boolean(),
  satisfactionSurveyAllowed: z.boolean(),
  warrantyReminderAllowed: z.boolean()
});

const optionalSendInputSchema = z.object({
  confirmed: z.literal("yes"),
  customerId: z.string().uuid(),
  emailType: z.enum(optionalEmailTypes.filter((type) => type !== "PROMOTIONAL") as [Exclude<OptionalEmailType, "PROMOTIONAL">, ...Exclude<OptionalEmailType, "PROMOTIONAL">[]]),
  previewed: z.literal("yes")
});

export type CustomerOptionalEmailState = {
  lastDeliveredOrderId: string | null;
  preferences: {
    maintenanceRecommendationAllowed: boolean;
    promotionalEmailAllowed: boolean;
    reviewRequestAllowed: boolean;
    satisfactionSurveyAllowed: boolean;
    warrantyReminderAllowed: boolean;
  };
  sentCounts: Record<OptionalEmailType, number>;
  suppressed: boolean;
};

function defaultPreferences() {
  return {
    maintenanceRecommendationAllowed: false,
    promotionalEmailAllowed: false,
    reviewRequestAllowed: false,
    satisfactionSurveyAllowed: false,
    warrantyReminderAllowed: false
  };
}

export async function getCustomerOptionalEmailState(customerId: string): Promise<CustomerOptionalEmailState> {
  if (isDemoMode()) {
    return getDemoOptionalEmailState(customerId);
  }

  const db = getDb();
  const [[preferences], [lastDeliveredOrder], [suppression], counts] = await Promise.all([
    db
      .select({
        maintenanceRecommendationAllowed: customerCommunicationPreferences.maintenanceRecommendationAllowed,
        promotionalEmailAllowed: customerCommunicationPreferences.promotionalEmailAllowed,
        reviewRequestAllowed: customerCommunicationPreferences.reviewRequestAllowed,
        satisfactionSurveyAllowed: customerCommunicationPreferences.satisfactionSurveyAllowed,
        warrantyReminderAllowed: customerCommunicationPreferences.warrantyReminderAllowed
      })
      .from(customerCommunicationPreferences)
      .where(eq(customerCommunicationPreferences.customerId, customerId))
      .limit(1),
    db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.customerId, customerId), eq(orders.status, "DELIVERED")))
      .orderBy(desc(orders.deliveredAt), desc(orders.updatedAt))
      .limit(1),
    db
      .select({ id: emailSuppressions.id })
      .from(emailSuppressions)
      .innerJoin(customers, eq(customers.emailNormalized, emailSuppressions.emailNormalized))
      .where(and(eq(customers.id, customerId), isNull(emailSuppressions.removedAt)))
      .limit(1),
    db
      .select({
        emailType: emailOutbox.emailType,
        id: emailOutbox.id
      })
      .from(emailOutbox)
      .where(eq(emailOutbox.customerId, customerId))
  ]);

  const sentCounts = Object.fromEntries(optionalEmailTypes.map((type) => [type, 0])) as Record<OptionalEmailType, number>;

  for (const entry of counts) {
    if (optionalEmailTypes.includes(entry.emailType as OptionalEmailType)) {
      sentCounts[entry.emailType as OptionalEmailType] += 1;
    }
  }

  return {
    lastDeliveredOrderId: lastDeliveredOrder?.id ?? null,
    preferences: preferences ?? defaultPreferences(),
    sentCounts,
    suppressed: Boolean(suppression)
  };
}

export async function updateCustomerCommunicationPreferences(input: unknown, actor: Pick<Profile, "id">) {
  const parsed = preferenceInputSchema.safeParse({
    customerId: input instanceof FormData ? input.get("customerId") : undefined,
    maintenanceRecommendationAllowed: input instanceof FormData ? input.get("maintenanceRecommendationAllowed") === "on" : false,
    reviewRequestAllowed: input instanceof FormData ? input.get("reviewRequestAllowed") === "on" : false,
    satisfactionSurveyAllowed: input instanceof FormData ? input.get("satisfactionSurveyAllowed") === "on" : false,
    warrantyReminderAllowed: input instanceof FormData ? input.get("warrantyReminderAllowed") === "on" : false
  });

  if (!parsed.success) {
    throw new ValidationError("Preference update is invalid.", {});
  }

  const data = parsed.data;

  if (isDemoMode()) {
    revalidatePath(routes.admin.customerDetails(data.customerId));
    return;
  }

  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .insert(customerCommunicationPreferences)
      .values({
        customerId: data.customerId,
        maintenanceRecommendationAllowed: data.maintenanceRecommendationAllowed,
        reviewRequestAllowed: data.reviewRequestAllowed,
        satisfactionSurveyAllowed: data.satisfactionSurveyAllowed,
        updatedBy: actor.id,
        warrantyReminderAllowed: data.warrantyReminderAllowed
      })
      .onConflictDoUpdate({
        set: {
          maintenanceRecommendationAllowed: data.maintenanceRecommendationAllowed,
          reviewRequestAllowed: data.reviewRequestAllowed,
          satisfactionSurveyAllowed: data.satisfactionSurveyAllowed,
          updatedAt: new Date(),
          updatedBy: actor.id,
          warrantyReminderAllowed: data.warrantyReminderAllowed
        },
        target: customerCommunicationPreferences.customerId
      });

    await insertAuditEntry(tx, {
      action: "customer.communication-preferences.updated",
      actorUserId: actor.id,
      afterData: data,
      entityId: data.customerId,
      entityType: "customer"
    });
  });

  revalidatePath(routes.admin.customerDetails(data.customerId));
}

export async function queueOptionalCustomerEmail(input: unknown, actor: Pick<Profile, "id">) {
  const parsed = optionalSendInputSchema.safeParse(Object.fromEntries(input instanceof FormData ? input.entries() : []));

  if (!parsed.success) {
    throw new ValidationError("Optional email send request is invalid.", {});
  }

  const data = parsed.data;

  if (isDemoMode()) {
    const result = await queueDemoOptionalEmail(data.customerId, data.emailType);

    revalidatePath(routes.admin.customerDetails(result.customerId));

    return result;
  }

  const definition = optionalEmailDefinitions[data.emailType];
  const state = await getCustomerOptionalEmailState(data.customerId);
  const preferenceAllowed = state.preferences[definition.preferenceKey];

  if (!isOptionalEmailEligible({
    emailType: data.emailType,
    lastDeliveredOrderId: state.lastDeliveredOrderId,
    preferenceAllowed,
    suppressed: state.suppressed
  })) {
    throw new ConflictError("Optional email is not eligible for this customer.");
  }

  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [customer] = await tx
      .select({
        email: customers.email,
        firstName: customers.firstName,
        id: customers.id,
        lastName: customers.lastName,
        preferredLanguage: customers.preferredLanguage
      })
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1);

    if (!customer || !state.lastDeliveredOrderId) {
      throw new NotFoundError("Customer or delivered order not found.");
    }

    const [order] = await tx
      .select({
        currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
        id: orders.id,
        orderNumber: orders.orderNumber,
        productDescription: orders.productDescription,
        trackingNumber: orders.trackingNumber
      })
      .from(orders)
      .where(eq(orders.id, state.lastDeliveredOrderId))
      .limit(1);

    if (!order) {
      throw new NotFoundError("Delivered order not found.");
    }

    const customerName = formatCustomerName(customer.firstName, customer.lastName);
    const idempotencyKey = `optional/${data.emailType}/${data.customerId}/${Date.now()}`;
    const [queued] = await tx
      .insert(emailOutbox)
      .values({
        category: "OPTIONAL_SERVICE",
        customerId: customer.id,
        emailType: data.emailType,
        idempotencyKey,
        locale: customer.preferredLanguage,
        orderId: order.id,
        queuedBy: actor.id,
        recipientEmail: customer.email,
        recipientName: customerName,
        subject: definition.subject,
        templateKey: definition.templateKey,
        templateVariables: {
          customerName,
          orderId: order.id,
          orderNumber: order.orderNumber,
          productDescription: order.productDescription,
          trackingNumber: order.trackingNumber
        }
      })
      .returning({ id: emailOutbox.id });

    await insertAuditEntry(tx, {
      action: "email.optional.queued",
      actorUserId: actor.id,
      afterData: {
        emailType: data.emailType,
        idempotencyKey,
        recipientEmailNormalized: normalizeCustomerEmail(customer.email)
      },
      entityId: queued?.id ?? null,
      entityType: "email_outbox",
      orderId: order.id
    });

    return {
      customerId: customer.id,
      emailId: queued?.id ?? null
    };
  });

  await triggerImmediateEmailDispatch(1);
  revalidatePath(routes.admin.customerDetails(result.customerId));

  return result;
}
