import { getDb } from "@/db/client";
import { auditLogs, type JsonRecord } from "@/db/schema";

type DatabaseLike = Pick<ReturnType<typeof getDb>, "insert">;

type AuditEntry = {
  action: string;
  actorUserId?: string | null;
  afterData?: JsonRecord | null;
  beforeData?: JsonRecord | null;
  entityId?: string | null;
  entityType: string;
  metadata?: JsonRecord | null;
  orderId?: string | null;
  requestId?: string | null;
};

function cleanAuditJson(data: JsonRecord | null | undefined) {
  if (!data) {
    return null;
  }

  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

export async function insertAuditEntry(tx: DatabaseLike, entry: AuditEntry) {
  await tx.insert(auditLogs).values({
    action: entry.action,
    actorUserId: entry.actorUserId ?? null,
    afterData: cleanAuditJson(entry.afterData),
    beforeData: cleanAuditJson(entry.beforeData),
    entityId: entry.entityId ?? null,
    entityType: entry.entityType,
    metadata: cleanAuditJson(entry.metadata),
    orderId: entry.orderId ?? null,
    requestId: entry.requestId ?? null
  });
}
