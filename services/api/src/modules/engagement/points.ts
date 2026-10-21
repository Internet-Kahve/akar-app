import { eq, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { pointEvents } from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";

/** Points per server-checked action; same values as the domain mock (`reduceSnapshot`). */
export const POINT_ACTIONS = {
  "story.complete": 15,
  "quiz.correct": 20,
  "visit.verified": 100,
  "memory.approved": 25,
} as const;
export type PointAction = keyof typeof POINT_ACTIONS;

/**
 * Appends one ledger event; a repeat of the same (user, action, subject) or an already redeemed
 * receipt is ignored. Returns whether points were awarded. Call inside the caller's transaction.
 */
export async function recordPointEvent(
  tx: Tx | Db,
  e: { userId: string; action: PointAction; subjectId: string; receiptId?: string | undefined },
): Promise<boolean> {
  const rows = await tx
    .insert(pointEvents)
    .values({ userId: e.userId, action: e.action, subjectId: e.subjectId, points: POINT_ACTIONS[e.action], receiptId: e.receiptId ?? null })
    .onConflictDoNothing()
    .returning({ id: pointEvents.id });
  return rows.length > 0;
}

/** Whether a guest receipt (`jti`) was already redeemed, by anyone: each receipt counts once. */
export async function receiptRedeemed(tx: Tx | Db, receiptId: string): Promise<boolean> {
  const [row] = await tx.select({ id: pointEvents.id }).from(pointEvents).where(eq(pointEvents.receiptId, receiptId)).limit(1);
  return row !== undefined;
}

/** Current score, always recomputed from the ledger. */
export async function pointsOf(db: Tx | Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` })
    .from(pointEvents)
    .where(eq(pointEvents.userId, userId));
  return row?.total ?? 0;
}
