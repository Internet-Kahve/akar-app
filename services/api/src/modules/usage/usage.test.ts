import type { HeritageSite } from "@akar/domain";
import { eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { App } from "../../app.ts";
import type { Db } from "../../db/client.ts";
import { sitePartCards, sites, usageDaily } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { usageRoutes } from "./routes.ts";
import type { SiteStatsResponse, StatsResponse } from "./schemas.ts";
import { statsRange, usageDay } from "./service.ts";

const site = (id: string): HeritageSite => ({
  id,
  name: id === "ulu-cami" ? "Ulu Cami" : "Koza Han",
  city: "Bursa",
  district: "Osmangazi",
  year: "1400",
  architect: "—",
  kind: "cami",
  coordinates: [29.06, 40.18],
  minutes: 2,
  description: "Açıklama",
  status: "published",
  stories: [{ id: `${id}-s1`, title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" }],
  source: "test",
  tier: "Tier 2",
});

let app: App;
let db: Db;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({ register: [usageRoutes] }));
  db = app.deps.db;
  await loadCatalog(db, { sites: [site("ulu-cami"), site("koza-han")], routes: [] });
  await db.insert(sitePartCards).values({ id: "ulu-minber", siteId: "ulu-cami", position: 0, parts: ["Minber"], title: "Minber", body: "Metin", trust: "representative" });
});
after(async () => {
  await stop?.();
});
beforeEach(async () => {
  await db.delete(usageDaily);
});

const send = (events: unknown[], signedIn = false) =>
  app.inject({
    method: "POST",
    url: "/v1/events",
    payload: { events },
    headers: signedIn ? authHeader({ id: "u-1", role: "user" }) : {},
  });
const admin = authHeader({ id: "admin-1", role: "admin" });
const stats = async (query = "") => (await app.inject({ method: "GET", url: `/v1/admin/stats${query}`, headers: admin })).json<StatsResponse>();

test("counts add up per day, split into guests and signed-in users, without storing who", async () => {
  assert.equal((await send([{ event: "site.view", siteId: "ulu-cami" }, { event: "site.view", siteId: "ulu-cami" }, { event: "app.open" }])).json().accepted, 3);
  await send([{ event: "site.view", siteId: "ulu-cami" }], true);
  await send([{ event: "site.view", siteId: "koza-han" }]);

  const rows = await db.select().from(usageDaily);
  assert.deepEqual(Object.keys(rows[0]!).sort(), ["count", "day", "event", "guest", "ref", "siteId"]);

  const body = await stats();
  assert.deepEqual(body.totals.find((t) => t.event === "site.view"), { event: "site.view", guest: 3, signedIn: 1 });
  assert.deepEqual(body.daily.map((d) => [d.day, d.event, d.guest, d.signedIn]), [
    [usageDay(new Date()), "app.open", 1, 0],
    [usageDay(new Date()), "site.view", 3, 1],
  ]);
  assert.deepEqual(body.sites.map((s) => [s.siteId, s.name]), [["ulu-cami", "Ulu Cami"], ["koza-han", "Koza Han"]]);
});

test("events that break their rule or name unknown things are dropped, the rest of the batch counts", async () => {
  const res = await send([
    { event: "site.view" }, // site missing
    { event: "app.open", siteId: "ulu-cami" }, // site not allowed
    { event: "site.view", siteId: "yok-boyle-eser" },
    { event: "story.sentence", siteId: "ulu-cami", ref: "abc" },
    { event: "story.sentence", siteId: "ulu-cami", ref: "500" },
    { event: "narration.play", siteId: "ulu-cami", ref: "de" },
    { event: "part_card.open", siteId: "koza-han", ref: "ulu-minber" }, // card of another site
    { event: "route.open", ref: "yok-boyle-rota" },
    { event: "part_card.open", siteId: "ulu-cami", ref: "ulu-minber" },
    { event: "story.sentence", siteId: "ulu-cami", ref: "07" },
  ]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().accepted, 2);
  const rows = await db.select({ event: usageDaily.event, ref: usageDaily.ref }).from(usageDaily).orderBy(usageDaily.event);
  assert.deepEqual(rows, [{ event: "part_card.open", ref: "ulu-minber" }, { event: "story.sentence", ref: "7" }]);

  assert.equal((await send([{ event: "nope" }])).statusCode, 400);
  assert.equal((await send(Array.from({ length: 51 }, () => ({ event: "app.open" })))).statusCode, 400);
});

test("site detail orders the story drop-off by sentence number and names part cards", async () => {
  await send([
    ...["0", "0", "0", "1", "1", "10", "2"].map((ref) => ({ event: "story.sentence", siteId: "ulu-cami", ref })),
    { event: "part_card.open", siteId: "ulu-cami", ref: "ulu-minber" },
  ]);
  const res = await app.inject({ method: "GET", url: "/v1/admin/stats/sites/ulu-cami", headers: admin });
  const body = res.json<SiteStatsResponse>();
  assert.deepEqual(body.rows.map((r) => [r.event, r.ref, r.guest, r.label]), [
    ["part_card.open", "ulu-minber", 1, "Minber"],
    ["story.sentence", "0", 3, null],
    ["story.sentence", "1", 2, null],
    ["story.sentence", "2", 1, null],
    ["story.sentence", "10", 1, null],
  ]);
  assert.equal((await app.inject({ method: "GET", url: "/v1/admin/stats/sites/yok", headers: admin })).statusCode, 404);
});

test("counts of a removed site stay, without a name", async () => {
  await loadCatalog(db, { sites: [site("gecici")], routes: [] });
  await send([{ event: "site.view", siteId: "gecici" }]);
  await db.delete(sites).where(eq(sites.id, "gecici"));
  const body = await stats();
  assert.deepEqual(body.sites.map((s) => [s.siteId, s.name]), [["gecici", null]]);
});

test("stats are admin only and the range is checked", async () => {
  for (const role of ["user", "editor", "moderator"] as const) {
    const res = await app.inject({ method: "GET", url: "/v1/admin/stats", headers: authHeader({ id: `${role}-1`, role }) });
    assert.equal(res.statusCode, 403, role);
  }
  assert.equal((await app.inject({ method: "GET", url: "/v1/admin/stats" })).statusCode, 401);
  assert.equal((await app.inject({ method: "GET", url: "/v1/admin/stats?from=2026-11-05&to=2026-11-04", headers: admin })).statusCode, 400);
  assert.equal((await app.inject({ method: "GET", url: "/v1/admin/stats?from=2025-11-01&to=2026-11-04", headers: admin })).statusCode, 400);
  assert.deepEqual(statsRange({ to: "2026-03-01" }, new Date()), { from: "2026-01-31", to: "2026-03-01" });
  // 23:30 UTC on 4 Nov is already 5 Nov in Istanbul.
  assert.equal(usageDay(new Date("2026-11-04T23:30:00Z")), "2026-11-05");
});
