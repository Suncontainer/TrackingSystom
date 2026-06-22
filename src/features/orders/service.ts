import "server-only";

import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { routes } from "@/config/routes";
import { getDb } from "@/db/client";
import {
  auditLogs,
  customers,
  deliveryDateHistory,
  emailOutbox,
  internalNotes,
  orderStatusHistory,
  orders,
  orderStatusValues,
  profiles,
  type DbOrderStatus
} from "@/db/schema";
import type { Profile } from "@/db/schema/types";
import type { AppLocale } from "@/i18n/types";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { hasPermission } from "@/features/auth/permissions";
import { insertAuditEntry } from "@/features/audit/service";
import { formatCustomerName, normalizeCustomerEmail } from "@/features/customers/normalization";
import {
  canUseDemoAdminData,
  isMissingDatabaseConfiguration
} from "@/features/demo/admin-data";
import {
  addDemoInternalNote,
  changeDemoOrderStatus,
  createDemoOrder,
  getDemoCustomerDetail,
  getDemoOrderDetail,
  isDemoMode,
  listDemoAssignableSalespeople,
  searchDemoCustomersForReuse,
  setDemoOrderArchiveState,
  toDemoOrderList,
  updateDemoEstimatedDeliveryDate,
  updateDemoOrderDetails
} from "@/features/demo/store";
import { triggerImmediateEmailDispatch } from "@/features/email/outbox";
import { getAppSettings } from "@/features/settings/service";

import {
  type OrderListFilters
} from "./filters";
import {
  formatTrackingNumber,
  generateTrackingNumber,
  issueNextOrderNumber,
  validateManualOrderNumber
} from "./identifiers";
import { toPublicOrderSnapshot } from "./public-dto";
import {
  customerEmailDecisionValues,
  getDeliveredFields,
  getPermittedStandardNextStatus,
  getStatusEmailType,
  isOverrideStatusTransition,
  shouldQueueStatusCustomerEmail
} from "./workflow";

const assignedSalesperson = alias(profiles, "assigned_salesperson");

const customerModeSchema = z.enum(["new", "existing"]);
const orderNumberModeSchema = z.enum(["auto", "manual"]);
const localeSchema = z.enum(["de", "en"]);
const uuidLikeSchema = z.string().uuid();

const createOrderInputSchema = z
  .object({
    assignedSalespersonEmail: z.string().trim().optional(),
    assignedSalespersonId: z.string().trim().optional(),
    assignedSellerEmail: z.string().trim().optional(),
    customerEmail: z.string().trim().optional(),
    customerFirstName: z.string().trim().optional(),
    customerLastName: z.string().trim().optional(),
    customerMode: customerModeSchema,
    customerPhone: z.string().trim().optional(),
    existingCustomerId: z.string().trim().optional(),
    initialEstimatedDeliveryDate: z.string().trim(),
    initialEstimatedDeliveryDateEnd: z.string().trim(),
    initialInternalNote: z.string().trim().optional(),
    manualOrderNumber: z.string().trim().optional(),
    orderNumberMode: orderNumberModeSchema,
    preferredLanguage: localeSchema.optional(),
    productDescription: z.string().trim().optional()
  })
  .superRefine((input, ctx) => {
    if (input.customerMode === "existing") {
      if (!input.existingCustomerId) {
        ctx.addIssue({
          code: "custom",
          message: "Select an existing customer.",
          path: ["existingCustomerId"]
        });
      } else if (!uuidLikeSchema.safeParse(input.existingCustomerId).success) {
        ctx.addIssue({
          code: "custom",
          message: "Selected customer is invalid.",
          path: ["existingCustomerId"]
        });
      }
    }

    if (input.customerMode === "new") {
      if (!input.customerFirstName) {
        ctx.addIssue({
          code: "custom",
          message: "First name is required.",
          path: ["customerFirstName"]
        });
      }

      if (!input.customerLastName) {
        ctx.addIssue({
          code: "custom",
          message: "Last name is required.",
          path: ["customerLastName"]
        });
      }

      if (!input.customerEmail) {
        ctx.addIssue({
          code: "custom",
          message: "Email is required.",
          path: ["customerEmail"]
        });
      } else if (!z.email().safeParse(input.customerEmail).success) {
        ctx.addIssue({
          code: "custom",
          message: "Email is invalid.",
          path: ["customerEmail"]
        });
      }
    }

    if (!input.initialEstimatedDeliveryDate) {
      ctx.addIssue({
        code: "custom",
        message: "Earliest estimated delivery date is required.",
        path: ["initialEstimatedDeliveryDate"]
      });
    }

    if (!input.initialEstimatedDeliveryDateEnd) {
      ctx.addIssue({
        code: "custom",
        message: "Latest estimated delivery date is required.",
        path: ["initialEstimatedDeliveryDateEnd"]
      });
    }

    if (
      input.initialEstimatedDeliveryDate &&
      input.initialEstimatedDeliveryDateEnd &&
      input.initialEstimatedDeliveryDateEnd < input.initialEstimatedDeliveryDate
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Latest delivery date must be on or after the earliest date.",
        path: ["initialEstimatedDeliveryDateEnd"]
      });
    }

    if (!input.assignedSalespersonId && !input.assignedSellerEmail && !input.assignedSalespersonEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Select a seller or provide a fallback email.",
        path: ["assignedSalespersonEmail"]
      });
    }

    if (input.assignedSalespersonId && !uuidLikeSchema.safeParse(input.assignedSalespersonId).success) {
      ctx.addIssue({
        code: "custom",
        message: "Selected salesperson is invalid.",
        path: ["assignedSalespersonId"]
      });
    }

    if (input.orderNumberMode === "manual" && !input.manualOrderNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Manual order number is required.",
        path: ["manualOrderNumber"]
      });
    }
  });

const updateOrderInputSchema = z
  .object({
    assignedSalespersonEmail: z.string().trim().optional(),
    assignedSalespersonId: z.string().trim().optional(),
    assignedSellerEmail: z.string().trim().optional(),
    customerEmail: z.string().trim(),
    customerFirstName: z.string().trim().min(1),
    customerLastName: z.string().trim().min(1),
    customerPhone: z.string().trim().optional(),
    orderId: z.string().uuid(),
    preferredLanguage: localeSchema,
    productDescription: z.string().trim().optional(),
    version: z.coerce.number().int().positive()
  })
  .superRefine((input, ctx) => {
    if (!z.email().safeParse(input.customerEmail).success) {
      ctx.addIssue({
        code: "custom",
        message: "Email is invalid.",
        path: ["customerEmail"]
      });
    }

    if (!input.assignedSalespersonId && !input.assignedSellerEmail && !input.assignedSalespersonEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Select a seller or provide a fallback email.",
        path: ["assignedSalespersonEmail"]
      });
    }

    if (input.assignedSalespersonId && !uuidLikeSchema.safeParse(input.assignedSalespersonId).success) {
      ctx.addIssue({
        code: "custom",
        message: "Selected salesperson is invalid.",
        path: ["assignedSalespersonId"]
      });
    }
  });

const addInternalNoteInputSchema = z.object({
  body: z.string().trim().min(1, "Internal note is required."),
  orderId: z.string().uuid()
});

const statusChangeInputSchema = z
  .object({
    customerEmailDecision: z.enum(customerEmailDecisionValues).optional(),
    estimatedDeliveryDate: z.string().trim().min(1, "Earliest delivery date is required."),
    estimatedDeliveryDateEnd: z.string().trim().min(1, "Latest delivery date is required."),
    newStatus: z.enum(orderStatusValues),
    orderId: z.string().uuid(),
    reason: z.string().trim().optional(),
    version: z.coerce.number().int().positive()
  })
  .superRefine((input, ctx) => {
    if (
      input.estimatedDeliveryDate &&
      input.estimatedDeliveryDateEnd &&
      input.estimatedDeliveryDateEnd < input.estimatedDeliveryDate
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Latest delivery date must be on or after the earliest date.",
        path: ["estimatedDeliveryDateEnd"]
      });
    }
  });

const deliveryDateInputSchema = z
  .object({
    customerNotificationRequested: z.coerce.boolean().default(false),
    newDate: z.string().trim(),
    newDateEnd: z.string().trim(),
    orderId: z.string().uuid(),
    reason: z.string().trim().optional(),
    version: z.coerce.number().int().positive()
  })
  .superRefine((input, ctx) => {
    if (input.newDate && input.newDateEnd && input.newDateEnd < input.newDate) {
      ctx.addIssue({
        code: "custom",
        message: "Latest delivery date must be on or after the earliest date.",
        path: ["newDateEnd"]
      });
    }
  });

const archiveInputSchema = z.object({
  mode: z.enum(["archive", "restore"]),
  orderId: z.string().uuid(),
  reason: z.string().trim().min(1, "Reason is required."),
  version: z.coerce.number().int().positive()
});

function toFieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors;
}

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getOrderListPageSize() {
  return 12;
}

function getEmailWarningSql() {
  return sql<boolean>`exists (
    select 1
    from ${emailOutbox}
    where ${emailOutbox.orderId} = ${orders.id}
      and ${emailOutbox.status} in ('FAILED', 'BOUNCED', 'COMPLAINED', 'SUPPRESSED')
  )`;
}

function getOrderListWhere(filters: OrderListFilters, profile: Pick<Profile, "id" | "role">) {
  const conditions = [];

  if (profile.role === "SALES") {
    conditions.push(eq(orders.assignedSalespersonId, profile.id));
  }

  if (filters.archived === "active") {
    conditions.push(isNull(orders.archivedAt));
  } else if (filters.archived === "archived") {
    conditions.push(sql`${orders.archivedAt} is not null`);
  }

  if (filters.status) {
    conditions.push(eq(orders.status, filters.status));
  }

  if (filters.salespersonId && profile.role !== "SALES") {
    conditions.push(eq(orders.assignedSalespersonId, filters.salespersonId));
  }

  if (filters.dateFrom) {
    conditions.push(gte(orders.currentEstimatedDeliveryDate, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(orders.currentEstimatedDeliveryDate, filters.dateTo));
  }

  if (filters.overdue) {
    conditions.push(
      and(
        isNull(orders.archivedAt),
        sql`${orders.status} <> 'DELIVERED'`,
        sql`${orders.currentEstimatedDeliveryDateEnd} < current_date`
      )
    );
  }

  if (filters.query) {
    const term = filters.query;
    const emailTerm = normalizeCustomerEmail(term);
    const nameFragments = term
      .split(/\s+/)
      .map((fragment) => fragment.trim())
      .filter(Boolean);

    const nameConditions = nameFragments.map((fragment) =>
      or(
        ilike(customers.firstName, `${fragment}%`),
        ilike(customers.lastName, `${fragment}%`)
      )
    );

    conditions.push(
      or(
        ilike(orders.orderNumber, `${term}%`),
        ilike(orders.trackingNumber, `${term.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}%`),
        ilike(customers.emailNormalized, `${emailTerm}%`),
        ...nameConditions,
        ilike(orders.productDescription, `%${term}%`)
      )
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getOrderListOrderBy(sort: OrderListFilters["sort"]) {
  switch (sort) {
    case "created_desc":
      return [desc(orders.createdAt)];
    case "eta_asc":
      return [asc(orders.currentEstimatedDeliveryDate), desc(orders.updatedAt)];
    case "eta_desc":
      return [desc(orders.currentEstimatedDeliveryDate), desc(orders.updatedAt)];
    case "updated_desc":
    default:
      return [desc(orders.updatedAt)];
  }
}

function getSalespersonDisplayName(firstName: string | null, lastName: string | null, email: string | null) {
  if (firstName && lastName) {
    return formatCustomerName(firstName, lastName);
  }

  return email;
}

function normalizeSalespersonEmail(email: string | null | undefined) {
  const trimmed = email?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : "de";
}

function normalizePostgresErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }

  return null;
}

function mapDbError(error: unknown): never {
  if (normalizePostgresErrorCode(error) === "23505") {
    throw new ConflictError("A unique order identifier already exists.");
  }

  throw error;
}

function buildOrderReceivedSubject(locale: AppLocale) {
  return locale === "de" ? "Auftragsbestaetigung - Sun Container" : "Order confirmation - Sun Container";
}

function buildSalespersonSubject(orderNumber: string) {
  return `New tracked order - ${orderNumber}`;
}

function buildStatusSubject(status: DbOrderStatus, locale: AppLocale) {
  const label = locale === "de"
    ? {
        DELIVERED: "Geliefert",
        IN_PRODUCTION: "In Produktion",
        IN_TRANSIT: "Im Transport",
        PROCUREMENT: "Beschaffung läuft",
        ORDER_CONFIRMED: "Auftrag bestätigt"
      }[status]
    : {
        DELIVERED: "Delivered",
        IN_PRODUCTION: "In Production",
        IN_TRANSIT: "In Transit",
        PROCUREMENT: "Procurement in Progress",
        ORDER_CONFIRMED: "Order Confirmed"
      }[status];

  return locale === "de" ? `${label} - Sun Container` : `${label} - Sun Container`;
}

function buildDeliveryDateSubject(locale: AppLocale) {
  return locale === "de"
    ? "Aktualisierte Lieferzeit - Sun Container"
    : "Updated delivery date - Sun Container";
}

function getStatusTemplateKey(status: DbOrderStatus) {
  const templateKeys = {
    DELIVERED: "delivered",
    IN_PRODUCTION: "production-started",
    IN_TRANSIT: "in-transit",
    PROCUREMENT: "procurement-started",
    ORDER_CONFIRMED: "order-received"
  } satisfies Record<DbOrderStatus, string>;

  return templateKeys[status];
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function resolveAssignedSalesperson(profileId: string | null) {
  if (!profileId) {
    return null;
  }

  const db = getDb();
  const [salesperson] = await db
    .select({
      email: profiles.email,
      firstName: profiles.firstName,
      id: profiles.id,
      isActive: profiles.isActive,
      lastName: profiles.lastName,
      role: profiles.role
    })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!salesperson || !salesperson.isActive || salesperson.role === "READ_ONLY") {
    throw new ValidationError("Assigned salesperson is invalid.", {
      assignedSalespersonId: ["Select an active salesperson or admin user."]
    });
  }

  return salesperson;
}

function validateEstimatedDate(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new ValidationError("Estimated delivery date is invalid.", {
      initialEstimatedDeliveryDate: ["Use the YYYY-MM-DD format."]
    });
  }

  return input;
}

function validateDateForField(input: string, fieldName: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new ValidationError("Date is invalid.", {
      [fieldName]: ["Use the YYYY-MM-DD format."]
    });
  }

  return input;
}

function validateExistingCustomerSelection(input: string) {
  const result = uuidLikeSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError("Selected customer is invalid.", {
      existingCustomerId: ["Select a valid customer."]
    });
  }

  return result.data;
}

export async function listAssignableSalespeople() {
  if (isDemoMode()) {
    return listDemoAssignableSalespeople();
  }

  const db = getDb();

  return db
    .select({
      email: profiles.email,
      firstName: profiles.firstName,
      id: profiles.id,
      lastName: profiles.lastName,
      role: profiles.role
    })
    .from(profiles)
    .where(and(eq(profiles.isActive, true), inArray(profiles.role, ["SUPER_ADMIN", "ADMIN", "SALES"])))
    .orderBy(asc(profiles.firstName), asc(profiles.lastName));
}

export async function searchCustomersForReuse(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  if (isDemoMode()) {
    return searchDemoCustomersForReuse(normalizedQuery);
  }

  const db = getDb();
  const emailTerm = normalizeCustomerEmail(normalizedQuery);
  const fragments = normalizedQuery.split(/\s+/).filter(Boolean);
  const nameConditions = fragments.map((fragment) =>
    or(ilike(customers.firstName, `${fragment}%`), ilike(customers.lastName, `${fragment}%`))
  );

  return db
    .select({
      archivedAt: customers.archivedAt,
      email: customers.email,
      firstName: customers.firstName,
      id: customers.id,
      lastName: customers.lastName,
      preferredLanguage: customers.preferredLanguage,
      updatedAt: customers.updatedAt
    })
    .from(customers)
    .where(
      or(
        ilike(customers.emailNormalized, `${emailTerm}%`),
        ...nameConditions
      )
    )
    .orderBy(desc(customers.updatedAt))
    .limit(8);
}

export async function listOrders(filters: OrderListFilters, profile: Pick<Profile, "id" | "role">) {
  if (isDemoMode()) {
    return toDemoOrderList(filters);
  }

  let db: ReturnType<typeof getDb>;

  try {
    db = getDb();
  } catch (error) {
    if (isMissingDatabaseConfiguration(error) && canUseDemoAdminData()) {
      return toDemoOrderList(filters);
    }

    throw error;
  }
  const pageSize = getOrderListPageSize();
  const offset = (filters.page - 1) * pageSize;
  const where = getOrderListWhere(filters, profile);

  const [totalResult] = await db.select({ value: count() }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id)).where(where);

  const rows = await db
    .select({
      archivedAt: orders.archivedAt,
      assignedSalespersonEmail: orders.assignedSalespersonEmail,
      assignedSalespersonFirstName: assignedSalesperson.firstName,
      assignedSalespersonLastName: assignedSalesperson.lastName,
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      customerEmail: customers.email,
      customerFirstName: customers.firstName,
      customerId: customers.id,
      customerLastName: customers.lastName,
      hasEmailWarning: getEmailWarningSql(),
      id: orders.id,
      orderNumber: orders.orderNumber,
      productDescription: orders.productDescription,
      status: orders.status,
      trackingNumber: orders.trackingNumber,
      updatedAt: orders.updatedAt,
      version: orders.version
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(assignedSalesperson, eq(orders.assignedSalespersonId, assignedSalesperson.id))
    .where(where)
    .orderBy(...getOrderListOrderBy(filters.sort))
    .limit(pageSize)
    .offset(offset);

  return {
    filters,
    pageSize,
    rows: rows.map((row) => ({
      ...row,
      assignedSalespersonLabel: getSalespersonDisplayName(
        row.assignedSalespersonFirstName,
        row.assignedSalespersonLastName,
        row.assignedSalespersonEmail
      ),
      customerName: formatCustomerName(row.customerFirstName, row.customerLastName),
      trackingNumberDisplay: formatTrackingNumber(row.trackingNumber)
    })),
    total: totalResult?.value ?? 0,
    totalPages: Math.max(1, Math.ceil((totalResult?.value ?? 0) / pageSize))
  };
}

export async function getOrderDetail(orderId: string, profile: Pick<Profile, "id" | "role">) {
  if (isDemoMode()) {
    return getDemoOrderDetail(orderId, profile);
  }

  const db = getDb();
  const [order] = await db
    .select({
      actualDeliveryDate: orders.actualDeliveryDate,
      archivedAt: orders.archivedAt,
      assignedSalespersonEmail: orders.assignedSalespersonEmail,
      assignedSalespersonFirstName: assignedSalesperson.firstName,
      assignedSalespersonId: orders.assignedSalespersonId,
      assignedSalespersonLastName: assignedSalesperson.lastName,
      createdAt: orders.createdAt,
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      currentEstimatedDeliveryDateEnd: orders.currentEstimatedDeliveryDateEnd,
      customerArchivedAt: customers.archivedAt,
      customerEmail: customers.email,
      customerFirstName: customers.firstName,
      customerId: customers.id,
      customerLastName: customers.lastName,
      customerPhone: customers.phone,
      deliveredAt: orders.deliveredAt,
      id: orders.id,
      initialEstimatedDeliveryDate: orders.initialEstimatedDeliveryDate,
      initialEstimatedDeliveryDateEnd: orders.initialEstimatedDeliveryDateEnd,
      orderNumber: orders.orderNumber,
      preferredLanguage: customers.preferredLanguage,
      productDescription: orders.productDescription,
      status: orders.status,
      trackingLinkVersion: orders.trackingLinkVersion,
      trackingNumber: orders.trackingNumber,
      updatedAt: orders.updatedAt,
      version: orders.version
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(assignedSalesperson, eq(orders.assignedSalespersonId, assignedSalesperson.id))
    .where(
      and(
        eq(orders.id, orderId),
        profile.role === "SALES" ? eq(orders.assignedSalespersonId, profile.id) : undefined
      )
    )
    .limit(1);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  const [statusHistory, dateHistory, notes, emailHistory, auditHistory] = await Promise.all([
    db
      .select({
        changeType: orderStatusHistory.changeType,
        createdAt: orderStatusHistory.createdAt,
        estimatedDeliveryDateSnapshot: orderStatusHistory.estimatedDeliveryDateSnapshot,
        id: orderStatusHistory.id,
        newStatus: orderStatusHistory.newStatus,
        previousStatus: orderStatusHistory.previousStatus,
        reason: orderStatusHistory.reason
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt)),
    db
      .select({
        createdAt: deliveryDateHistory.createdAt,
        customerNotificationRequested: deliveryDateHistory.customerNotificationRequested,
        id: deliveryDateHistory.id,
        newDate: deliveryDateHistory.newDate,
        newDateEnd: deliveryDateHistory.newDateEnd,
        previousDate: deliveryDateHistory.previousDate,
        previousDateEnd: deliveryDateHistory.previousDateEnd,
        reason: deliveryDateHistory.reason
      })
      .from(deliveryDateHistory)
      .where(eq(deliveryDateHistory.orderId, orderId))
      .orderBy(desc(deliveryDateHistory.createdAt)),
    hasPermission(profile.role, "notes:read")
      ? db
          .select({
            body: internalNotes.body,
            createdAt: internalNotes.createdAt,
            createdBy: internalNotes.createdBy,
            id: internalNotes.id
          })
          .from(internalNotes)
          .where(and(eq(internalNotes.orderId, orderId), isNull(internalNotes.deletedAt)))
          .orderBy(desc(internalNotes.createdAt))
      : Promise.resolve([]),
    db
      .select({
        attemptCount: emailOutbox.attemptCount,
        category: emailOutbox.category,
        createdAt: emailOutbox.createdAt,
        failedAt: emailOutbox.failedAt,
        id: emailOutbox.id,
        recipientEmail: emailOutbox.recipientEmail,
        sentAt: emailOutbox.sentAt,
        status: emailOutbox.status,
        subject: emailOutbox.subject,
        type: emailOutbox.emailType
      })
      .from(emailOutbox)
      .where(eq(emailOutbox.orderId, orderId))
      .orderBy(desc(emailOutbox.createdAt)),
    hasPermission(profile.role, "audit:read-all")
      ? db
          .select({
            action: auditLogs.action,
            actorUserId: auditLogs.actorUserId,
            createdAt: auditLogs.createdAt,
            id: auditLogs.id,
            metadata: auditLogs.metadata
          })
          .from(auditLogs)
          .where(eq(auditLogs.orderId, orderId))
          .orderBy(desc(auditLogs.createdAt))
      : Promise.resolve([])
  ]);

  return {
    auditHistory,
    canArchive: hasPermission(profile.role, "orders:archive"),
    canCreateNotes: hasPermission(profile.role, "notes:create"),
    canOverrideStatus: hasPermission(profile.role, "orders:override-status"),
    canUpdateWorkflow: hasPermission(profile.role, "orders:update"),
    canEdit: hasPermission(profile.role, "orders:update"),
    customerPreview: toPublicOrderSnapshot({
      currentEstimatedDeliveryDate: order.currentEstimatedDeliveryDate,
      currentEstimatedDeliveryDateEnd: order.currentEstimatedDeliveryDateEnd,
      orderNumber: order.orderNumber,
      preferredLanguage: normalizeLocale(order.preferredLanguage),
      productDescription: order.productDescription,
      status: order.status,
      trackingNumber: order.trackingNumber
    }),
    customerName: formatCustomerName(order.customerFirstName, order.customerLastName),
    dateHistory,
    emailHistory,
    notes,
    order: {
      ...order,
      assignedSalespersonLabel: getSalespersonDisplayName(
        order.assignedSalespersonFirstName,
        order.assignedSalespersonLastName,
        order.assignedSalespersonEmail
      ),
      trackingNumberDisplay: formatTrackingNumber(order.trackingNumber)
    },
    statusHistory
  };
}

export async function getCustomerDetail(customerId: string, profile: Pick<Profile, "id" | "role">) {
  if (isDemoMode()) {
    return getDemoCustomerDetail(customerId);
  }

  const db = getDb();
  const customerScope =
    profile.role === "SALES"
      ? sql`exists (
          select 1
          from ${orders}
          where ${orders.customerId} = ${customers.id}
            and ${orders.assignedSalespersonId} = ${profile.id}
        )`
      : undefined;

  const [customer] = await db
    .select({
      archivedAt: customers.archivedAt,
      createdAt: customers.createdAt,
      email: customers.email,
      firstName: customers.firstName,
      id: customers.id,
      lastName: customers.lastName,
      phone: customers.phone,
      preferredLanguage: customers.preferredLanguage,
      updatedAt: customers.updatedAt
    })
    .from(customers)
    .where(and(eq(customers.id, customerId), customerScope))
    .limit(1);

  if (!customer) {
    throw new NotFoundError("Customer not found.");
  }

  const relatedOrders = await db
    .select({
      currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      trackingNumber: orders.trackingNumber,
      updatedAt: orders.updatedAt
    })
    .from(orders)
    .where(
      and(
        eq(orders.customerId, customer.id),
        profile.role === "SALES" ? eq(orders.assignedSalespersonId, profile.id) : undefined
      )
    )
    .orderBy(desc(orders.updatedAt));

  return {
    customer,
    customerName: formatCustomerName(customer.firstName, customer.lastName),
    orders: relatedOrders.map((order) => ({
      ...order,
      trackingNumberDisplay: formatTrackingNumber(order.trackingNumber)
    }))
  };
}

export async function createOrder(input: unknown, actor: Pick<Profile, "email" | "firstName" | "id" | "lastName" | "role">) {
  const parsed = createOrderInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Order data is invalid.", toFieldErrors(parsed.error));
  }

  const data = parsed.data;

  if (isDemoMode()) {
    const createdOrder = await createDemoOrder(data, actor);

    revalidatePath(routes.admin.orders);
    revalidatePath(routes.admin.home);
    revalidatePath(routes.admin.customerDetails(createdOrder.customerId));

    return createdOrder;
  }

  const db = getDb();
  const settings = await getAppSettings();
  const assignedSalespersonProfile = await resolveAssignedSalesperson(normalizeOptionalString(data.assignedSalespersonId));
  const fallbackSalesEmail =
    assignedSalespersonProfile?.email ??
    normalizeSalespersonEmail(data.assignedSellerEmail) ??
    normalizeSalespersonEmail(data.assignedSalespersonEmail);

  if (!fallbackSalesEmail) {
    throw new ValidationError("Salesperson notification email is required.", {
      assignedSalespersonEmail: ["Provide a salesperson email for the notification."]
    });
  }

  try {
    const createdOrder = await db.transaction(async (tx) => {
      const estimatedDate = validateEstimatedDate(data.initialEstimatedDeliveryDate);
      const estimatedDateEnd = validateDateForField(
        data.initialEstimatedDeliveryDateEnd,
        "initialEstimatedDeliveryDateEnd"
      );
      const customer =
        data.customerMode === "existing"
          ? await tx
              .select({
                email: customers.email,
                firstName: customers.firstName,
                id: customers.id,
                lastName: customers.lastName,
                preferredLanguage: customers.preferredLanguage
              })
              .from(customers)
              .where(eq(customers.id, validateExistingCustomerSelection(data.existingCustomerId ?? "")))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : null;

      if (data.customerMode === "existing" && !customer) {
        throw new ValidationError("Selected customer could not be loaded.", {
          existingCustomerId: ["Reload the page and choose an existing customer again."]
        });
      }

      let customerId = customer?.id ?? null;
      let customerEmail = customer?.email ?? data.customerEmail ?? "";
      let customerFirstName = customer?.firstName ?? data.customerFirstName ?? "";
      let customerLastName = customer?.lastName ?? data.customerLastName ?? "";
      let customerLocale: AppLocale = normalizeLocale(
        customer?.preferredLanguage ?? data.preferredLanguage ?? settings.defaultCustomerLanguage
      );

      if (!customerId) {
        const [createdCustomer] = await tx
          .insert(customers)
          .values({
            email: data.customerEmail ?? "",
            emailNormalized: normalizeCustomerEmail(data.customerEmail ?? ""),
            firstName: data.customerFirstName ?? "",
            lastName: data.customerLastName ?? "",
            phone: normalizeOptionalString(data.customerPhone),
            preferredLanguage: data.preferredLanguage ?? settings.defaultCustomerLanguage
          })
          .returning({
            email: customers.email,
            firstName: customers.firstName,
            id: customers.id,
            lastName: customers.lastName,
            preferredLanguage: customers.preferredLanguage
          });

        if (!createdCustomer) {
          throw new ConflictError("Customer could not be created.");
        }

        customerId = createdCustomer.id;
        customerEmail = createdCustomer.email;
        customerFirstName = createdCustomer.firstName;
        customerLastName = createdCustomer.lastName;
        customerLocale = normalizeLocale(createdCustomer.preferredLanguage);

        await insertAuditEntry(tx, {
          action: "customer.created",
          actorUserId: actor.id,
          afterData: {
            email: customerEmail,
            firstName: customerFirstName,
            lastName: customerLastName,
            preferredLanguage: customerLocale
          },
          entityId: customerId,
          entityType: "customer"
        });
      }

      const orderNumber =
        data.orderNumberMode === "manual"
          ? validateManualOrderNumber(data.manualOrderNumber ?? "")
          : await issueNextOrderNumber(tx, undefined, settings.orderNumberPrefix);

      let trackingNumber: string | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateTrackingNumber();

        const [trackingConflict] = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.trackingNumber, candidate))
          .limit(1);

        if (!trackingConflict) {
          trackingNumber = candidate;
          break;
        }
      }

      if (!trackingNumber) {
        throw new ConflictError("Tracking number generation failed.");
      }

      const [createdOrder] = await tx
        .insert(orders)
        .values({
          assignedSalespersonEmail: fallbackSalesEmail,
          assignedSalespersonId: assignedSalespersonProfile?.id ?? null,
          createdBy: actor.id,
          currentEstimatedDeliveryDate: estimatedDate,
          currentEstimatedDeliveryDateEnd: estimatedDateEnd,
          customerId,
          initialEstimatedDeliveryDate: estimatedDate,
          initialEstimatedDeliveryDateEnd: estimatedDateEnd,
          orderNumber,
          productDescription: normalizeOptionalString(data.productDescription),
          status: "ORDER_CONFIRMED",
          trackingNumber,
          updatedBy: actor.id
        })
        .returning({
          currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
          currentEstimatedDeliveryDateEnd: orders.currentEstimatedDeliveryDateEnd,
          id: orders.id,
          orderNumber: orders.orderNumber,
          productDescription: orders.productDescription,
          trackingNumber: orders.trackingNumber
        });

      if (!createdOrder) {
        throw new ConflictError("Order could not be created.");
      }

      const [statusRow] = await tx
        .insert(orderStatusHistory)
        .values({
          changeType: "CREATED",
          changedBy: actor.id,
          estimatedDeliveryDateSnapshot: estimatedDate,
          newStatus: "ORDER_CONFIRMED",
          orderId: createdOrder.id,
          previousStatus: null,
          reason: "Initial order creation."
        })
        .returning({ id: orderStatusHistory.id });

      if (normalizeOptionalString(data.initialInternalNote)) {
        await tx.insert(internalNotes).values({
          body: data.initialInternalNote ?? "",
          createdBy: actor.id,
          orderId: createdOrder.id
        });

        await insertAuditEntry(tx, {
          action: "internal-note.created",
          actorUserId: actor.id,
          afterData: {
            body: data.initialInternalNote ?? ""
          },
          entityType: "internal_note",
          orderId: createdOrder.id
        });
      }

      const customerName = formatCustomerName(customerFirstName, customerLastName);

      await tx.insert(emailOutbox).values([
        {
          category: "TRANSACTIONAL",
          customerId,
          emailType: "ORDER_RECEIVED",
          idempotencyKey: `order-created/customer/${createdOrder.id}`,
          locale: customerLocale,
          orderId: createdOrder.id,
          queuedBy: actor.id,
          recipientEmail: customerEmail,
          recipientName: customerName,
          subject: buildOrderReceivedSubject(customerLocale),
          templateKey: "order-received",
          templateVariables: {
            customerName,
            customerEmail,
            estimatedDeliveryDate: createdOrder.currentEstimatedDeliveryDate,
            estimatedDeliveryDateEnd: createdOrder.currentEstimatedDeliveryDateEnd,
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            trackingNumber: createdOrder.trackingNumber
          }
        },
        {
          category: "INTERNAL",
          customerId,
          emailType: "SALESPERSON_NEW_ORDER",
          idempotencyKey: `order-created/sales/${createdOrder.id}`,
          locale: "de",
          orderId: createdOrder.id,
          queuedBy: actor.id,
          recipientEmail: fallbackSalesEmail,
          recipientName: assignedSalespersonProfile
            ? formatCustomerName(assignedSalespersonProfile.firstName, assignedSalespersonProfile.lastName)
            : null,
          subject: buildSalespersonSubject(createdOrder.orderNumber),
          templateKey: "salesperson-new-order",
          templateVariables: {
            customerName,
            customerEmail,
            estimatedDeliveryDate: createdOrder.currentEstimatedDeliveryDate,
            estimatedDeliveryDateEnd: createdOrder.currentEstimatedDeliveryDateEnd,
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            productDescription: createdOrder.productDescription,
            trackingNumber: createdOrder.trackingNumber
          }
        }
      ]);

      await insertAuditEntry(tx, {
        action: "order.created",
        actorUserId: actor.id,
        afterData: {
          assignedSalespersonEmail: fallbackSalesEmail,
          assignedSalespersonId: assignedSalespersonProfile?.id ?? null,
          customerId,
          currentEstimatedDeliveryDate: createdOrder.currentEstimatedDeliveryDate,
          orderNumber: createdOrder.orderNumber,
          productDescription: createdOrder.productDescription,
          status: "ORDER_CONFIRMED",
          trackingNumber: createdOrder.trackingNumber
        },
        entityId: createdOrder.id,
        entityType: "order",
        orderId: createdOrder.id
      });

      await insertAuditEntry(tx, {
        action: "email.queued",
        actorUserId: actor.id,
        afterData: {
          idempotencyKey: `order-created/customer/${createdOrder.id}`,
          subject: buildOrderReceivedSubject(customerLocale),
          templateKey: "order-received"
        },
        entityType: "email_outbox",
        orderId: createdOrder.id
      });

      await insertAuditEntry(tx, {
        action: "email.queued",
        actorUserId: actor.id,
        afterData: {
          idempotencyKey: `order-created/sales/${createdOrder.id}`,
          subject: buildSalespersonSubject(createdOrder.orderNumber),
          templateKey: "salesperson-new-order"
        },
        entityType: "email_outbox",
        orderId: createdOrder.id
      });

      return {
        customerId,
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        statusHistoryId: statusRow?.id ?? null
      };
    });

    revalidatePath(routes.admin.orders);
    revalidatePath(routes.admin.home);
    revalidatePath(routes.admin.customerDetails(createdOrder.customerId));
    await triggerImmediateEmailDispatch();

    return createdOrder;
  } catch (error) {
    mapDbError(error);
  }
}

export async function updateOrderDetails(input: unknown, actor: Pick<Profile, "id" | "role">) {
  const parsed = updateOrderInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Order update is invalid.", toFieldErrors(parsed.error));
  }

  const data = parsed.data;

  if (isDemoMode()) {
    const result = await updateDemoOrderDetails(data);

    revalidatePath(routes.admin.orders);
    revalidatePath(routes.admin.orderDetails(data.orderId));
    revalidatePath(routes.admin.customerDetails(result.customerId));

    return result;
  }

  const db = getDb();
  const assignedSalespersonProfile = await resolveAssignedSalesperson(normalizeOptionalString(data.assignedSalespersonId));
  const fallbackSalesEmail =
    assignedSalespersonProfile?.email ??
    normalizeSalespersonEmail(data.assignedSellerEmail) ??
    normalizeSalespersonEmail(data.assignedSalespersonEmail);

  if (!fallbackSalesEmail) {
    throw new ValidationError("Salesperson notification email is required.", {
      assignedSalespersonEmail: ["Provide a salesperson email for the notification."]
    });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [existingOrder] = await tx
        .select({
          assignedSalespersonEmail: orders.assignedSalespersonEmail,
          assignedSalespersonId: orders.assignedSalespersonId,
          customerEmail: customers.email,
          customerFirstName: customers.firstName,
          customerId: customers.id,
          customerLastName: customers.lastName,
          customerPhone: customers.phone,
          preferredLanguage: customers.preferredLanguage,
          productDescription: orders.productDescription,
          version: orders.version
        })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.id, data.orderId))
        .limit(1);

      if (!existingOrder) {
        throw new NotFoundError("Order not found.");
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          assignedSalespersonEmail: fallbackSalesEmail,
          assignedSalespersonId: assignedSalespersonProfile?.id ?? null,
          productDescription: normalizeOptionalString(data.productDescription),
          updatedAt: new Date(),
          updatedBy: actor.id,
          version: existingOrder.version + 1
        })
        .where(and(eq(orders.id, data.orderId), eq(orders.version, data.version)))
        .returning({
          customerId: orders.customerId,
          id: orders.id,
          version: orders.version
        });

      if (!updatedOrder) {
        throw new ConflictError("This order was updated by someone else. Reload the page and try again.");
      }

      await tx
        .update(customers)
        .set({
          email: data.customerEmail,
          emailNormalized: normalizeCustomerEmail(data.customerEmail),
          firstName: data.customerFirstName,
          lastName: data.customerLastName,
          phone: normalizeOptionalString(data.customerPhone),
          preferredLanguage: data.preferredLanguage,
          updatedAt: new Date()
        })
        .where(eq(customers.id, updatedOrder.customerId));

      await insertAuditEntry(tx, {
        action: "customer.edited",
        actorUserId: actor.id,
        afterData: {
          email: data.customerEmail,
          firstName: data.customerFirstName,
          lastName: data.customerLastName,
          phone: normalizeOptionalString(data.customerPhone),
          preferredLanguage: data.preferredLanguage
        },
        beforeData: {
          email: existingOrder.customerEmail,
          firstName: existingOrder.customerFirstName,
          lastName: existingOrder.customerLastName,
          phone: existingOrder.customerPhone,
          preferredLanguage: existingOrder.preferredLanguage
        },
        entityId: updatedOrder.customerId,
        entityType: "customer",
        orderId: data.orderId
      });

      await insertAuditEntry(tx, {
        action: "order.edited",
        actorUserId: actor.id,
        afterData: {
          assignedSalespersonEmail: fallbackSalesEmail,
          assignedSalespersonId: assignedSalespersonProfile?.id ?? null,
          productDescription: normalizeOptionalString(data.productDescription),
          version: updatedOrder.version
        },
        beforeData: {
          assignedSalespersonEmail: existingOrder.assignedSalespersonEmail,
          assignedSalespersonId: existingOrder.assignedSalespersonId,
          productDescription: existingOrder.productDescription,
          version: existingOrder.version
        },
        entityId: data.orderId,
        entityType: "order",
        orderId: data.orderId
      });

      return updatedOrder;
    });

    revalidatePath(routes.admin.orders);
    revalidatePath(routes.admin.orderDetails(data.orderId));
    revalidatePath(routes.admin.customerDetails(result.customerId));

    return result;
  } catch (error) {
    mapDbError(error);
  }
}

export async function addInternalNote(input: unknown, actor: Pick<Profile, "id" | "role">) {
  const parsed = addInternalNoteInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Internal note is invalid.", toFieldErrors(parsed.error));
  }

  const data = parsed.data;

  if (isDemoMode()) {
    const note = await addDemoInternalNote(data, actor);

    revalidatePath(routes.admin.orderDetails(data.orderId));

    return note;
  }

  const db = getDb();

  const createdNote = await db.transaction(async (tx) => {
    const [note] = await tx
      .insert(internalNotes)
      .values({
        body: data.body,
        createdBy: actor.id,
        orderId: data.orderId
      })
      .returning({
        body: internalNotes.body,
        id: internalNotes.id,
        orderId: internalNotes.orderId
      });

    if (!note) {
      throw new ConflictError("Internal note could not be created.");
    }

    await insertAuditEntry(tx, {
      action: "internal-note.created",
      actorUserId: actor.id,
      afterData: {
        body: note.body
      },
      entityId: note.id,
      entityType: "internal_note",
      orderId: note.orderId
    });

    return note;
  });

  revalidatePath(routes.admin.orderDetails(data.orderId));

  return createdNote;
}

export async function changeOrderStatus(input: unknown, actor: Pick<Profile, "id" | "role">) {
  const parsed = statusChangeInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Status change is invalid.", toFieldErrors(parsed.error));
  }

  const data = parsed.data;

  if (isDemoMode()) {
    const result = await changeDemoOrderStatus(data, actor);

    revalidatePath(routes.admin.orders);
    revalidatePath(routes.admin.orderDetails(data.orderId));
    revalidatePath(routes.admin.customerDetails(result.customerId));

    return result;
  }

  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [existingOrder] = await tx
      .select({
        archivedAt: orders.archivedAt,
        currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
        currentEstimatedDeliveryDateEnd: orders.currentEstimatedDeliveryDateEnd,
        customerEmail: customers.email,
        customerFirstName: customers.firstName,
        customerId: customers.id,
        customerLastName: customers.lastName,
        orderNumber: orders.orderNumber,
        preferredLanguage: customers.preferredLanguage,
        status: orders.status,
        trackingNumber: orders.trackingNumber,
        version: orders.version
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, data.orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundError("Order not found.");
    }

    if (existingOrder.archivedAt) {
      throw new ValidationError("Archived orders cannot change status.", {
        orderId: ["Restore the order before changing status."]
      });
    }

    // The status dropdown now lists every status; keeping the current one is allowed
    // and simply applies an estimated-delivery-date update without a status transition.
    const statusChanged = existingOrder.status !== data.newStatus;
    const isOverride = statusChanged && isOverrideStatusTransition(existingOrder.status, data.newStatus);
    const standardNextStatus = getPermittedStandardNextStatus(existingOrder.status);

    if (statusChanged && isOverride && !hasPermission(actor.role, "orders:override-status")) {
      throw new ValidationError("Only super admins may override status transitions.", {
        newStatus: ["Choose the next standard status."]
      });
    }

    if (statusChanged && !isOverride && standardNextStatus !== data.newStatus) {
      throw new ValidationError("Only the next standard status is allowed.", {
        newStatus: ["Choose the next status in sequence."]
      });
    }

    if (statusChanged && isOverride && !normalizeOptionalString(data.reason)) {
      throw new ValidationError("Override reason is required.", {
        reason: ["Explain why this status override is necessary."]
      });
    }

    if (statusChanged && isOverride && !data.customerEmailDecision) {
      throw new ValidationError("Customer email decision is required for overrides.", {
        customerEmailDecision: ["Choose whether to queue a customer email."]
      });
    }

    const newDate = validateDateForField(data.estimatedDeliveryDate, "estimatedDeliveryDate");
    const newDateEnd = validateDateForField(data.estimatedDeliveryDateEnd, "estimatedDeliveryDateEnd");
    const deliveryDateChanged =
      existingOrder.currentEstimatedDeliveryDate !== newDate ||
      existingOrder.currentEstimatedDeliveryDateEnd !== newDateEnd;

    if (!statusChanged && !deliveryDateChanged) {
      throw new ValidationError("Nothing to update.", {
        newStatus: ["Change the status or the estimated delivery dates."]
      });
    }

    const deliveredFields = getDeliveredFields(
      data.newStatus,
      data.newStatus === "DELIVERED" ? getTodayDateString() : null
    );

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        currentEstimatedDeliveryDate: newDate,
        currentEstimatedDeliveryDateEnd: newDateEnd,
        updatedAt: new Date(),
        updatedBy: actor.id,
        version: existingOrder.version + 1,
        ...(statusChanged
          ? {
              actualDeliveryDate: deliveredFields.actualDeliveryDate,
              deliveredAt: deliveredFields.deliveredAt,
              status: data.newStatus
            }
          : {})
      })
      .where(and(eq(orders.id, data.orderId), eq(orders.version, data.version)))
      .returning({
        customerId: orders.customerId,
        id: orders.id,
        status: orders.status,
        version: orders.version
      });

    if (!updatedOrder) {
      throw new ConflictError("This order was updated by someone else. Reload the page and try again.");
    }

    if (statusChanged) {
      const [historyEntry] = await tx
        .insert(orderStatusHistory)
        .values({
          changeType: isOverride ? "OVERRIDE" : "STANDARD",
          changedBy: actor.id,
          estimatedDeliveryDateSnapshot: newDate,
          isOverride,
          newStatus: data.newStatus,
          orderId: data.orderId,
          previousStatus: existingOrder.status,
          reason: normalizeOptionalString(data.reason)
        })
        .returning({ id: orderStatusHistory.id });

      if (!historyEntry) {
        throw new ConflictError("Status history could not be recorded.");
      }

      const customerLocale = normalizeLocale(existingOrder.preferredLanguage);
      const queueCustomerEmail = shouldQueueStatusCustomerEmail({
        currentStatus: existingOrder.status,
        decision: data.customerEmailDecision ?? null,
        nextStatus: data.newStatus
      });

      if (queueCustomerEmail) {
        await tx.insert(emailOutbox).values({
          category: "TRANSACTIONAL",
          customerId: existingOrder.customerId,
          emailType: getStatusEmailType(data.newStatus),
          idempotencyKey: `status/${historyEntry.id}/customer`,
          locale: customerLocale,
          orderId: data.orderId,
          queuedBy: actor.id,
          recipientEmail: existingOrder.customerEmail,
          recipientName: formatCustomerName(existingOrder.customerFirstName, existingOrder.customerLastName),
          subject: buildStatusSubject(data.newStatus, customerLocale),
          templateKey: getStatusTemplateKey(data.newStatus),
          templateVariables: {
            currentEstimatedDeliveryDate: newDate,
            newStatus: data.newStatus,
            orderId: data.orderId,
            orderNumber: existingOrder.orderNumber,
            trackingNumber: existingOrder.trackingNumber
          }
        });
      }
    }

    // The estimated-delivery range is edited inline on the status form, so record a
    // delivery-date history entry whenever it actually changes.
    if (deliveryDateChanged) {
      await tx.insert(deliveryDateHistory).values({
        changedBy: actor.id,
        customerNotificationRequested: false,
        newDate,
        newDateEnd,
        orderId: data.orderId,
        previousDate: existingOrder.currentEstimatedDeliveryDate,
        previousDateEnd: existingOrder.currentEstimatedDeliveryDateEnd,
        reason: normalizeOptionalString(data.reason)
      });
    }

    await insertAuditEntry(tx, {
      action: statusChanged ? (isOverride ? "status.override" : "status.changed") : "delivery-date.changed",
      actorUserId: actor.id,
      afterData: {
        currentEstimatedDeliveryDate: newDate,
        currentEstimatedDeliveryDateEnd: newDateEnd,
        status: data.newStatus,
        version: updatedOrder.version
      },
      beforeData: {
        currentEstimatedDeliveryDate: existingOrder.currentEstimatedDeliveryDate,
        currentEstimatedDeliveryDateEnd: existingOrder.currentEstimatedDeliveryDateEnd,
        status: existingOrder.status,
        version: existingOrder.version
      },
      entityId: data.orderId,
      entityType: "order",
      orderId: data.orderId
    });

    return updatedOrder;
  });

  revalidatePath(routes.admin.orders);
  revalidatePath(routes.admin.orderDetails(data.orderId));
  revalidatePath(routes.admin.customerDetails(result.customerId));
  await triggerImmediateEmailDispatch();

  return result;
}

export async function updateEstimatedDeliveryDate(input: unknown, actor: Pick<Profile, "id" | "role">) {
  const parsed = deliveryDateInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Delivery date update is invalid.", toFieldErrors(parsed.error));
  }

  const data = parsed.data;
  const newDate = validateDateForField(data.newDate, "newDate");
  const newDateEnd = validateDateForField(data.newDateEnd, "newDateEnd");

  if (isDemoMode()) {
    const result = await updateDemoEstimatedDeliveryDate({
      customerNotificationRequested: data.customerNotificationRequested,
      newDate,
      newDateEnd,
      orderId: data.orderId,
      reason: data.reason
    });

    revalidatePath(routes.admin.orders);
    revalidatePath(routes.admin.orderDetails(data.orderId));
    revalidatePath(routes.admin.customerDetails(result.customerId));

    return result;
  }

  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [existingOrder] = await tx
      .select({
        archivedAt: orders.archivedAt,
        currentEstimatedDeliveryDate: orders.currentEstimatedDeliveryDate,
        currentEstimatedDeliveryDateEnd: orders.currentEstimatedDeliveryDateEnd,
        customerEmail: customers.email,
        customerFirstName: customers.firstName,
        customerId: customers.id,
        customerLastName: customers.lastName,
        orderNumber: orders.orderNumber,
        preferredLanguage: customers.preferredLanguage,
        trackingNumber: orders.trackingNumber,
        version: orders.version
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.id, data.orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundError("Order not found.");
    }

    if (existingOrder.archivedAt) {
      throw new ValidationError("Archived orders cannot change delivery date.", {
        orderId: ["Restore the order before changing delivery date."]
      });
    }

    if (
      existingOrder.currentEstimatedDeliveryDate === newDate &&
      existingOrder.currentEstimatedDeliveryDateEnd === newDateEnd
    ) {
      throw new ValidationError("Delivery date is unchanged.", {
        newDate: ["Choose a different delivery date."]
      });
    }

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        currentEstimatedDeliveryDate: newDate,
        currentEstimatedDeliveryDateEnd: newDateEnd,
        updatedAt: new Date(),
        updatedBy: actor.id,
        version: existingOrder.version + 1
      })
      .where(and(eq(orders.id, data.orderId), eq(orders.version, data.version)))
      .returning({
        customerId: orders.customerId,
        id: orders.id,
        version: orders.version
      });

    if (!updatedOrder) {
      throw new ConflictError("This order was updated by someone else. Reload the page and try again.");
    }

    const [historyEntry] = await tx
      .insert(deliveryDateHistory)
      .values({
        changedBy: actor.id,
        customerNotificationRequested: data.customerNotificationRequested,
        newDate,
        newDateEnd,
        orderId: data.orderId,
        previousDate: existingOrder.currentEstimatedDeliveryDate,
        previousDateEnd: existingOrder.currentEstimatedDeliveryDateEnd,
        reason: normalizeOptionalString(data.reason)
      })
      .returning({ id: deliveryDateHistory.id });

    if (!historyEntry) {
      throw new ConflictError("Delivery date history could not be recorded.");
    }

    if (data.customerNotificationRequested) {
      const customerLocale = normalizeLocale(existingOrder.preferredLanguage);

      await tx.insert(emailOutbox).values({
        category: "OPTIONAL_SERVICE",
        customerId: existingOrder.customerId,
        emailType: "DELIVERY_DATE_UPDATED",
        idempotencyKey: `delivery-date/${historyEntry.id}/customer`,
        locale: customerLocale,
        orderId: data.orderId,
        queuedBy: actor.id,
        recipientEmail: existingOrder.customerEmail,
        recipientName: formatCustomerName(existingOrder.customerFirstName, existingOrder.customerLastName),
        subject: buildDeliveryDateSubject(customerLocale),
        templateKey: "delivery-date-updated",
        templateVariables: {
          newDate,
          newDateEnd,
          orderId: data.orderId,
          orderNumber: existingOrder.orderNumber,
          previousDate: existingOrder.currentEstimatedDeliveryDate,
          previousDateEnd: existingOrder.currentEstimatedDeliveryDateEnd,
          trackingNumber: existingOrder.trackingNumber
        }
      });
    }

    await insertAuditEntry(tx, {
      action: "delivery-date.changed",
      actorUserId: actor.id,
      afterData: {
        currentEstimatedDeliveryDate: newDate,
        currentEstimatedDeliveryDateEnd: newDateEnd,
        customerNotificationRequested: data.customerNotificationRequested,
        version: updatedOrder.version
      },
      beforeData: {
        currentEstimatedDeliveryDate: existingOrder.currentEstimatedDeliveryDate,
        currentEstimatedDeliveryDateEnd: existingOrder.currentEstimatedDeliveryDateEnd,
        version: existingOrder.version
      },
      entityId: data.orderId,
      entityType: "order",
      orderId: data.orderId
    });

    return updatedOrder;
  });

  revalidatePath(routes.admin.orders);
  revalidatePath(routes.admin.orderDetails(data.orderId));
  revalidatePath(routes.admin.customerDetails(result.customerId));
  await triggerImmediateEmailDispatch();

  return result;
}

export async function setOrderArchiveState(input: unknown, actor: Pick<Profile, "id" | "role">) {
  const parsed = archiveInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ValidationError("Archive request is invalid.", toFieldErrors(parsed.error));
  }

  const data = parsed.data;

  if (isDemoMode()) {
    const result = await setDemoOrderArchiveState(data);

    revalidatePath(routes.admin.orders);
    revalidatePath(routes.admin.orderDetails(data.orderId));
    revalidatePath(routes.admin.customerDetails(result.customerId));

    return result;
  }

  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [existingOrder] = await tx
      .select({
        archivedAt: orders.archivedAt,
        customerId: orders.customerId,
        trackingLinkVersion: orders.trackingLinkVersion,
        version: orders.version
      })
      .from(orders)
      .where(eq(orders.id, data.orderId))
      .limit(1);

    if (!existingOrder) {
      throw new NotFoundError("Order not found.");
    }

    if (data.mode === "archive" && existingOrder.archivedAt) {
      throw new ValidationError("Order is already archived.", {
        mode: ["Choose restore instead."]
      });
    }

    if (data.mode === "restore" && !existingOrder.archivedAt) {
      throw new ValidationError("Order is not archived.", {
        mode: ["Choose archive instead."]
      });
    }

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        archivedAt: data.mode === "archive" ? new Date() : null,
        trackingLinkVersion: existingOrder.trackingLinkVersion + 1,
        updatedAt: new Date(),
        updatedBy: actor.id,
        version: existingOrder.version + 1
      })
      .where(and(eq(orders.id, data.orderId), eq(orders.version, data.version)))
      .returning({
        archivedAt: orders.archivedAt,
        customerId: orders.customerId,
        id: orders.id,
        trackingLinkVersion: orders.trackingLinkVersion,
        version: orders.version
      });

    if (!updatedOrder) {
      throw new ConflictError("This order was updated by someone else. Reload the page and try again.");
    }

    await insertAuditEntry(tx, {
      action: data.mode === "archive" ? "order.archived" : "order.restored",
      actorUserId: actor.id,
      afterData: {
        archivedAt: updatedOrder.archivedAt?.toISOString() ?? null,
        trackingLinkVersion: updatedOrder.trackingLinkVersion,
        version: updatedOrder.version
      },
      beforeData: {
        archivedAt: existingOrder.archivedAt?.toISOString() ?? null,
        trackingLinkVersion: existingOrder.trackingLinkVersion,
        version: existingOrder.version
      },
      entityId: data.orderId,
      entityType: "order",
      metadata: {
        reason: data.reason
      },
      orderId: data.orderId
    });

    return updatedOrder;
  });

  revalidatePath(routes.admin.orders);
  revalidatePath(routes.admin.orderDetails(data.orderId));
  revalidatePath(routes.admin.customerDetails(result.customerId));

  return result;
}
