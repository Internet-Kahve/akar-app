import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { backgroundJobs } from "../db/schema/index.ts";
import { startTestApp } from "../test/harness.ts";
import { databaseJobs } from "./jobs.ts";
import { maintenanceRoutes } from "./maintenance.ts";

let ctx: Awaited<ReturnType<typeof startTestApp>>;
let invoked = 0;
const secret = "cron-test-secret-0123456789abcdef0123456789";
before(async () => {
  ctx = await startTestApp({ env: { JOB_SECRET: secret }, register: [maintenanceRoutes(async () => ({ runs: ++invoked }))] });
});
after(async () => { await ctx?.stop(); });
beforeEach(async () => { await ctx.app.deps.db.delete(backgroundJobs); });

test("jobs commit and roll back atomically with their originating mutation", async () => {
  const db = ctx.app.deps.db;
  const queue = databaseJobs(db);
  await assert.rejects(db.transaction(async (tx) => {
    await queue.send("test", { rollback: true }, tx);
    throw new Error("rollback");
  }));
  assert.equal((await db.select().from(backgroundJobs)).length, 0);
  await db.transaction(async (tx) => { await queue.send("test", { committed: true }, tx); });
  // A different runtime can handle the job; the original runtime need not remain alive.
  const restarted = databaseJobs(db);
  let payload: unknown;
  await restarted.work("test", async (data) => { payload = data; });
  assert.deepEqual(await restarted.drain(), { completed: 1, failed: 0 });
  assert.deepEqual(payload, { committed: true });
});

test("concurrent cron calls claim each job once", async () => {
  const db = ctx.app.deps.db;
  const a = databaseJobs(db), b = databaseJobs(db);
  const seen: number[] = [];
  const handle = async (data: unknown) => { seen.push((data as { n: number }).n); };
  await a.work("test", handle); await b.work("test", handle);
  for (let n = 0; n < 8; n++) await a.send("test", { n });
  await Promise.all([a.drain(), b.drain()]);
  assert.equal(seen.length, 8); assert.equal(new Set(seen).size, 8);
});

test("failed and expired leases retry, active leases are untouched", async () => {
  const db = ctx.app.deps.db, queue = databaseJobs(db);
  await queue.send("test", {});
  await queue.work("test", async () => { throw new Error("storage unavailable"); });
  assert.deepEqual(await queue.drain(), { completed: 0, failed: 1 });
  const [failed] = await db.select().from(backgroundJobs);
  assert.equal(failed!.attempts, 1); assert.equal(failed!.leaseToken, null);
  assert.ok(failed!.availableAt.getTime() > Date.now());
  await queue.work("test", async () => {});
  assert.deepEqual(await queue.drain(), { completed: 0, failed: 0 });
  await db.update(backgroundJobs).set({ availableAt: new Date(0), leaseToken: "crashed", leaseExpiresAt: new Date(Date.now() + 60_000) });
  assert.deepEqual(await queue.drain(), { completed: 0, failed: 0 });
  await db.update(backgroundJobs).set({ leaseExpiresAt: new Date(0) });
  assert.deepEqual(await queue.drain(), { completed: 1, failed: 0 });
});

test("a stale worker cannot acknowledge another worker's lease", async () => {
  const db = ctx.app.deps.db, queue = databaseJobs(db);
  await queue.send("test", {});
  await queue.work("test", async () => { await db.update(backgroundJobs).set({ leaseToken: "new-owner" }); });
  await queue.drain({ limit: 1 });
  assert.equal((await db.select().from(backgroundJobs))[0]!.leaseToken, "new-owner");
});

test("cron authentication is required and does not grant user access", async () => {
  const { app } = ctx;
  const count = invoked;
  for (const headers of [{}, { "x-akar-job-secret": "bad" }, { authorization: `Bearer ${secret}` }]) {
    const res = await app.inject({ method: "POST", url: "/internal/jobs/run", headers });
    assert.equal(res.statusCode, 401);
  }
  assert.equal(invoked, count);
  const res = await app.inject({ method: "POST", url: "/internal/jobs/run", headers: { "x-akar-job-secret": secret } });
  assert.equal(res.statusCode, 200); assert.equal(res.headers["cache-control"], "no-store");
  assert.equal(invoked, count + 1);
  const saved = app.deps.config.JOB_SECRET;
  app.deps.config.JOB_SECRET = undefined;
  assert.equal((await app.inject({ method: "POST", url: "/internal/jobs/run", headers: { "x-akar-job-secret": secret } })).statusCode, 401);
  app.deps.config.JOB_SECRET = saved;
  assert.equal((await app.inject({ url: "/v1/me", headers: { "x-akar-job-secret": secret } })).statusCode, 401);
  assert.equal((app.swagger().paths as Record<string, unknown>)["/internal/jobs/run"], undefined);
});
