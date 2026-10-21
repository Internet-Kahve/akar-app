import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { FastifyRequest } from "fastify";
import type { App } from "../app.ts";
import { AppError } from "../errors.ts";
import { startTestApp } from "../test/harness.ts";
import { idempotent } from "./idempotency.ts";

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
