import { and, eq, lt, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { media, memories, mediaKinds } from "../../db/schema/index.ts";
import type { AdminHealthResponse, StorageLevel } from "./schemas.ts";

/** A `pending` memory older than this is flagged in the panel (decision log §11.21). */
export const PENDING_STALE_HOURS = 48;
/** Storage fill levels, percent of the quota (§11.21). */
export const STORAGE_WARN_PERCENT = 80;
export const STORAGE_CRITICAL_PERCENT = 95;

const HOUR_MS = 3_600_000;
const MB = 1024 * 1024;

export async function pendingStale(db: Db, now: Date): Promise<AdminHealthResponse["pendingStale"]> {
  const cutoff = new Date(now.getTime() - PENDING_STALE_HOURS * HOUR_MS);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int`, oldest: sql<Date | null>`min(${memories.createdAt})` })
    .from(memories)
    .where(and(eq(memories.status, "pending"), lt(memories.createdAt, cutoff)));
  return {
    count: row?.count ?? 0,
    oldestCreatedAt: row?.oldest ? new Date(row.oldest).toISOString() : null,
    thresholdHours: PENDING_STALE_HOURS,
  };
}

export function storageLevel(percent: number): StorageLevel {
  if (percent >= STORAGE_CRITICAL_PERCENT) return "critical";
  if (percent >= STORAGE_WARN_PERCENT) return "warn";
  return "ok";
}

export async function storageHealth(db: Db, quotaMb: number): Promise<NonNullable<AdminHealthResponse["storage"]>> {
  const rows = await db
    .select({ kind: media.kind, bytes: sql<number>`coalesce(sum(${media.bytes}), 0)::float8` })
    .from(media)
    .groupBy(media.kind);
  const byKind = Object.fromEntries(mediaKinds.map((k) => [k, 0])) as Record<(typeof mediaKinds)[number], number>;
  for (const r of rows) byKind[r.kind] = r.bytes;
  const usedBytes = Object.values(byKind).reduce((a, b) => a + b, 0);
  const quotaBytes = quotaMb * MB;
  const percent = (usedBytes / quotaBytes) * 100;
  return { usedBytes, quotaBytes, percent: Math.round(percent * 10) / 10, level: storageLevel(percent), byKind };
}
