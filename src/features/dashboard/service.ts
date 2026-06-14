import "server-only";

import { and, count, desc, eq, gte, inArray, isNull, lte, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import { customers, emailOutbox, orderStatusHistory, orders, type DbOrderStatus, type EmailStatus } from "@/db/schema";
import type { Profile } from "@/db/schema/types";
import {
  canUseDemoAdminData,
  isMissingDatabaseConfiguration
} from "@/features/demo/admin-data";
import { getDemoDashboardData, isDemoMode } from "@/features/demo/store";
import { formatCustomerName } from "@/features/customers/normalization";
import { formatTrackingNumber } from "@/features/orders/identifiers";

import { getDashboardPeriodStart, type DashboardPeriod } from "./helpers";

const failedEmailStatuses = ["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED"] satisfies EmailStatus[];

function getOrderScope(profile: Pick<Profile, "id" | "role">): SQL[] {
  return profile.role === "SALES" ? [eq(orders.assignedSalespersonId, profile.id)] : [];
}

function scopedWhere(profile: Pick<Profile, "id" | "role">, ...conditions: Array<SQL | undefined>) {
  const scopedConditions = [...getOrderScope(profile), ...conditions].filter(Boolean);
  return scopedConditions.length > 0 ? and(...scopedConditions) : undefined;
}

function activeOrderCondition(status?: DbOrderStatus) {
  return status
    ? and(isNull(orders.archivedAt), eq(orders.status, status))!
    : and(isNull(orders.archivedAt), sql`${orders.status} <> 'DELIVERED'`)!;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getDashboardData(profile: Pick<Profile, "id" | "role">, period: DashboardPeriod) {
  if (isDemoMode()) {
    return getDemoDashboardData(period);
  }

  let db: ReturnType<typeof getDb>;

  try {
    db = getDb();
  } catch (error) {
    if (isMissingDatabaseConfiguration(error) && canUseDemoAdminData()) {
      return getDemoDashboardData(period);
    }

    throw error;
  }
  const periodStart = getDashboardPeriodStart(period);
  const dueSoonDateTo = new Date();
  dueSoonDateTo.setDate(dueSoonDateTo.getDate() + 7);
  const orderScope = scopedWhere(profile);
  const scopedOrderWhere = (condition: SQL) => scopedWhere(profile, condition);

  const [metricsResult] = await db
    .select({
      activeOrders: sql<number>`count(*) filter (where ${activeOrderCondition()})::int`,
      deliveredInPeriod: sql<number>`count(*) filter (where ${orders.deliveredAt} >= ${periodStart})::int`,
      dueSoon: sql<number>`count(*) filter (
        where ${activeOrderCondition()}
          and ${orders.currentEstimatedDeliveryDate} >= current_date
          and ${orders.currentEstimatedDeliveryDate} <= current_date + interval '7 days'
      )::int`,
      inProduction: sql<number>`count(*) filter (where ${activeOrderCondition("IN_PRODUCTION")})::int`,
      inTransit: sql<number>`count(*) filter (where ${activeOrderCondition("IN_TRANSIT")})::int`,
      orderReceived: sql<number>`count(*) filter (where ${activeOrderCondition("ORDER_RECEIVED")})::int`,
      overdueActive: sql<number>`count(*) filter (
        where ${activeOrderCondition()}
          and ${orders.currentEstimatedDeliveryDate} < current_date
      )::int`
    })
    .from(orders)
    .where(orderScope);

  const [failedEmailResult] = await db
    .select({ value: count() })
    .from(emailOutbox)
    .innerJoin(orders, eq(emailOutbox.orderId, orders.id))
    .where(
      scopedWhere(
        profile,
        eq(emailOutbox.category, "TRANSACTIONAL"),
        inArray(emailOutbox.status, failedEmailStatuses)
      )
    );

  const overdueOrders = await db
    .select({
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      trackingNumber: orders.trackingNumber
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(scopedOrderWhere(and(activeOrderCondition(), sql`${orders.currentEstimatedDeliveryDate} < current_date`)!))
    .orderBy(orders.currentEstimatedDeliveryDate, desc(orders.updatedAt))
    .limit(6);

  const dueSoonOrders = await db
    .select({
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      trackingNumber: orders.trackingNumber
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(
      scopedOrderWhere(
        and(
          activeOrderCondition(),
          gte(orders.currentEstimatedDeliveryDate, sql`current_date`),
          lte(orders.currentEstimatedDeliveryDate, sql`current_date + interval '7 days'`)
        )!
      )
    )
    .orderBy(orders.currentEstimatedDeliveryDate, desc(orders.updatedAt))
    .limit(6);

  const failedEmails = await db
    .select({
      createdAt: emailOutbox.createdAt,
      emailType: emailOutbox.emailType,
      id: emailOutbox.id,
      lastErrorCode: emailOutbox.lastErrorCode,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      recipientEmail: emailOutbox.recipientEmail,
      status: emailOutbox.status
    })
    .from(emailOutbox)
    .innerJoin(orders, eq(emailOutbox.orderId, orders.id))
    .where(
      scopedWhere(
        profile,
        eq(emailOutbox.category, "TRANSACTIONAL"),
        inArray(emailOutbox.status, failedEmailStatuses)
      )
    )
    .orderBy(desc(emailOutbox.createdAt))
    .limit(6);

  const recentStatusChanges = await db
    .select({
      changeType: orderStatusHistory.changeType,
      createdAt: orderStatusHistory.createdAt,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      newStatus: orderStatusHistory.newStatus,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      previousStatus: orderStatusHistory.previousStatus
    })
    .from(orderStatusHistory)
    .innerJoin(orders, eq(orderStatusHistory.orderId, orders.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(scopedWhere(profile))
    .orderBy(desc(orderStatusHistory.createdAt))
    .limit(8);

  return {
    dueSoonOrders: dueSoonOrders.map((order) => ({
      ...order,
      customerName: formatCustomerName(order.customerFirstName, order.customerLastName),
      trackingNumberDisplay: formatTrackingNumber(order.trackingNumber)
    })),
    failedEmails,
    metrics: {
      activeOrders: toNumber(metricsResult?.activeOrders),
      deliveredInPeriod: toNumber(metricsResult?.deliveredInPeriod),
      dueSoon: toNumber(metricsResult?.dueSoon),
      failedMandatoryEmails: failedEmailResult?.value ?? 0,
      inProduction: toNumber(metricsResult?.inProduction),
      inTransit: toNumber(metricsResult?.inTransit),
      orderReceived: toNumber(metricsResult?.orderReceived),
      overdueActive: toNumber(metricsResult?.overdueActive)
    },
    overdueOrders: overdueOrders.map((order) => ({
      ...order,
      customerName: formatCustomerName(order.customerFirstName, order.customerLastName),
      trackingNumberDisplay: formatTrackingNumber(order.trackingNumber)
    })),
    period,
    dueSoonDateTo: dueSoonDateTo.toISOString().slice(0, 10),
    recentStatusChanges: recentStatusChanges.map((change) => ({
      ...change,
      customerName: formatCustomerName(change.customerFirstName, change.customerLastName)
    }))
  };
}
