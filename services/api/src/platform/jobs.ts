import { PgBoss } from "pg-boss";

export type JobHandler = (data: unknown) => Promise<void>;

/** Background jobs (e.g. GLB part extraction). Production: pg-boss on the app database. */
export interface JobQueue {
  send(name: string, data: object): Promise<void>;
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

/** pg-boss on the given database (its own `pgboss` schema). Stop it on shutdown. */
export async function pgBossJobs(url: string): Promise<JobQueue & { stop(): Promise<void> }> {
  const boss = new PgBoss(url);
  boss.on("error", (err) => console.error("pg-boss", err));
  await boss.start();
  const created = new Set<string>();
  const ensure = async (name: string) => {
    if (created.has(name)) return;
    await boss.createQueue(name);
    created.add(name);
  };
  return {
    async send(name, data) {
      await ensure(name);
      await boss.send(name, data);
    },
    async work(name, handler) {
      await ensure(name);
      await boss.work(name, async (jobs) => {
        for (const job of jobs) await handler(job.data);
      });
    },
    stop: () => boss.stop(),
  };
}
