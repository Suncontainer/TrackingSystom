import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  auditLogs,
  customerCommunicationPreferences,
  customers,
  deliveryDateHistory,
  emailDeliveryEvents,
  emailOutbox,
  emailSuppressions,
  internalNotes,
  orderNumberCounters,
  orders,
  orderStatusHistory,
  profiles,
  trackingLookupAttempts
} from "./tables";

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
export type OrderStatusHistory = InferSelectModel<typeof orderStatusHistory>;
export type NewOrderStatusHistory = InferInsertModel<typeof orderStatusHistory>;
export type DeliveryDateHistory = InferSelectModel<typeof deliveryDateHistory>;
export type NewDeliveryDateHistory = InferInsertModel<typeof deliveryDateHistory>;
export type InternalNote = InferSelectModel<typeof internalNotes>;
export type NewInternalNote = InferInsertModel<typeof internalNotes>;
export type EmailOutbox = InferSelectModel<typeof emailOutbox>;
export type NewEmailOutbox = InferInsertModel<typeof emailOutbox>;
export type EmailDeliveryEvent = InferSelectModel<typeof emailDeliveryEvents>;
export type NewEmailDeliveryEvent = InferInsertModel<typeof emailDeliveryEvents>;
export type CustomerCommunicationPreference = InferSelectModel<typeof customerCommunicationPreferences>;
export type NewCustomerCommunicationPreference = InferInsertModel<typeof customerCommunicationPreferences>;
export type EmailSuppression = InferSelectModel<typeof emailSuppressions>;
export type NewEmailSuppression = InferInsertModel<typeof emailSuppressions>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
export type TrackingLookupAttempt = InferSelectModel<typeof trackingLookupAttempts>;
export type NewTrackingLookupAttempt = InferInsertModel<typeof trackingLookupAttempts>;
export type OrderNumberCounter = InferSelectModel<typeof orderNumberCounters>;
export type NewOrderNumberCounter = InferInsertModel<typeof orderNumberCounters>;
