import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { FastifyRequest } from "fastify";
import type { App } from "../app.ts";
import { AppError } from "../errors.ts";
import { startTestApp } from "../test/harness.ts";
import { eq } from "drizzle-orm";
import { idempotencyKeys } from "../db/schema/index.ts";
import { idempotent, IDEMPOTENCY_TTL_HOURS, purgeIdempotencyKeys } from "./idempotency.ts";

let app: App;
let stop: (() => Promise<void>) | undefined;
before(async () => ({ app, stop } = await startTestApp()));
after(() => stop?.());

const req = (key: string, body: unknown) =>
  ({ method: "POST", url: "/v1/things", headers: { "idempotency-key": key }, body }) as unknown as FastifyRequest;

test("a retried key replays the first response without re-running; a reused key with another body is rejected", async () => {
  let runs = 0;
  const handler = async () => ({ status: 201, body: { id: `thing-${++runs}` } });

  const first = await idempotent(app.deps.db, req("k1", { a: 1 }), "user-1", handler);
  const retry = await idempotent(app.deps.db, req("k1", { a: 1 }), "user-1", handler);
  assert.deepEqual(retry, first);
  assert.equal(runs, 1);

  // Keys are scoped per actor.
  await idempotent(app.deps.db, req("k1", { a: 1 }), "user-2", handler);
  assert.equal(runs, 2);

  await assert.rejects(
    idempotent(app.deps.db, req("k1", { a: 2 }), "user-1", handler),
    (e: unknown) => e instanceof AppError && e.statusCode === 422 && e.code === "IDEMPOTENCY_KEY_REUSED",
  );
});

test("replay records are forgotten after the TTL with the personal data in their responses; younger ones still replay", async () => {
  let runs = 0;
  const handler = async () => ({ status: 201, body: { text: `kişisel metin ${++runs}` } });
  await idempotent(app.deps.db, req("old", {}), "user-ttl", handler);
  await idempotent(app.deps.db, req("new", {}), "user-ttl", handler);
  const past = new Date(Date.now() - (IDEMPOTENCY_TTL_HOURS * 3_600_000 + 60_000));
  await app.deps.db.update(idempotencyKeys).set({ createdAt: past }).where(eq(idempotencyKeys.key, "old"));

  assert.equal(await purgeIdempotencyKeys(app.deps.db), 1);
  const left = await app.deps.db.select({ key: idempotencyKeys.key }).from(idempotencyKeys).where(eq(idempotencyKeys.actorId, "user-ttl"));
  assert.deepEqual(left, [{ key: "new" }]);
  await idempotent(app.deps.db, req("new", {}), "user-ttl", handler);
  assert.equal(runs, 2, "a key inside the TTL still replays");
});
