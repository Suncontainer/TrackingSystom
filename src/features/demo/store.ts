import "server-only";

import { randomUUID } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";
import { cookies } from "next/headers";

import type { DbOrderStatus, EmailCategory, EmailStatus, EmailType } from "@/db/schema";
import type { Profile } from "@/db/schema/types";
import type { AppLocale } from "@/i18n/types";
import { formatCustomerName, normalizeCustomerEmail } from "@/features/customers/normalization";
import type { OrderListFilters } from "@/features/orders/filters";
import { formatOrderNumber, formatTrackingNumber, generateTrackingNumber, validateManualOrderNumber } from "@/features/orders/identifiers";
import { toPublicOrderSnapshot } from "@/features/orders/public-dto";
import { getDeliveredFields, getPermittedStandardNextStatus, isOverrideStatusTransition } from "@/features/orders/workflow";
import type { OptionalEmailType } from "@/features/email/optional-rules";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

import { canUseDemoAdminData, demoFailedEmails, demoOrders } from "./admin-data";

const demoStoreCookie = "suncontainer_demo_store";
const demoSalesperson = {
  email: "sales@suncontainer.local",
  firstName: "Sam",
  id: "90000000-0000-4000-8000-000000000002",
  lastName: "Sales",
  role: "SALES"
} as const;

type DemoEmail = {
  attemptCount: number;
  category: EmailCategory;
  createdAt: string;
  emailType: EmailType;
  failedAt: string | null;
  id: string;
  lastErrorCode: string | null;
  providerMessageId: string | null;
  recipientEmail: string;
  sentAt: string | null;
  status: EmailStatus;
  subject: string;
};

type DemoOrderRecord = {
  actualDeliveryDate: string | null;
  archivedAt: string | null;
  assignedSalespersonEmail: string | null;
  assignedSalespersonFirstName: string | null;
  assignedSalespersonId: string | null;
  assignedSalespersonLastName: string | null;
  createdAt: string;
  currentEstimatedDeliveryDate: string;
  customerEmail: string;
  customerFirstName: string;
  customerId: string;
  customerLastName: string;
  customerPhone: string | null;
  dateHistory: Array<{
    createdAt: string;
    customerNotificationRequested: boolean;
    id: string;
    newDate: string;
    previousDate: string;
    reason: string | null;
  }>;
  deliveredAt: string | null;
  emailHistory: DemoEmail[];
  id: string;
  initialEstimatedDeliveryDate: string;
  notes: Array<{
    body: string;
    createdAt: string;
    createdBy: string;
    id: string;
  }>;
  orderNumber: string;
  preferredLanguage: AppLocale;
  productDescription: string | null;
  status: DbOrderStatus;
  statusHistory: Array<{
    changeType: string;
    createdAt: string;
    estimatedDeliveryDateSnapshot: string;
    id: string;
    newStatus: DbOrderStatus;
    previousStatus: DbOrderStatus | null;
    reason: string | null;
  }>;
  trackingLinkVersion: number;
  trackingNumber: string;
  updatedAt: string;
  version: number;
};

type DemoStore = {
  orders: DemoOrderRecord[];
};

function todayDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function isDemoMode() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  return canUseDemoAdminData() && (
    process.env.DEMO_MODE === "true" ||
    !databaseUrl ||
    databaseUrl === "dummy" ||
    databaseUrl.includes("example.com")
  );
}

function makeEmail(input: {
  category: EmailCategory;
  emailType: EmailType;
  recipientEmail: string;
  status?: EmailStatus;
  subject: string;
}) {
  const now = new Date().toISOString();

  return {
    attemptCount: 1,
    category: input.category,
    createdAt: now,
    emailType: input.emailType,
    failedAt: null,
    id: randomUUID(),
    lastErrorCode: null,
    providerMessageId: `demo:${randomUUID()}`,
    recipientEmail: input.recipientEmail,
    sentAt: now,
    status: input.status ?? "SIMULATED",
    subject: input.subject
  } satisfies DemoEmail;
}

function buildInitialStore(): DemoStore {
  return {
    orders: demoOrders.map((order, index) => {
      const createdAt = new Date(order.updatedAt.getTime() - 1000 * 60 * 60 * 2).toISOString();
      const updatedAt = order.updatedAt.toISOString();

      return {
        actualDeliveryDate: order.status === "DELIVERED" ? order.currentEstimatedDeliveryDate : null,
        archivedAt: null,
        assignedSalespersonEmail: order.assignedSalespersonEmail,
        assignedSalespersonFirstName: order.assignedSalespersonFirstName,
        assignedSalespersonId: order.assignedSalespersonId,
        assignedSalespersonLastName: order.assignedSalespersonLastName,
        createdAt,
        currentEstimatedDeliveryDate: order.currentEstimatedDeliveryDate,
        customerEmail: order.customerEmail,
        customerFirstName: order.customerFirstName,
        customerId: order.customerId,
        customerLastName: order.customerLastName,
        customerPhone: index === 0 ? "+49 30 123456" : null,
        dateHistory: [],
        deliveredAt: order.status === "DELIVERED" ? updatedAt : null,
        emailHistory: [
          makeEmail({
            category: "TRANSACTIONAL",
            emailType: "ORDER_RECEIVED",
            recipientEmail: order.customerEmail,
            subject: "Auftragsbestaetigung - Sun Container"
          })
        ],
        id: order.id,
        initialEstimatedDeliveryDate: order.currentEstimatedDeliveryDate,
        notes: [],
        orderNumber: order.orderNumber,
        preferredLanguage: "de",
        productDescription: order.productDescription,
        status: order.status,
        statusHistory: [
          {
            changeType: "DEMO",
            createdAt,
            estimatedDeliveryDateSnapshot: order.currentEstimatedDeliveryDate,
            id: randomUUID(),
            newStatus: order.status,
            previousStatus: null,
            reason: "Demo journey seeded."
          }
        ],
        trackingLinkVersion: 1,
        trackingNumber: order.trackingNumber,
        updatedAt,
        version: order.version
      };
    })
  };
}

function encodeStore(store: DemoStore) {
  return deflateSync(JSON.stringify(store)).toString("base64url");
}

function decodeStore(value: string | undefined) {
  if (!value) {
    return buildInitialStore();
  }

  try {
    return JSON.parse(inflateSync(Buffer.from(value, "base64url")).toString("utf8")) as DemoStore;
  } catch {
    return buildInitialStore();
  }
}

export async function readDemoStore() {
  const cookieStore = await cookies();

  return decodeStore(cookieStore.get(demoStoreCookie)?.value);
}

export async function writeDemoStore(store: DemoStore) {
  const cookieStore = await cookies();
  const limitedStore = {
    orders: store.orders
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 10)
  };

  cookieStore.set(demoStoreCookie, encodeStore(limitedStore), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

function toListRow(order: DemoOrderRecord) {
  return {
    ...order,
    assignedSalespersonLabel: order.assignedSalespersonFirstName && order.assignedSalespersonLastName
      ? formatCustomerName(order.assignedSalespersonFirstName, order.assignedSalespersonLastName)
      : order.assignedSalespersonEmail,
    customerName: formatCustomerName(order.customerFirstName, order.customerLastName),
    hasEmailWarning: order.emailHistory.some((email) => ["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED"].includes(email.status)),
    trackingNumberDisplay: formatTrackingNumber(order.trackingNumber)
  };
}

export async function listDemoAssignableSalespeople() {
  return [demoSalesperson];
}

export async function searchDemoCustomersForReuse(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  const store = await readDemoStore();
  const uniqueCustomers = new Map<string, DemoOrderRecord>();

  for (const order of store.orders) {
    uniqueCustomers.set(order.customerId, order);
  }

  return [...uniqueCustomers.values()]
    .filter((order) => [
      order.customerEmail,
      order.customerFirstName,
      order.customerLastName
    ].some((value) => value.toLowerCase().includes(normalized)))
    .map((order) => ({
      archivedAt: null,
      email: order.customerEmail,
      firstName: order.customerFirstName,
      id: order.customerId,
      lastName: order.customerLastName,
      preferredLanguage: order.preferredLanguage,
      updatedAt: new Date(order.updatedAt)
    }));
}

export async function toDemoOrderList(filters: OrderListFilters) {
  const store = await readDemoStore();
  const today = todayDate();
  const rows = store.orders
    .filter((order) => {
      if (filters.status && order.status !== filters.status) {
        return false;
      }

      if (filters.overdue && !(order.status !== "DELIVERED" && order.currentEstimatedDeliveryDate < today)) {
        return false;
      }

      if (filters.query) {
        const query = filters.query.toLowerCase();
        return [
          order.orderNumber,
          order.trackingNumber,
          order.customerEmail,
          order.customerFirstName,
          order.customerLastName,
          order.productDescription ?? ""
        ].some((value) => value.toLowerCase().includes(query));
      }

      return filters.archived === "all" || (filters.archived === "archived" ? order.archivedAt : !order.archivedAt);
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .map(toListRow);

  return {
    filters,
    pageSize: 12,
    rows,
    total: rows.length,
    totalPages: 1
  };
}

export async function getDemoDashboardData(period: string) {
  const store = await readDemoStore();
  const dueSoonDateTo = todayDate(7);
  const today = todayDate();
  const activeOrders = store.orders.filter((order) => !order.archivedAt && order.status !== "DELIVERED");
  const dueSoonOrders = activeOrders.filter((order) => order.currentEstimatedDeliveryDate >= today && order.currentEstimatedDeliveryDate <= dueSoonDateTo);
  const overdueOrders = activeOrders.filter((order) => order.currentEstimatedDeliveryDate < today);
  const failedEmails = store.orders.flatMap((order) =>
    order.emailHistory
      .filter((email) => email.category === "TRANSACTIONAL" && ["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED"].includes(email.status))
      .map((email) => ({
        createdAt: new Date(email.createdAt),
        emailType: email.emailType,
        id: email.id,
        lastErrorCode: email.lastErrorCode ?? "demo_warning",
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipientEmail: email.recipientEmail,
        status: email.status
      }))
  );

  if (failedEmails.length === 0) {
    failedEmails.push(...demoFailedEmails);
  }

  return {
    dueSoonDateTo,
    dueSoonOrders: dueSoonOrders.map(toListRow),
    failedEmails,
    metrics: {
      activeOrders: activeOrders.length,
      deliveredInPeriod: store.orders.filter((order) => order.status === "DELIVERED").length,
      dueSoon: dueSoonOrders.length,
      failedMandatoryEmails: failedEmails.length,
      inProduction: activeOrders.filter((order) => order.status === "IN_PRODUCTION").length,
      inTransit: activeOrders.filter((order) => order.status === "IN_TRANSIT").length,
      orderReceived: activeOrders.filter((order) => order.status === "ORDER_RECEIVED").length,
      overdueActive: overdueOrders.length
    },
    overdueOrders: overdueOrders.map(toListRow),
    period,
    recentStatusChanges: store.orders.flatMap((order) => order.statusHistory.map((change) => ({
      changeType: change.changeType,
      createdAt: new Date(change.createdAt),
      customerFirstName: order.customerFirstName,
      customerLastName: order.customerLastName,
      customerName: formatCustomerName(order.customerFirstName, order.customerLastName),
      newStatus: change.newStatus,
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus: change.previousStatus
    }))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8)
  };
}

export async function getDemoOrderDetail(orderId: string, profile: Pick<Profile, "role">) {
  const store = await readDemoStore();
  const order = store.orders.find((candidate) => candidate.id === orderId);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  return {
    auditHistory: order.statusHistory.map((entry) => ({
      action: entry.changeType,
      actorUserId: null,
      createdAt: new Date(entry.createdAt),
      id: entry.id,
      metadata: null
    })),
    canArchive: true,
    canCreateNotes: true,
    canEdit: true,
    canOverrideStatus: profile.role === "SUPER_ADMIN",
    canUpdateWorkflow: true,
    customerName: formatCustomerName(order.customerFirstName, order.customerLastName),
    customerPreview: toPublicOrderSnapshot({
      currentEstimatedDeliveryDate: order.currentEstimatedDeliveryDate,
      orderNumber: order.orderNumber,
      preferredLanguage: order.preferredLanguage,
      productDescription: order.productDescription,
      status: order.status,
      trackingNumber: order.trackingNumber
    }),
    dateHistory: order.dateHistory.map((entry) => ({ ...entry, createdAt: new Date(entry.createdAt) })),
    emailHistory: order.emailHistory.map((entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      failedAt: entry.failedAt ? new Date(entry.failedAt) : null,
      sentAt: entry.sentAt ? new Date(entry.sentAt) : null,
      type: entry.emailType
    })),
    notes: order.notes.map((note) => ({ ...note, createdAt: new Date(note.createdAt) })),
    order: {
      ...order,
      archivedAt: order.archivedAt ? new Date(order.archivedAt) : null,
      assignedSalespersonLabel: order.assignedSalespersonFirstName && order.assignedSalespersonLastName
        ? formatCustomerName(order.assignedSalespersonFirstName, order.assignedSalespersonLastName)
        : order.assignedSalespersonEmail,
      createdAt: new Date(order.createdAt),
      customerArchivedAt: null,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
      updatedAt: new Date(order.updatedAt),
      trackingNumberDisplay: formatTrackingNumber(order.trackingNumber)
    },
    statusHistory: order.statusHistory.map((entry) => ({ ...entry, createdAt: new Date(entry.createdAt) }))
  };
}

export async function getDemoCustomerDetail(customerId: string) {
  const store = await readDemoStore();
  const customerOrder = store.orders.find((order) => order.customerId === customerId);

  if (!customerOrder) {
    throw new NotFoundError("Customer not found.");
  }

  return {
    customer: {
      archivedAt: null,
      createdAt: new Date(customerOrder.createdAt),
      email: customerOrder.customerEmail,
      firstName: customerOrder.customerFirstName,
      id: customerOrder.customerId,
      lastName: customerOrder.customerLastName,
      phone: customerOrder.customerPhone,
      preferredLanguage: customerOrder.preferredLanguage,
      updatedAt: new Date(customerOrder.updatedAt)
    },
    customerName: formatCustomerName(customerOrder.customerFirstName, customerOrder.customerLastName),
    orders: store.orders
      .filter((order) => order.customerId === customerId)
      .map((order) => ({
        currentEstimatedDeliveryDate: order.currentEstimatedDeliveryDate,
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        trackingNumberDisplay: formatTrackingNumber(order.trackingNumber),
        updatedAt: new Date(order.updatedAt)
      }))
  };
}

export async function createDemoOrder(data: {
  assignedSalespersonEmail?: string | undefined;
  assignedSalespersonId?: string | undefined;
  customerEmail?: string | undefined;
  customerFirstName?: string | undefined;
  customerLastName?: string | undefined;
  customerMode: "new" | "existing";
  customerPhone?: string | undefined;
  existingCustomerId?: string | undefined;
  initialEstimatedDeliveryDate: string;
  initialInternalNote?: string | undefined;
  manualOrderNumber?: string | undefined;
  orderNumberMode: "auto" | "manual";
  preferredLanguage?: AppLocale | undefined;
  productDescription?: string | undefined;
}, actor: Pick<Profile, "id">) {
  const store = await readDemoStore();
  const existingCustomer = data.customerMode === "existing"
    ? store.orders.find((order) => order.customerId === data.existingCustomerId)
    : null;
  const sequence = store.orders.length + 1;
  const customerId = existingCustomer?.customerId ?? randomUUID();
  const customerEmail = existingCustomer?.customerEmail ?? data.customerEmail ?? "";
  const customerFirstName = existingCustomer?.customerFirstName ?? data.customerFirstName ?? "";
  const customerLastName = existingCustomer?.customerLastName ?? data.customerLastName ?? "";
  const orderNumber = data.orderNumberMode === "manual"
    ? validateManualOrderNumber(data.manualOrderNumber ?? "")
    : formatOrderNumber(new Date().getUTCFullYear(), sequence + 4);
  const now = new Date().toISOString();
  const id = randomUUID();
  const order: DemoOrderRecord = {
    actualDeliveryDate: null,
    archivedAt: null,
    assignedSalespersonEmail: data.assignedSalespersonEmail || demoSalesperson.email,
    assignedSalespersonFirstName: demoSalesperson.firstName,
    assignedSalespersonId: data.assignedSalespersonId || demoSalesperson.id,
    assignedSalespersonLastName: demoSalesperson.lastName,
    createdAt: now,
    currentEstimatedDeliveryDate: data.initialEstimatedDeliveryDate,
    customerEmail,
    customerFirstName,
    customerId,
    customerLastName,
    customerPhone: data.customerPhone || null,
    dateHistory: [],
    deliveredAt: null,
    emailHistory: [
      makeEmail({
        category: "TRANSACTIONAL",
        emailType: "ORDER_RECEIVED",
        recipientEmail: customerEmail,
        subject: "Auftragsbestaetigung - Sun Container"
      }),
      makeEmail({
        category: "INTERNAL",
        emailType: "SALESPERSON_NEW_ORDER",
        recipientEmail: data.assignedSalespersonEmail || demoSalesperson.email,
        subject: `New tracked order - ${orderNumber}`
      })
    ],
    id,
    initialEstimatedDeliveryDate: data.initialEstimatedDeliveryDate,
    notes: data.initialInternalNote ? [{
      body: data.initialInternalNote,
      createdAt: now,
      createdBy: actor.id,
      id: randomUUID()
    }] : [],
    orderNumber,
    preferredLanguage: data.preferredLanguage ?? "de",
    productDescription: data.productDescription || null,
    status: "ORDER_RECEIVED",
    statusHistory: [{
      changeType: "CREATED",
      createdAt: now,
      estimatedDeliveryDateSnapshot: data.initialEstimatedDeliveryDate,
      id: randomUUID(),
      newStatus: "ORDER_RECEIVED",
      previousStatus: null,
      reason: "Demo order created."
    }],
    trackingLinkVersion: 1,
    trackingNumber: generateTrackingNumber(),
    updatedAt: now,
    version: 1
  };

  store.orders.unshift(order);
  await writeDemoStore(store);

  return {
    customerId,
    id,
    orderNumber,
    statusHistoryId: order.statusHistory[0]?.id ?? null
  };
}

function findDemoOrder(store: DemoStore, orderId: string) {
  const order = store.orders.find((candidate) => candidate.id === orderId);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  return order;
}

export async function updateDemoOrderDetails(data: {
  assignedSalespersonEmail?: string | undefined;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string | undefined;
  orderId: string;
  preferredLanguage: AppLocale;
  productDescription?: string | undefined;
}) {
  const store = await readDemoStore();
  const order = findDemoOrder(store, data.orderId);

  order.assignedSalespersonEmail = data.assignedSalespersonEmail || demoSalesperson.email;
  order.customerEmail = data.customerEmail;
  order.customerFirstName = data.customerFirstName;
  order.customerLastName = data.customerLastName;
  order.customerPhone = data.customerPhone || null;
  order.preferredLanguage = data.preferredLanguage;
  order.productDescription = data.productDescription || null;
  order.updatedAt = new Date().toISOString();
  order.version += 1;
  await writeDemoStore(store);

  return { customerId: order.customerId, id: order.id, version: order.version };
}

export async function addDemoInternalNote(data: { body: string; orderId: string }, actor: Pick<Profile, "id">) {
  const store = await readDemoStore();
  const order = findDemoOrder(store, data.orderId);
  const note = {
    body: data.body,
    createdAt: new Date().toISOString(),
    createdBy: actor.id,
    id: randomUUID()
  };

  order.notes.unshift(note);
  order.updatedAt = note.createdAt;
  await writeDemoStore(store);

  return { ...note, orderId: order.id };
}

export async function changeDemoOrderStatus(data: {
  actualDeliveryDate?: string | undefined;
  customerEmailDecision?: "send" | "skip" | undefined;
  newStatus: DbOrderStatus;
  orderId: string;
  reason?: string | undefined;
}, actor: Pick<Profile, "role">) {
  const store = await readDemoStore();
  const order = findDemoOrder(store, data.orderId);
  const isOverride = isOverrideStatusTransition(order.status, data.newStatus);
  const nextStatus = getPermittedStandardNextStatus(order.status);

  if (order.archivedAt) {
    throw new ValidationError("Archived orders cannot change status.", { orderId: ["Restore the order first."] });
  }

  if (isOverride && actor.role !== "SUPER_ADMIN") {
    throw new ValidationError("Only super admins may override status transitions.", { newStatus: ["Choose the next standard status."] });
  }

  if (!isOverride && nextStatus !== data.newStatus) {
    throw new ValidationError("Only the next standard status is allowed.", { newStatus: ["Choose the next status in sequence."] });
  }

  const now = new Date().toISOString();
  const previousStatus = order.status;
  const deliveredFields = getDeliveredFields(data.newStatus, data.actualDeliveryDate || todayDate());
  order.status = data.newStatus;
  order.actualDeliveryDate = deliveredFields.actualDeliveryDate;
  order.deliveredAt = deliveredFields.deliveredAt?.toISOString() ?? null;
  order.updatedAt = now;
  order.version += 1;
  order.statusHistory.unshift({
    changeType: isOverride ? "OVERRIDE" : "STANDARD",
    createdAt: now,
    estimatedDeliveryDateSnapshot: order.currentEstimatedDeliveryDate,
    id: randomUUID(),
    newStatus: data.newStatus,
    previousStatus,
    reason: data.reason || null
  });
  order.emailHistory.unshift(makeEmail({
    category: "TRANSACTIONAL",
    emailType: data.newStatus === "IN_PRODUCTION" ? "PRODUCTION_STARTED" : data.newStatus,
    recipientEmail: order.customerEmail,
    subject: `${data.newStatus} - Sun Container`
  }));
  await writeDemoStore(store);

  return { customerId: order.customerId, id: order.id, status: order.status, version: order.version };
}

export async function updateDemoEstimatedDeliveryDate(data: {
  customerNotificationRequested: boolean;
  newDate: string;
  orderId: string;
  reason?: string | undefined;
}) {
  const store = await readDemoStore();
  const order = findDemoOrder(store, data.orderId);
  const now = new Date().toISOString();
  const previousDate = order.currentEstimatedDeliveryDate;

  order.currentEstimatedDeliveryDate = data.newDate;
  order.updatedAt = now;
  order.version += 1;
  order.dateHistory.unshift({
    createdAt: now,
    customerNotificationRequested: data.customerNotificationRequested,
    id: randomUUID(),
    newDate: data.newDate,
    previousDate,
    reason: data.reason || null
  });

  if (data.customerNotificationRequested) {
    order.emailHistory.unshift(makeEmail({
      category: "OPTIONAL_SERVICE",
      emailType: "DELIVERY_DATE_UPDATED",
      recipientEmail: order.customerEmail,
      subject: "Aktualisierte Lieferzeit - Sun Container"
    }));
  }

  await writeDemoStore(store);

  return { customerId: order.customerId, id: order.id, version: order.version };
}

export async function setDemoOrderArchiveState(data: { mode: "archive" | "restore"; orderId: string }) {
  const store = await readDemoStore();
  const order = findDemoOrder(store, data.orderId);
  const now = new Date().toISOString();

  order.archivedAt = data.mode === "archive" ? now : null;
  order.trackingLinkVersion += 1;
  order.updatedAt = now;
  order.version += 1;
  await writeDemoStore(store);

  return {
    archivedAt: order.archivedAt ? new Date(order.archivedAt) : null,
    customerId: order.customerId,
    id: order.id,
    trackingLinkVersion: order.trackingLinkVersion,
    version: order.version
  };
}

export async function findDemoPublicOrder(identifier: string, email: string) {
  const store = await readDemoStore();
  const normalizedIdentifier = identifier.replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
  const normalizedTracking = identifier.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const normalizedEmail = normalizeCustomerEmail(email);

  return store.orders.find((order) =>
    !order.archivedAt &&
    normalizeCustomerEmail(order.customerEmail) === normalizedEmail &&
    (order.orderNumber === normalizedIdentifier || order.trackingNumber === normalizedTracking)
  ) ?? null;
}

export async function findDemoPublicOrderById(orderId: string) {
  const store = await readDemoStore();

  return store.orders.find((order) => order.id === orderId && !order.archivedAt) ?? null;
}

export async function listDemoEmailHistory() {
  const store = await readDemoStore();

  return store.orders
    .flatMap((order) => order.emailHistory.map((email) => ({
      ...email,
      bouncedAt: email.status === "BOUNCED" ? new Date(email.failedAt ?? email.createdAt) : null,
      complainedAt: email.status === "COMPLAINED" ? new Date(email.failedAt ?? email.createdAt) : null,
      createdAt: new Date(email.createdAt),
      deliveredAt: email.status === "DELIVERED" ? new Date(email.sentAt ?? email.createdAt) : null,
      failedAt: email.failedAt ? new Date(email.failedAt) : null,
      lastErrorMessage: email.lastErrorCode,
      orderId: order.id,
      sentAt: email.sentAt ? new Date(email.sentAt) : null
    })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 100);
}

export async function getDemoOptionalEmailState(customerId: string) {
  const store = await readDemoStore();
  const customerOrders = store.orders.filter((order) => order.customerId === customerId);
  const lastDeliveredOrder = customerOrders.find((order) => order.status === "DELIVERED");
  const optionalTypes: OptionalEmailType[] = [
    "REVIEW_REQUEST",
    "SATISFACTION_SURVEY",
    "MAINTENANCE_RECOMMENDATION",
    "WARRANTY_REMINDER",
    "PROMOTIONAL"
  ];
  const sentCounts = Object.fromEntries(optionalTypes.map((type) => [type, 0])) as Record<OptionalEmailType, number>;

  for (const order of customerOrders) {
    for (const email of order.emailHistory) {
      if (optionalTypes.includes(email.emailType as OptionalEmailType)) {
        sentCounts[email.emailType as OptionalEmailType] += 1;
      }
    }
  }

  return {
    lastDeliveredOrderId: lastDeliveredOrder?.id ?? customerOrders[0]?.id ?? null,
    preferences: {
      maintenanceRecommendationAllowed: true,
      promotionalEmailAllowed: false,
      reviewRequestAllowed: true,
      satisfactionSurveyAllowed: true,
      warrantyReminderAllowed: true
    },
    sentCounts,
    suppressed: false
  };
}

export async function queueDemoOptionalEmail(customerId: string, emailType: Exclude<OptionalEmailType, "PROMOTIONAL">) {
  const store = await readDemoStore();
  const order = store.orders.find((candidate) => candidate.customerId === customerId && candidate.status === "DELIVERED")
    ?? store.orders.find((candidate) => candidate.customerId === customerId);

  if (!order) {
    throw new NotFoundError("Customer not found.");
  }

  order.emailHistory.unshift(makeEmail({
    category: "OPTIONAL_SERVICE",
    emailType,
    recipientEmail: order.customerEmail,
    subject: `${emailType} - Sun Container`
  }));
  order.updatedAt = new Date().toISOString();
  await writeDemoStore(store);

  return { customerId, emailId: order.emailHistory[0]?.id ?? null };
}

export function toDemoPublicRow(order: DemoOrderRecord) {
  return {
    currentEstimatedDeliveryDate: order.currentEstimatedDeliveryDate,
    customerFirstName: order.customerFirstName,
    id: order.id,
    lastUpdatedAt: new Date(order.updatedAt),
    orderNumber: order.orderNumber,
    preferredLanguage: order.preferredLanguage,
    productDescription: order.productDescription,
    status: order.status,
    trackingLinkVersion: order.trackingLinkVersion,
    trackingNumber: order.trackingNumber
  };
}
