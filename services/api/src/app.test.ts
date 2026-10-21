import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "./app.ts";
import type { ErrorBody } from "./errors.ts";
import { startTestApp } from "./test/harness.ts";

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp());
});
after(() => stop?.());

test("ready reports ok once migrations ran against a real database", async () => {
  const res = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { status: "ok" });
});

test("unknown routes use the shared error contract and echo the caller's request id", async () => {
  const res = await app.inject({ method: "GET", url: "/v1/nope", headers: { "x-request-id": "req-123" } });
  assert.equal(res.statusCode, 404);
  assert.equal(res.headers["x-request-id"], "req-123");
  const body = res.json<ErrorBody>();
  assert.deepEqual(body, {
    error: { code: "NOT_FOUND", message: "Kaynak bulunamadı.", fieldErrors: {}, requestId: "req-123" },
  });
});

test("an invalid bearer token is rejected, never downgraded to a guest", async () => {
  for (const authorization of ["Bearer forged", "Basic abc"]) {
    const res = await app.inject({ method: "GET", url: "/v1/sites", headers: { authorization } });
    assert.equal(res.statusCode, 401);
    assert.equal(res.json<ErrorBody>().error.code, "UNAUTHENTICATED");
  }
});
