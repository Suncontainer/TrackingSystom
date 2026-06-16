import { addDays, formatISO, subDays } from "date-fns";

import { getDb } from "./client-core";
import { assertCanSeed } from "./seed-safety";
import {
  auditLogs,
  customerCommunicationPreferences,
  customers,
  deliveryDateHistory,
  emailOutbox,
  internalNotes,
  orderNumberCounters,
  orders,
  orderStatusHistory,
  profiles,
  type AppRole,
  type DbOrderStatus
} from "./schema";

type SeedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AppRole;
};

function optionalSeedUser(
  id: string | undefined,
  firstName: string,
  lastName: string,
  email: string,
  role: AppRole
): SeedUser | null {
  if (!id) {
    return null;
  }

  return {
    id,
    firstName,
    lastName,
    email,
    role
  };
}

function buildSeedUsers(env: NodeJS.ProcessEnv): [SeedUser, ...SeedUser[]] {
  const superAdminId = env.SEED_SUPER_ADMIN_AUTH_USER_ID;

  if (!superAdminId) {
    throw new Error("SEED_SUPER_ADMIN_AUTH_USER_ID is required.");
  }

  const superAdmin: SeedUser = {
    id: superAdminId,
    firstName: "Super",
    lastName: "Admin",
    email: "super.admin@example.com",
    role: "SUPER_ADMIN"
  };
  const optionalUsers = [
    optionalSeedUser(env.SEED_ADMIN_AUTH_USER_ID, "Ada", "Admin", "admin@example.com", "ADMIN"),
    optionalSeedUser(env.SEED_SALES_AUTH_USER_ID, "Sam", "Sales", "sales@example.com", "SALES"),
    optionalSeedUser(
      env.SEED_READ_ONLY_AUTH_USER_ID,
      "Rita",
      "Read",
      "readonly@example.com",
      "READ_ONLY"
    )
  ].filter((user): user is SeedUser => user !== null);

  return [superAdmin, ...optionalUsers];
}

function dateOnly(date: Date) {
  return formatISO(date, { representation: "date" });
}

export async function seedDevelopmentData(env: NodeJS.ProcessEnv = process.env) {
  assertCanSeed(env);

  const db = getDb();
  const users = buildSeedUsers(env);
  const superAdmin = users[0];
  const salesUser = users.find((user) => user.role === "SALES");
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .insert(profiles)
      .values(users.map((user) => ({ ...user, isActive: true })))
      .onConflictDoNothing();

    await tx.insert(orderNumberCounters).values({ year: 2026, prefix: "SC", nextValue: 6 }).onConflictDoNothing();

    await tx
      .insert(customers)
      .values([
        {
          id: "10000000-0000-4000-8000-000000000001",
          firstName: "Max",
          lastName: "Mustermann",
          email: "max.mustermann@example.com",
          emailNormalized: "max.mustermann@example.com",
          preferredLanguage: "de",
          phone: "+49 30 000000"
        },
        {
          id: "10000000-0000-4000-8000-000000000002",
          firstName: "Erika",
          lastName: "Beispiel",
          email: "erika.beispiel@example.com",
          emailNormalized: "erika.beispiel@example.com",
          preferredLanguage: "de"
        },
        {
          id: "10000000-0000-4000-8000-000000000003",
          firstName: "John",
          lastName: "Example",
          email: "john.example@example.com",
          emailNormalized: "john.example@example.com",
          preferredLanguage: "en"
        },
        {
          id: "10000000-0000-4000-8000-000000000004",
          firstName: "Olivia",
          lastName: "Optional",
          email: "olivia.optional@example.com",
          emailNormalized: "olivia.optional@example.com",
          preferredLanguage: "en"
        }
      ])
      .onConflictDoNothing();

    await tx
      .insert(customerCommunicationPreferences)
      .values({
        id: "11000000-0000-4000-8000-000000000004",
        customerId: "10000000-0000-4000-8000-000000000004",
        reviewRequestAllowed: true,
        satisfactionSurveyAllowed: true,
        maintenanceRecommendationAllowed: false,
        warrantyReminderAllowed: true,
        promotionalEmailAllowed: false,
        marketingConsentSource: "development-seed",
        marketingConsentAt: now,
        updatedBy: superAdmin.id
      })
      .onConflictDoNothing();

    const orderSeeds: Array<{
      id: string;
      customerId: string;
      orderNumber: string;
      trackingNumber: string;
      status: DbOrderStatus;
      productDescription: string;
      dueOffsetDays: number;
      actualDeliveryDate?: string;
      deliveredAt?: Date;
    }> = [
      {
        id: "20000000-0000-4000-8000-000000000001",
        customerId: "10000000-0000-4000-8000-000000000001",
        orderNumber: "SC-2026-000001",
        trackingNumber: "SC7K9M4XPQ82DH",
        status: "ORDER_CONFIRMED",
        productDescription: "20-Fuß Lagercontainer",
        dueOffsetDays: 21
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        customerId: "10000000-0000-4000-8000-000000000002",
        orderNumber: "SC-2026-000002",
        trackingNumber: "SCK7MA4XPQ82DK",
        status: "IN_PRODUCTION",
        productDescription: "Bürocontainer mit Isolierung",
        dueOffsetDays: 10
      },
      {
        id: "20000000-0000-4000-8000-000000000003",
        customerId: "10000000-0000-4000-8000-000000000003",
        orderNumber: "SC-2026-000003",
        trackingNumber: "SC8H3M4XPQ72DL",
        status: "IN_TRANSIT",
        productDescription: "Sanitärcontainer",
        dueOffsetDays: -2
      },
      {
        id: "20000000-0000-4000-8000-000000000004",
        customerId: "10000000-0000-4000-8000-000000000004",
        orderNumber: "SC-2026-000004",
        trackingNumber: "SC9H3M5XPQ72DM",
        status: "DELIVERED",
        productDescription: "Modulcontainer Kombination",
        dueOffsetDays: -14,
        actualDeliveryDate: dateOnly(subDays(now, 1)),
        deliveredAt: subDays(now, 1)
      }
    ];

    await tx
      .insert(orders)
      .values(
        orderSeeds.map((order) => ({
          id: order.id,
          customerId: order.customerId,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber,
          status: order.status,
          productDescription: order.productDescription,
          initialEstimatedDeliveryDate: dateOnly(addDays(now, order.dueOffsetDays)),
          currentEstimatedDeliveryDate: dateOnly(addDays(now, order.dueOffsetDays)),
          actualDeliveryDate: order.actualDeliveryDate ?? null,
          assignedSalespersonId: salesUser?.id ?? null,
          assignedSalespersonEmail: salesUser ? null : "sales@example.com",
          deliveredAt: order.deliveredAt ?? null,
          createdBy: superAdmin.id,
          updatedBy: superAdmin.id
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(orderStatusHistory)
      .values(
        orderSeeds.map((order, index) => ({
          id: `30000000-0000-4000-8000-00000000000${index + 1}`,
          orderId: order.id,
          previousStatus: null,
          newStatus: order.status,
          estimatedDeliveryDateSnapshot: dateOnly(addDays(now, order.dueOffsetDays)),
          changeType: "INITIAL",
          changedBy: superAdmin.id
        }))
      )
      .onConflictDoNothing();

    await tx
      .insert(deliveryDateHistory)
      .values({
        id: "40000000-0000-4000-8000-000000000001",
        orderId: "20000000-0000-4000-8000-000000000003",
        previousDate: dateOnly(addDays(now, 3)),
        newDate: dateOnly(subDays(now, 2)),
        reason: "Development overdue example",
        customerNotificationRequested: false,
        changedBy: superAdmin.id
      })
      .onConflictDoNothing();

    await tx
      .insert(internalNotes)
      .values({
        id: "50000000-0000-4000-8000-000000000001",
        orderId: "20000000-0000-4000-8000-000000000001",
        body: "Development seed note. Do not use real customer data.",
        createdBy: superAdmin.id
      })
      .onConflictDoNothing();

    await tx
      .insert(emailOutbox)
      .values({
        id: "60000000-0000-4000-8000-000000000001",
        orderId: "20000000-0000-4000-8000-000000000003",
        customerId: "10000000-0000-4000-8000-000000000003",
        emailType: "IN_TRANSIT",
        category: "TRANSACTIONAL",
        recipientEmail: "john.example@example.com",
        recipientName: "John Example",
        locale: "en",
        templateKey: "in-transit",
        templateVersion: 1,
        templateVariables: {
          orderNumber: "SC-2026-000003",
          trackingNumber: "SC8H3M4XPQ72DL"
        },
        subject: "Your Order Is On The Way",
        idempotencyKey: "seed/status/20000000-0000-4000-8000-000000000003/customer",
        status: "FAILED",
        attemptCount: 5,
        maxAttempts: 5,
        lastErrorCode: "seed_failure",
        lastErrorMessage: "Development failed email example",
        queuedBy: superAdmin.id,
        failedAt: now
      })
      .onConflictDoNothing();

    await tx
      .insert(auditLogs)
      .values({
        id: "70000000-0000-4000-8000-000000000001",
        actorUserId: superAdmin.id,
        action: "seed.created",
        entityType: "seed",
        metadata: {
          source: "development"
        }
      })
      .onConflictDoNothing();
  });
}
