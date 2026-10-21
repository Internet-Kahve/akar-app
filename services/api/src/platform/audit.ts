import { auditLog } from "../db/schema/index.ts";
import type { Tx } from "./idempotency.ts";

export type AuditEntry = {
  actorId: string;
  /** Dotted verb, e.g. `site.update`, `site.publish`, `memory.reject`, `staff.invite`. */
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  requestId?: string | undefined;
};

/** Appends one audit row inside the caller's transaction, so the change and its record commit together. */
export async function recordAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  await tx.insert(auditLog).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
    requestId: entry.requestId ?? null,
  });
}
