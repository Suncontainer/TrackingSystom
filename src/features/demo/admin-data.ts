import type { DbOrderStatus, EmailStatus, EmailType } from "@/db/schema";
import type { OrderListFilters } from "@/features/orders/filters";
import { formatTrackingNumber } from "@/features/orders/identifiers";

type DemoOrder = {
  assignedSalespersonEmail: string | null;
  assignedSalespersonFirstName: string | null;
  assignedSalespersonId: string | null;
  assignedSalespersonLastName: string | null;
  currentEstimatedDeliveryDate: string;
  customerEmail: string;
  customerFirstName: string;
  customerId: string;
  customerLastName: string;
  id: string;
  orderNumber: string;
  productDescription: string;
  status: DbOrderStatus;
  trackingNumber: string;
  updatedAt: Date;
  version: number;
};

const today = new Date();

function dateOnly(offsetDays: number) {
  const date = new Date(today);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export const demoOrders: DemoOrder[] = [
  {
    assignedSalespersonEmail: "sales@suncontainer.local",
    assignedSalespersonFirstName: "Sam",
    assignedSalespersonId: "90000000-0000-4000-8000-000000000002",
    assignedSalespersonLastName: "Sales",
    currentEstimatedDeliveryDate: dateOnly(21),
    customerEmail: "max.mustermann@example.com",
    customerFirstName: "Max",
    customerId: "10000000-0000-4000-8000-000000000001",
    customerLastName: "Mustermann",
    id: "20000000-0000-4000-8000-000000000001",
    orderNumber: "SC-2026-000001",
    productDescription: "20-Fuss Lagercontainer",
    status: "ORDER_RECEIVED",
    trackingNumber: "SC7K9M4XPQ82DH",
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 3),
    version: 1
  },
  {
    assignedSalespersonEmail: "sales@suncontainer.local",
    assignedSalespersonFirstName: "Sam",
    assignedSalespersonId: "90000000-0000-4000-8000-000000000002",
    assignedSalespersonLastName: "Sales",
    currentEstimatedDeliveryDate: dateOnly(6),
    customerEmail: "erika.beispiel@example.com",
    customerFirstName: "Erika",
    customerId: "10000000-0000-4000-8000-000000000002",
    customerLastName: "Beispiel",
    id: "20000000-0000-4000-8000-000000000002",
    orderNumber: "SC-2026-000002",
    productDescription: "Buerocontainer mit Isolierung",
    status: "IN_PRODUCTION",
    trackingNumber: "SCK7MA4XPQ82DK",
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 8),
    version: 2
  },
  {
    assignedSalespersonEmail: "sales@suncontainer.local",
    assignedSalespersonFirstName: "Sam",
    assignedSalespersonId: "90000000-0000-4000-8000-000000000002",
    assignedSalespersonLastName: "Sales",
    currentEstimatedDeliveryDate: dateOnly(-2),
    customerEmail: "john.example@example.com",
    customerFirstName: "John",
    customerId: "10000000-0000-4000-8000-000000000003",
    customerLastName: "Example",
    id: "20000000-0000-4000-8000-000000000003",
    orderNumber: "SC-2026-000003",
    productDescription: "Sanitaercontainer",
    status: "IN_TRANSIT",
    trackingNumber: "SC8H3M4XPQ72DL",
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24),
    version: 3
  },
  {
    assignedSalespersonEmail: "sales@suncontainer.local",
    assignedSalespersonFirstName: "Sam",
    assignedSalespersonId: "90000000-0000-4000-8000-000000000002",
    assignedSalespersonLastName: "Sales",
    currentEstimatedDeliveryDate: dateOnly(-14),
    customerEmail: "olivia.optional@example.com",
    customerFirstName: "Olivia",
    customerId: "10000000-0000-4000-8000-000000000004",
    customerLastName: "Optional",
    id: "20000000-0000-4000-8000-000000000004",
    orderNumber: "SC-2026-000004",
    productDescription: "Modulcontainer Kombination",
    status: "DELIVERED",
    trackingNumber: "SC9H3M5XPQ72DM",
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 48),
    version: 1
  }
];

export const demoFailedEmails: Array<{
  createdAt: Date;
  emailType: EmailType;
  id: string;
  lastErrorCode: string;
  orderId: string;
  orderNumber: string;
  recipientEmail: string;
  status: EmailStatus;
}> = [
  {
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 5),
    emailType: "IN_TRANSIT",
    id: "30000000-0000-4000-8000-000000000001",
    lastErrorCode: "demo_bounce",
    orderId: "20000000-0000-4000-8000-000000000003",
    orderNumber: "SC-2026-000003",
    recipientEmail: "john.example@example.com",
    status: "BOUNCED"
  }
];

export function isMissingDatabaseConfiguration(error: unknown) {
  return error instanceof Error && error.message.includes("DATABASE_URL");
}

export function canUseDemoAdminData() {
  return true;
}

export function toDemoOrderList(filters: OrderListFilters) {
  const rows = demoOrders
    .filter((order) => {
      if (filters.status && order.status !== filters.status) {
        return false;
      }

      if (filters.overdue && !(order.status !== "DELIVERED" && order.currentEstimatedDeliveryDate < dateOnly(0))) {
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
          order.productDescription
        ].some((value) => value.toLowerCase().includes(query));
      }

      return true;
    })
    .map((order) => ({
      ...order,
      archivedAt: null,
      assignedSalespersonLabel: `${order.assignedSalespersonFirstName} ${order.assignedSalespersonLastName}`,
      customerName: `${order.customerFirstName} ${order.customerLastName}`,
      hasEmailWarning: demoFailedEmails.some((email) => email.orderId === order.id),
      trackingNumberDisplay: formatTrackingNumber(order.trackingNumber)
    }));

  return {
    filters,
    pageSize: 12,
    rows,
    total: rows.length,
    totalPages: 1
  };
}
