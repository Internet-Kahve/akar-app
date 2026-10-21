import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog } from "../../db/schema/index.ts";
import type { ErrorBody } from "../../errors.ts";
import type { Role } from "../../platform/auth.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { settingsRoutes } from "./routes.ts";
import type { MapSettings } from "./schemas.ts";

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({ register: [settingsRoutes] }));
});
after(async () => stop?.());

const as = (role: Role) => authHeader({ id: `${role}-1`, role });
const put = (payload: Record<string, unknown>, headers: Record<string, string> = as("admin")) =>
  app.inject({ method: "PUT", url: "/v1/admin/map-settings", headers, payload });

test("only an admin changes map settings", async () => {
  const body: MapSettings = { modelMinZoom: 15, maxVisibleModels: 3 };
  assert.equal((await put(body, {})).statusCode, 401);
  for (const role of ["user", "editor", "moderator"] as const) {
    assert.equal((await put(body, as(role))).statusCode, 403, role);
  }
  const before = (await app.inject({ method: "GET", url: "/v1/map-settings" })).json<MapSettings>();
  assert.notDeepEqual(before, body);
});

test("an admin change is what the apps read next, and it is audited", async () => {
  const body: MapSettings = { modelMinZoom: 16.5, maxVisibleModels: 0 };
  const res = await put(body);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["cache-control"], "no-store");

  const read = await app.inject({ method: "GET", url: "/v1/map-settings" });
  assert.deepEqual(read.json(), body);
  assert.match(String(read.headers["cache-control"]), /public/);

  const [row] = await app.deps.db.select().from(auditLog).where(eq(auditLog.action, "map-settings.update"));
  assert.equal(row?.actorId, "admin-1");
  assert.deepEqual(row?.after, body);
});

test("out-of-range or partial values are rejected and change nothing", async () => {
  const current = (await app.inject({ method: "GET", url: "/v1/map-settings" })).json<MapSettings>();
  for (const bad of [
    { modelMinZoom: 25, maxVisibleModels: 5 },
    { modelMinZoom: 16, maxVisibleModels: 2.5 },
    { modelMinZoom: 16, maxVisibleModels: 51 },
    { modelMinZoom: 16 },
  ]) {
    const res = await put(bad);
    assert.equal(res.statusCode, 400, JSON.stringify(bad));
    assert.equal(res.json<ErrorBody>().error.code, "VALIDATION_FAILED");
  }
  assert.deepEqual((await app.inject({ method: "GET", url: "/v1/map-settings" })).json(), current);
});
