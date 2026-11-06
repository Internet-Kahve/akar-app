import type { HeritageRoute, HeritageSite } from "@akar/domain";
import { eq, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { App } from "../../app.ts";
import { sites as sitesTable, walkingLegs } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import { openRouteService, RoutingError, type WalkingPath, type WalkingRouter } from "../../platform/routing.ts";
import { startTestApp } from "../../test/harness.ts";
import type { RouteDto } from "./schemas.ts";
import { fillWalkingLegs } from "./walking.ts";

type Point = [number, number];

const site = (id: string, coordinates: Point, over: Partial<HeritageSite> = {}): HeritageSite => ({
  id,
  name: id,
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1400",
  architect: "—",
  kind: "han",
  coordinates,
  minutes: 2,
  description: `${id} açıklaması`,
  status: "published",
  stories: [{ id: `${id}-s1`, title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" }],
  source: "test",
  tier: "Tier 2",
  ...over,
});

const route = (id: string, siteIds: string[], over: Partial<HeritageRoute> = {}): HeritageRoute => ({
  id,
  name: `Rota ${id}`,
  description: "açıklama",
  siteIds,
  minutes: 30,
  distance: "1 km",
  theme: "test",
  status: "published",
  ...over,
});

const A: Point = [29.061, 40.181];
const B: Point = [29.062, 40.182];
const C: Point = [29.063, 40.183];
const HIDDEN: Point = [29.064, 40.184];

let app: App;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp());
  await loadCatalog(app.deps.db, {
    sites: [site("a", A), site("b", B), site("c", C), site("gizli", HIDDEN, { status: "draft" })],
    routes: [
      // The draft site in the middle is never shown, so neither are legs to or from it: a → b directly.
      route("yol", ["a", "gizli", "b", "c"]),
      // Same leg a → b as "yol": asked for once.
      route("kisa", ["a", "b"]),
      route("taslak", ["c", "a"], { status: "draft" }),
    ],
  });
});
after(() => stop?.());
beforeEach(async () => {
  await app.deps.db.delete(walkingLegs);
  await app.deps.db.update(sitesTable).set({ location: B }).where(eq(sitesTable.id, "b"));
});

/** Answers 100 m / 80 s per leg unless `answer` says otherwise; records every request. */
function fakeRouter(answer: (from: Point, to: Point, call: number) => WalkingPath | Error = () => ({ coordinates: [], meters: 100, seconds: 80 })) {
  const calls: string[] = [];
  const router: WalkingRouter = {
    async walk(from, to) {
      calls.push(`${from.join(",")}>${to.join(",")}`);
      const r = answer(from, to, calls.length);
      if (r instanceof Error) throw r;
      return { ...r, coordinates: r.coordinates.length ? r.coordinates : [from, [(from[0] + to[0]) / 2, from[1]], to] };
    },
  };
  return { router, calls };
}

const fill = (router: WalkingRouter, dailyLimit = 500, opts = {}) => fillWalkingLegs({ db: app.deps.db, router, dailyLimit }, opts);
const routeOf = async (id: string) => (await app.inject({ method: "GET", url: `/v1/routes/${id}` })).json<RouteDto>();
const leg = (from: Point, to: Point) => `${from.join(",")}>${to.join(",")}`;

test("only legs between consecutive shown stops of published routes are asked, each once; the read then uses them", async () => {
  const { router, calls } = fakeRouter();
  const before = await routeOf("yol");
  assert.equal(before.walking.status, "unavailable");
  assert.deepEqual(before.stops.map((s) => s.leg), [null, null, null]);

  const run = await fill(router);
  assert.deepEqual(run, { computed: 2, noRoute: 0, failed: 0, stopped: null });
  // a → b shared by both routes; nothing to/from the draft site, nothing of the draft route (c → a).
  assert.deepEqual(calls.sort(), [leg(A, B), leg(B, C)].sort());

  const after = await routeOf("yol");
  assert.deepEqual(after.walking, { status: "complete", meters: 200, minutes: 3 });
  assert.equal(after.distanceMeters, 200);
  assert.equal(after.distance, "200 m");
  // Walking from the real path (160 s ≈ 3 min) + 2 min narration per shown stop.
  assert.equal(after.minutes, 3 + 3 * 2);
  assert.deepEqual(after.stops[0]!.leg!.coordinates[0], A);
  assert.deepEqual(after.stops[0]!.leg!.coordinates.at(-1), B);
  assert.equal(after.stops[2]!.leg, null);

  // Nothing missing: a second run asks nothing.
  assert.deepEqual(await fill(router), { computed: 0, noRoute: 0, failed: 0, stopped: null });
  assert.equal(calls.length, 2);
});

test("a partly computed route shows only its computed legs, no walking total, and the straight-line estimate", async () => {
  const { router } = fakeRouter((from) => (from[0] === B[0] ? new RoutingError("failed", "timeout") : { coordinates: [], meters: 100, seconds: 80 }));
  const straight = await routeOf("yol");
  assert.deepEqual(await fill(router, 500, { retries: 0 }), { computed: 1, noRoute: 0, failed: 1, stopped: null });

  const r = await routeOf("yol");
  assert.deepEqual(r.walking, { status: "partial", meters: null, minutes: null });
  assert.notEqual(r.stops[0]!.leg, null);
  assert.equal(r.stops[1]!.leg, null);
  assert.equal(r.distanceMeters, straight.distanceMeters);
  assert.equal(r.minutes, straight.minutes);

  // The failed leg is not stored and is asked again on the next run.
  const again = fakeRouter();
  await fill(again.router);
  assert.deepEqual(again.calls, [leg(B, C)]);
  assert.equal((await routeOf("yol")).walking.status, "complete");
});

test("moving a site hides its old legs at once and asks only the legs that touch it", async () => {
  await fill(fakeRouter().router);
  const moved: Point = [29.0625, 40.1825];
  await app.deps.db.update(sitesTable).set({ location: moved }).where(eq(sitesTable.id, "b"));

  const r = await routeOf("yol");
  assert.deepEqual(r.stops.map((s) => s.leg), [null, null, null]);
  assert.equal(r.walking.status, "unavailable");

  const { router, calls } = fakeRouter();
  await fill(router);
  assert.deepEqual(calls.sort(), [leg(A, moved), leg(moved, C)].sort());
  assert.equal((await routeOf("yol")).walking.status, "complete");
});

test("no path found is stored and not asked again within the hour; a refused key or 429 stops the run", async () => {
  const none = fakeRouter(() => new RoutingError("no-route", "yok"));
  assert.deepEqual(await fill(none.router), { computed: 0, noRoute: 2, failed: 0, stopped: null });
  assert.equal((await routeOf("kisa")).walking.status, "unavailable");
  assert.deepEqual(await fill(none.router), { computed: 0, noRoute: 0, failed: 0, stopped: null });
  assert.equal(none.calls.length, 2);

  // An hour later it is tried again.
  await app.deps.db.update(walkingLegs).set({ failedAt: sql`now() - interval '61 minutes'` });
  const stopped = fakeRouter(() => new RoutingError("stop", "429"));
  assert.deepEqual(await fill(stopped.router), { computed: 0, noRoute: 0, failed: 0, stopped: "service" });
  assert.equal(stopped.calls.length, 1);
});

test("retries, legs per run and the rolling daily limit bound the requests", async () => {
  const flaky = fakeRouter(() => new RoutingError("failed", "5xx"));
  assert.deepEqual(await fill(flaky.router, 500, { retries: 2 }), { computed: 0, noRoute: 0, failed: 2, stopped: null });
  // 2 legs + 2 retries shared by the run.
  assert.equal(flaky.calls.length, 4);

  const one = fakeRouter();
  assert.equal((await fill(one.router, 500, { maxLegs: 1 })).computed, 1);
  assert.equal(one.calls.length, 1);

  // One request already made in the last 24 h: a limit of 1 leaves nothing for this run.
  const capped = fakeRouter();
  assert.deepEqual(await fill(capped.router, 1), { computed: 0, noRoute: 0, failed: 0, stopped: "daily-limit" });
  assert.equal(capped.calls.length, 0);
});

test("openrouteservice: path, distance and duration are read; 429, 404, 5xx and broken answers map to their kinds", async () => {
  const answer = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });
  const ok = {
    features: [{ geometry: { coordinates: [[29.0612345678, 40.18, 120], [29.062, 40.182]] }, properties: { summary: { distance: 190.4, duration: 151.6 } } }],
  };
  const path = await openRouteService("k", answer(200, ok)).walk(A, B, AbortSignal.timeout(1000));
  assert.deepEqual(path, { coordinates: [[29.061235, 40.18], [29.062, 40.182]], meters: 190, seconds: 152 });

  const kind = async (status: number, body: unknown) =>
    openRouteService("k", answer(status, body)).walk(A, B, AbortSignal.timeout(1000)).then(() => "ok", (e: RoutingError) => e.kind);
  assert.equal(await kind(429, {}), "stop");
  assert.equal(await kind(403, {}), "stop");
  assert.equal(await kind(404, { error: { code: 2010 } }), "no-route");
  assert.equal(await kind(502, {}), "failed");
  assert.equal(await kind(200, { features: [] }), "failed");
  assert.equal(await kind(200, { features: [{ geometry: { coordinates: [[1, 2]] }, properties: { summary: { distance: 1, duration: 1 } } }] }), "failed");
});
