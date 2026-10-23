import { and, eq, inArray, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db } from "../db/client.ts";
import { backgroundJobs } from "../db/schema/index.ts";
import type { Tx } from "./idempotency.ts";

export type JobHandler = (data: unknown) => Promise<void>;

/** Background jobs (e.g. GLB part extraction), persisted with the originating mutation. */
export interface JobQueue {
  send(name: string, data: object, tx?: Tx): Promise<void>;
  /** Registers the single handler for `name`. Call from a module plugin at startup. */
  work(name: string, handler: JobHandler): Promise<void>;
}

/** Test queue with `drain()`. */
export type InlineJobQueue = JobQueue & { drain(): Promise<void> };

/**
 * Test queue: `send` only records; `drain()` runs every recorded job (and jobs they enqueue)
 * after the request that enqueued them has committed. Unhandled job names throw on drain.
 */
export function inlineJobs(): InlineJobQueue {
  const handlers = new Map<string, JobHandler>();
  const pending: { name: string; data: object }[] = [];
  return {
    async send(name, data) {
      pending.push({ name, data });
    },
    async work(name, handler) {
      handlers.set(name, handler);
    },
    async drain() {
      while (pending.length) {
        const job = pending.shift()!;
        const handler = handlers.get(job.name);
        if (!handler) throw new Error(`No handler for job ${job.name}`);
        await handler(job.data);
      }
    },
  };
}

export type JobRunResult = { completed: number; failed: number };
export type DurableJobQueue = JobQueue & {
  drain(opts?: { limit?: number; budgetMs?: number }): Promise<JobRunResult>;
};

/** Ten minutes exceeds the Vercel function's five-minute maximum lifetime. */
export const JOB_LEASE_MS = 10 * 60_000;

/** No timers, background connections, or request-local work. Cron explicitly drains bounded batches. */
export function databaseJobs(db: Db, reportError: (err: unknown, name: string) => void = () => {}): DurableJobQueue {
  const handlers = new Map<string, JobHandler>();
  return {
    async send(name, data, tx) {
      await (tx ?? db).insert(backgroundJobs).values({ id: randomUUID(), name, data });
    },
    async work(name, handler) {
      handlers.set(name, handler);
    },
    async drain({ limit = 5, budgetMs = 120_000 } = {}) {
      const result = { completed: 0, failed: 0 };
      const deadline = Date.now() + budgetMs;
      if (!handlers.size) return result;
      for (let i = 0; i < limit && Date.now() < deadline; i++) {
        // Release the transaction before running a handler: a small pool cannot hold one connection
        // for every worker while each handler asks for another. SKIP LOCKED serializes claims only.
        const job = await db.transaction(async (tx) => {
          const [row] = await tx.select().from(backgroundJobs).where(and(
            inArray(backgroundJobs.name, [...handlers.keys()]),
            sql`${backgroundJobs.availableAt} <= now()`,
            or(sql`${backgroundJobs.leaseExpiresAt} is null`, sql`${backgroundJobs.leaseExpiresAt} <= now()`),
          )).orderBy(backgroundJobs.availableAt).limit(1).for("update", { skipLocked: true });
          if (!row) return undefined;
          const leaseToken = randomUUID();
          await tx.update(backgroundJobs).set({
            attempts: row.attempts + 1,
            leaseToken,
            leaseExpiresAt: new Date(Date.now() + JOB_LEASE_MS),
          }).where(eq(backgroundJobs.id, row.id));
          return { ...row, attempts: row.attempts + 1, leaseToken };
        });
        if (!job) break;
        const held = and(eq(backgroundJobs.id, job.id), eq(backgroundJobs.leaseToken, job.leaseToken));
        try {
          await handlers.get(job.name)!(job.data);
          await db.delete(backgroundJobs).where(held);
          result.completed++;
        } catch (err) {
          reportError(err, job.name);
          const delay = Math.min(3600, 30 * 2 ** Math.min(job.attempts - 1, 7));
          await db.update(backgroundJobs).set({
            leaseToken: null, leaseExpiresAt: null, availableAt: new Date(Date.now() + delay * 1000),
          }).where(held);
          result.failed++;
        }
      }
      return result;
    },
  };
}
