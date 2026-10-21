import type { HeritageSite } from "@akar/domain";
import { count, eq } from "drizzle-orm";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog, importJobs, sites } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { ErrorBody } from "../../errors.ts";
import type { InlineJobQueue } from "../../platform/jobs.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import type { GeoHit, Geocoder } from "../ingest/geocode.ts";
import { IMPORT_PLAN_JOB } from "./imports.ts";
import { adminImportRoutes } from "./imports-routes.ts";

type Headers = Record<string, string>;
type Job = {
  id: string;
  cityId: string;
  status: string;
  includeToc: boolean;
  report: Record<string, number | Record<string, number>> | null;
  summary: string | null;
  insertedCount: number | null;
  error: string | null;
  createdBy: string;
  items?: Item[];
  nextCursor?: string | null;
};
type Item = { row: number; sourceRowId: string; status: string; name: string; district: string | null; typeId: string | null; possibleDuplicateOf: string | null };

const editor = authHeader({ id: "editor-1", role: "editor" });
const admin = authHeader({ id: "admin-1", role: "admin" });
const user = authHeader({ id: "user-1", role: "user" });
const moderator = authHeader({ id: "mod-1", role: "moderator" });

const HEADER = "id,cilt,sayfa,ilce,ad_ham,ad_supheli,tur,sablon,rol,olcu_sayisi,kubbe_gecisi,adres";
const csvOf = (...rows: string[]) => [HEADER, ...rows].join("\n");

// Deterministic geocoder: no network in tests. "Patlayan Han" simulates a geocoder outage.
const hits: Record<string, GeoHit> = {
  "Abdal Mehmed Camii": { location: [29.06, 40.18], source: "overpass" },
  "Geyve Hanı": { location: [29.061, 40.184], source: "nominatim" },
  "Halil Ağa Evi": { location: [28.88, 40.37], source: "nominatim-address" },
  "Koza Hanı": { location: [29.0635, 40.1844], source: "osm" },
  "Yeni Cami": { location: [29.07, 40.2], source: "osm" },
  "Tekrar Han": { location: [29.071, 40.201], source: "osm" },
  "Onay Han": { location: [29.072, 40.202], source: "osm" },
  "İçindekiler Hanı": { location: [29.073, 40.203], source: "osm" },
};
let located: string[] = [];
const geocoder: Geocoder = {
  locate: async ({ name }) => {
    if (name === "Patlayan Han") throw new Error("geokodlayıcı yanıt vermedi");
    located.push(name);
    return hits[name] ?? null;
  },
};

// The main inventory: every bucket of the report once, and a published building the import must not touch.
const inventory = csvOf(
  'b-1,cilt-1,10,Osmangazi,Abdal Mehmed Camii,0,Cami,cami,hayrat,1,1,"Abdal Mehmed Camii, Osmangazi İlçesi, Tuzpazarı Mahallesi"',
  "b-2,cilt-1,11,Osmangazi,Geyve Hanı,0,Han,han,akar,0,0,",
  "b-3,cilt-1,12,Osmangazi,Geyve Hanı,0,Han,han,akar,0,0,",
  "b-4,cilt-1,13,Mudanya,Halil Ağa Evi,0,Konak,ayri_inceleme,hayrat,0,0,",
  "b-5,cilt-1,14,Yildirim,Uzak Çeşme,0,Çeşme,cesme,hayrat,0,0,",
  "b-6,cilt-2,,,Koza Han [yalnız içindekiler],0,Han,han,akar,,,",
  "b-7,cilt-2,8,Osmangazi,Koza Hanı,,Han,han,akar,3,,",
  "b-8,cilt-2,9,Nilüfer,Koza Hanı,,Han,han,akar,3,,",
);
const INVENTORY_DRAFTS = ["bursa-abdal-mehmed-camii-osmangazi", "bursa-geyve-hani-osmangazi", "bursa-halil-aga-evi-mudanya", "bursa-uzak-cesme-yildirim", "bursa-koza-hani-nilufer"];

const published = (id: string, name: string): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district: "Hanlar Bölgesi",
  year: "1491",
  architect: "",
  kind: "han",
  coordinates: [29.0635, 40.1844],
  minutes: 3,
  description: `${name} açıklaması`,
  status: "published",
  stories: [{ id: `${id}-s1`, title: "Başlık", text: "Metin", simple: "Metin", trust: "verified" }],
  source: "test",
  tier: "Hero",
});

let app: App;
let jobs: InlineJobQueue;
let stop: (() => Promise<void>) | undefined;
let bareApp: App;
let stopBare: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, jobs, stop } = await startTestApp({ register: [adminImportRoutes], geocoderFor: async () => geocoder }));
  await loadCatalog(app.deps.db, { sites: [published("koza-han", "Koza Hanı")], routes: [] });
  // No geocoder configured (the harness default): the import endpoints cannot plan.
  ({ app: bareApp, stop: stopBare } = await startTestApp({ register: [adminImportRoutes] }));
});
after(async () => {
  await stop?.();
  await stopBare?.();
});

const call = async <T = unknown>(method: "GET" | "POST", url: string, headers?: Headers, payload?: object, target: App = app) => {
  const res = await target.inject({ method, url, headers: { ...headers }, ...(payload === undefined ? {} : { payload }) });
  return { res, body: res.json<T>() };
};

const start = async (csv: string, over: { includeToc?: boolean; headers?: Headers } = {}) => {
  const { res, body } = await call<Job>("POST", "/v1/admin/imports", { ...editor, ...over.headers }, { cityId: "bursa", csv, ...(over.includeToc === undefined ? {} : { includeToc: over.includeToc }) });
  assert.equal(res.statusCode, 202, res.body);
  return body;
};

/** Uploads a CSV and lets the planning job run. */
const plan = async (csv: string, includeToc?: boolean): Promise<Job> => {
  const queued = await start(csv, includeToc === undefined ? {} : { includeToc });
  await jobs.drain();
  return detail(queued.id);
};

const detail = async (id: string, query = ""): Promise<Job> => {
  const { res, body } = await call<Job>("GET", `/v1/admin/imports/${id}${query}`, editor);
  assert.equal(res.statusCode, 200, res.body);
  return body;
};

const commit = (id: string, headers: Headers = editor) => call<Job>("POST", `/v1/admin/imports/${id}/commit`, headers);

const siteCount = async () => (await app.deps.db.select({ n: count() }).from(sites))[0]!.n;
const auditRows = async (action: string, entityId: string) =>
  (await app.deps.db.select().from(auditLog).where(eq(auditLog.entityId, entityId))).filter((a) => a.action === action);
const jobCount = async () => (await app.deps.db.select({ n: count() }).from(importJobs))[0]!.n;

test("a guest gets 401 and a user or moderator 403 on every import endpoint; editors and admins are let in", async () => {
  const calls: [string, string, object?][] = [
    ["POST", "/v1/admin/imports", { cityId: "bursa", csv: csvOf("x-1,cilt-1,1,Osmangazi,Yetki Han,0,Han,han,akar,0,0,") }],
    ["GET", "/v1/admin/imports/import-yok"],
    ["POST", "/v1/admin/imports/import-yok/commit"],
  ];
  const storedBefore = await jobCount();
  for (const [method, url, payload] of calls) {
    const guest = await call<ErrorBody>(method as "GET" | "POST", url, {}, payload);
    assert.equal(guest.res.statusCode, 401, `${method} ${url}`);
    assert.equal(guest.body.error.code, "UNAUTHENTICATED");
    assert.equal((await call<ErrorBody>("GET", url, { authorization: "Bearer garbage" }, undefined)).res.statusCode, 401, "an invalid token is not a guest");
    for (const headers of [user, moderator]) {
      const denied = await call<ErrorBody>(method as "GET" | "POST", url, headers, payload);
      assert.equal(denied.res.statusCode, 403, `${method} ${url}`);
      assert.equal(denied.body.error.code, "FORBIDDEN");
    }
  }
  assert.equal(await jobCount(), storedBefore, "a refused upload stores nothing");

  // Allowed roles reach the handlers: an unknown id is 404, not 401/403.
  for (const headers of [editor, admin]) {
    assert.equal((await call("GET", "/v1/admin/imports/import-yok", headers)).res.statusCode, 404);
    assert.equal((await call("POST", "/v1/admin/imports/import-yok/commit", headers)).res.statusCode, 404);
  }
  const asAdmin = await start(csvOf("x-1,cilt-1,1,Osmangazi,Yönetici Han,0,Han,han,akar,0,0,"), { headers: admin });
  assert.equal(asAdmin.createdBy, "admin-1");
  await jobs.drain();
});

test("an upload is queued and audited, then planned as a dry run that writes no sites", async () => {
  const sitesBefore = await siteCount();
  located = [];

  const queued = await start(inventory);
  assert.equal(queued.status, "queued");
  assert.equal(queued.report, null);
  assert.equal(queued.createdBy, "editor-1");
  assert.ok(!("csv" in queued), "the raw upload is never echoed");
  assert.equal(located.length, 0, "nothing is geocoded inside the request");
  assert.equal((await detail(queued.id)).status, "queued");

  await jobs.drain();
  const planned = await detail(queued.id);
  assert.equal(planned.status, "planned");
  assert.equal(planned.error, null);
  assert.deepEqual(
    {
      read: planned.report?.read,
      ready: planned.report?.ready,
      approximate: planned.report?.approximate,
      noLocation: planned.report?.noLocation,
      typeUnclear: planned.report?.typeUnclear,
      duplicates: planned.report?.duplicates,
      tocSkipped: planned.report?.tocSkipped,
      possibleDuplicates: planned.report?.possibleDuplicates,
    },
    { read: 8, ready: 3, approximate: 0, noLocation: 1, typeUnclear: 1, duplicates: 2, tocSkipped: 1, possibleDuplicates: 1 },
  );
  assert.ok(planned.summary?.startsWith("8 kayıt okundu"), planned.summary ?? "");

  const byId = Object.fromEntries((planned.items ?? []).map((i) => [i.sourceRowId, i]));
  assert.deepEqual(
    (planned.items ?? []).map((i) => [i.row, i.status]),
    [[1, "ready"], [2, "ready"], [3, "duplicate"], [4, "typeUnclear"], [5, "noLocation"], [6, "tocSkipped"], [7, "duplicate"], [8, "ready"]],
  );
  assert.equal(byId["b-8"]?.possibleDuplicateOf, "koza-han", "a same-named published site is flagged, not skipped");
  assert.equal(byId["b-7"]?.status, "duplicate", "the published building's own key is a duplicate");
  assert.equal(byId["b-4"]?.typeId, null);

  assert.equal(await siteCount(), sitesBefore, "dry run writes no sites");
  assert.equal((await auditRows("import.create", queued.id)).length, 1);
  assert.equal((await auditRows("import.commit", queued.id)).length, 0);
  const [create] = await auditRows("import.create", queued.id);
  assert.equal(create?.actorId, "editor-1");
  assert.deepEqual(create?.after, { cityId: "bursa", includeToc: false, rows: 8 });
});

test("a plan's items are paged in CSV order; a bad cursor is 400 and an unknown job 404", async () => {
  const rows = Array.from({ length: 5 }, (_, i) => `p-${i + 1},cilt-1,${i + 1},Osmangazi,Sayfa Han ${"I".repeat(i + 1)},0,Han,han,akar,0,0,`);
  const job = await plan(csvOf(...rows));
  assert.equal(job.items?.length, 5, "the default page holds everything");
  assert.equal(job.nextCursor, null);

  const seen: number[] = [];
  let cursor: string | null | undefined;
  let pages = 0;
  do {
    const page = await detail(job.id, `?limit=2${cursor ? `&cursor=${cursor}` : ""}`);
    assert.ok((page.items?.length ?? 0) <= 2);
    seen.push(...(page.items ?? []).map((i) => i.row));
    cursor = page.nextCursor;
    pages++;
    assert.equal(page.report?.read, 5, "every page carries the job itself");
  } while (cursor);
  assert.deepEqual(seen, [1, 2, 3, 4, 5]);
  assert.equal(pages, 3);

  const garbage = await call<ErrorBody>("GET", `/v1/admin/imports/${job.id}?cursor=not-a-cursor`, editor);
  assert.equal(garbage.res.statusCode, 400);
  assert.equal(garbage.body.error.code, "INVALID_CURSOR");
  const negative = Buffer.from(JSON.stringify({ o: "-3" })).toString("base64url");
  assert.equal((await call<ErrorBody>("GET", `/v1/admin/imports/${job.id}?cursor=${negative}`, editor)).body.error.code, "INVALID_CURSOR");
  const fractional = Buffer.from(JSON.stringify({ o: "1.5" })).toString("base64url");
  assert.equal((await call<ErrorBody>("GET", `/v1/admin/imports/${job.id}?cursor=${fractional}`, editor)).body.error.code, "INVALID_CURSOR");
  const wrongKey = Buffer.from(JSON.stringify({ x: "1" })).toString("base64url");
  assert.equal((await call<ErrorBody>("GET", `/v1/admin/imports/${job.id}?cursor=${wrongKey}`, editor)).body.error.code, "INVALID_CURSOR");
  assert.equal((await call<ErrorBody>("GET", `/v1/admin/imports/${job.id}?limit=0`, editor)).body.error.code, "VALIDATION_FAILED");

  const missing = await call<ErrorBody>("GET", "/v1/admin/imports/import-yok", editor);
  assert.equal(missing.res.statusCode, 404);
  assert.equal(missing.body.error.code, "NOT_FOUND");
  assert.equal((await call<ErrorBody>("POST", "/v1/admin/imports/import-yok/commit", editor)).body.error.code, "NOT_FOUND");
});

test("an unusable upload is 400 and stores nothing", async () => {
  const storedBefore = await jobCount();
  const post = (payload: object) => call<ErrorBody>("POST", "/v1/admin/imports", editor, payload);

  const unknownCity = await post({ cityId: "atlantis", csv: inventory });
  assert.equal(unknownCity.res.statusCode, 400);
  assert.equal(unknownCity.body.error.code, "VALIDATION_FAILED");
  assert.ok(unknownCity.body.error.fieldErrors.cityId, "names the field");
  assert.equal((await post({ cityId: "__proto__", csv: inventory })).res.statusCode, 400, "prototype keys are not cities");

  const noRows = await post({ cityId: "bursa", csv: HEADER });
  assert.equal(noRows.res.statusCode, 400);
  assert.ok(noRows.body.error.fieldErrors.csv);

  const noNameColumn = await post({ cityId: "bursa", csv: "id,ad\nb-1,Han" });
  assert.equal(noNameColumn.res.statusCode, 400);
  assert.ok(noNameColumn.body.error.fieldErrors.csv);

  assert.equal((await post({ cityId: "bursa", csv: "" })).body.error.code, "VALIDATION_FAILED");
  assert.equal((await post({ cityId: "bursa", csv: `${HEADER}\u0000` })).body.error.code, "VALIDATION_FAILED");
  assert.equal((await post({ cityId: "bursa" })).body.error.code, "VALIDATION_FAILED");
  assert.equal((await post({ cityId: "bursa", csv: inventory, includeToc: "yes" })).body.error.code, "VALIDATION_FAILED");

  assert.equal(await jobCount(), storedBefore);
});

test("an inventory is refused with 503 when no geocoder is configured, and no job is stored", async () => {
  const storedBefore = (await bareApp.deps.db.select({ n: count() }).from(importJobs))[0]!.n;
  const { res, body } = await call<ErrorBody>("POST", "/v1/admin/imports", editor, { cityId: "bursa", csv: inventory }, bareApp);
  assert.equal(res.statusCode, 503);
  assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  assert.equal((await bareApp.deps.db.select({ n: count() }).from(importJobs))[0]!.n, storedBefore);
  // The role gate still comes first.
  assert.equal((await call("POST", "/v1/admin/imports", user, { cityId: "bursa", csv: inventory }, bareApp)).res.statusCode, 403);
});

test("committing writes draft sites only, leaves published content alone and is audited once", async () => {
  const [koza] = await app.deps.db.select().from(sites).where(eq(sites.id, "koza-han"));
  assert.equal(koza?.status, "published");
  const sitesBefore = await siteCount();

  const job = await plan(inventory.replace(/b-/g, "c-")); // the same buildings under other row ids: no dedupe against earlier plans (nothing committed yet)
  assert.equal(job.status, "planned");

  const { res, body } = await commit(job.id);
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(body.status, "committed");
  assert.equal(body.insertedCount, INVENTORY_DRAFTS.length);
  assert.equal(await siteCount(), sitesBefore + INVENTORY_DRAFTS.length);

  for (const id of INVENTORY_DRAFTS) {
    const [row] = await app.deps.db.select().from(sites).where(eq(sites.id, id));
    assert.ok(row, id);
    assert.equal(row.status, "draft", id);
    assert.equal(row.trust, "inferred", id);
    assert.equal(row.tier, "Tier 1", id);
    assert.equal(row.cityId, "bursa", id);
    assert.ok(row.importMeta, "the raw row is kept for review");
  }
  const [geyve] = await app.deps.db.select().from(sites).where(eq(sites.id, "bursa-geyve-hani-osmangazi"));
  assert.equal(geyve?.name, "Geyve Hanı");
  assert.equal(geyve?.typeId, "han");
  assert.equal(geyve?.locationSource, "nominatim");
  const [unclear] = await app.deps.db.select().from(sites).where(eq(sites.id, "bursa-halil-aga-evi-mudanya"));
  assert.equal(unclear?.typeId, null, "an unclear type is imported as a draft with no type");
  const [nowhere] = await app.deps.db.select().from(sites).where(eq(sites.id, "bursa-uzak-cesme-yildirim"));
  assert.equal(nowhere?.location, null, "an unlocated row is still a draft");

  // The published building is byte-for-byte what it was.
  const [kozaAfter] = await app.deps.db.select().from(sites).where(eq(sites.id, "koza-han"));
  assert.deepEqual(kozaAfter, koza);

  // Drafts stay invisible to the public API.
  assert.equal((await app.inject({ method: "GET", url: "/v1/sites/bursa-geyve-hani-osmangazi" })).statusCode, 404);
  const list = (await app.inject({ method: "GET", url: "/v1/sites?city=bursa&limit=100" })).json<{ items: { id: string }[] }>().items.map((s) => s.id);
  for (const id of INVENTORY_DRAFTS) assert.ok(!list.includes(id), `${id} leaked into the public list`);
  assert.ok(list.includes("koza-han"));

  const audits = await auditRows("import.commit", job.id);
  assert.equal(audits.length, 1);
  assert.equal(audits[0]?.actorId, "editor-1");
  assert.deepEqual(audits[0]?.before, { status: "planned" });
  assert.deepEqual(audits[0]?.after, { status: "committed", cityId: "bursa", insertedCount: INVENTORY_DRAFTS.length });
  assert.equal((await detail(job.id)).status, "committed");

  // Committing again (no key) is a refused state transition: nothing more is written or audited.
  const again = await call<ErrorBody>("POST", `/v1/admin/imports/${job.id}/commit`, editor);
  assert.equal(again.res.statusCode, 409);
  assert.equal(again.body.error.code, "CONFLICT");
  assert.equal(await siteCount(), sitesBefore + INVENTORY_DRAFTS.length);
  assert.equal((await auditRows("import.commit", job.id)).length, 1);
});

test("importing the same inventory again skips every row already stored and adds no duplicates", async () => {
  // The previous test committed this inventory (row ids differ, the buildings do not).
  const sitesBefore = await siteCount();
  const job = await plan(inventory.replace(/b-/g, "d-"));
  assert.equal(job.report?.duplicates, 7, "every non-TOC row now matches a stored site");
  assert.equal(job.report?.ready, 0);
  assert.equal(job.report?.tocSkipped, 1);
  assert.ok((job.items ?? []).every((i) => i.status === "duplicate" || i.status === "tocSkipped"));

  const done = await commit(job.id);
  assert.equal(done.res.statusCode, 200);
  assert.equal(done.body.insertedCount, 0);
  assert.equal(await siteCount(), sitesBefore);
});

test("two plans made before either commits cannot insert the same building twice", async () => {
  const csv = csvOf("t-1,cilt-1,1,Osmangazi,Tekrar Han,0,Han,han,akar,0,0,");
  const first = await plan(csv);
  const second = await plan(csv);
  assert.equal(first.report?.ready, 1);
  assert.equal(second.report?.ready, 1, "neither plan knows about the other");

  const sitesBefore = await siteCount();
  assert.equal((await commit(first.id)).body.insertedCount, 1);
  const late = await commit(second.id);
  assert.equal(late.res.statusCode, 200);
  assert.equal(late.body.insertedCount, 0, "the stale plan finds the building stored and skips it");
  assert.equal(await siteCount(), sitesBefore + 1);
  assert.equal((await app.deps.db.select({ n: count() }).from(sites).where(eq(sites.id, "bursa-tekrar-han-osmangazi")))[0]!.n, 1);
});

test("table-of-contents rows are skipped unless includeToc is set", async () => {
  const csv = csvOf(
    "i-1,cilt-1,3,Osmangazi,Yeni Cami,0,Cami,cami,hayrat,0,0,",
    "i-2,cilt-2,,,İçindekiler Hanı [yalnız içindekiler],0,Han,han,akar,,,",
  );
  const skipped = await plan(csv);
  assert.equal(skipped.includeToc, false);
  assert.deepEqual((skipped.items ?? []).map((i) => i.status), ["ready", "tocSkipped"]);

  const included = await plan(csv, true);
  assert.equal(included.includeToc, true);
  assert.deepEqual((included.items ?? []).map((i) => i.status), ["ready", "ready"]);
  const [create] = await auditRows("import.create", included.id);
  assert.deepEqual(create?.after, { cityId: "bursa", includeToc: true, rows: 2 });
});

test("only a planned job can be committed: queued and failed jobs are 409 and write nothing", async () => {
  const queued = await start(csvOf("q-1,cilt-1,1,Osmangazi,Sıradaki Han,0,Han,han,akar,0,0,"));
  const sitesBefore = await siteCount();
  const tooEarly = await commit(queued.id);
  assert.equal(tooEarly.res.statusCode, 409);
  assert.equal((tooEarly.body as unknown as ErrorBody).error.code, "CONFLICT");
  assert.equal((await detail(queued.id)).status, "queued", "a refused commit leaves the job as it was");
  await jobs.drain();
  assert.equal((await detail(queued.id)).status, "planned");

  const failing = await plan(csvOf("f-1,cilt-1,1,Osmangazi,Patlayan Han,0,Han,han,akar,0,0,"));
  assert.equal(failing.status, "failed");
  assert.match(failing.error ?? "", /^Planlama başarısız: .*geokodlayıcı yanıt vermedi/);
  assert.equal(failing.report, null);
  assert.deepEqual(failing.items, [], "a failed plan has no items");
  const refused = await commit(failing.id);
  assert.equal(refused.res.statusCode, 409);
  assert.equal(await siteCount(), sitesBefore);
  assert.equal((await auditRows("import.commit", failing.id)).length, 0);
});

test("a redelivered planning message does not plan a job twice, and unreadable job data is dropped", async () => {
  const job = await plan(csvOf("r-1,cilt-1,1,Osmangazi,Onay Han,0,Han,han,akar,0,0,"));
  assert.equal(job.status, "planned");
  const geocodedBefore = located.length;

  await jobs.send(IMPORT_PLAN_JOB, { importId: job.id });
  await jobs.send(IMPORT_PLAN_JOB, { importId: "import-yok" });
  await jobs.send(IMPORT_PLAN_JOB, { nonsense: true });
  await jobs.drain();

  assert.equal(located.length, geocodedBefore, "nothing was geocoded again");
  assert.equal((await detail(job.id)).status, "planned");
  assert.equal((await commit(job.id)).res.statusCode, 200, "the plan survived the redelivery");
});

test("a plan interrupted mid-run (server stopped) is taken over when the queue redelivers its message", async () => {
  const queued = await start(csvOf("s-1,cilt-1,1,Osmangazi,Yarım Han,0,Han,han,akar,0,0,"));
  // The run that claimed the job died before writing a result.
  await app.deps.db.update(importJobs).set({ status: "planning", updatedAt: new Date() }).where(eq(importJobs.id, queued.id));

  // The redelivery (pg-boss retries a job whose worker stopped) is the message still pending here.
  await jobs.drain();
  assert.equal((await detail(queued.id)).status, "planned");
  assert.equal((await commit(queued.id)).res.statusCode, 200);
});

test("replaying an upload under the same Idempotency-Key answers the first response and stores one job; another body under the key is 422", async () => {
  const payload = { cityId: "bursa", csv: csvOf("k-1,cilt-1,1,Osmangazi,Anahtar Han,0,Han,han,akar,0,0,") };
  const headers = { ...editor, "idempotency-key": "import-upload-1" };
  const jobsBefore = await jobCount();

  const first = await call<Job>("POST", "/v1/admin/imports", headers, payload);
  const replay = await call<Job>("POST", "/v1/admin/imports", headers, payload);
  assert.equal(first.res.statusCode, 202);
  assert.equal(replay.res.statusCode, 202);
  assert.equal(replay.body.id, first.body.id);
  assert.equal(await jobCount(), jobsBefore + 1);
  assert.equal((await auditRows("import.create", first.body.id)).length, 1);

  const reused = await call<ErrorBody>("POST", "/v1/admin/imports", headers, { ...payload, includeToc: true });
  assert.equal(reused.res.statusCode, 422);
  assert.equal(reused.body.error.code, "IDEMPOTENCY_KEY_REUSED");
  assert.equal(await jobCount(), jobsBefore + 1);

  // The replay enqueued nothing: one drain plans the job once.
  located = [];
  await jobs.drain();
  assert.equal((await detail(first.body.id)).status, "planned");
  assert.deepEqual(located, ["Anahtar Han"], "planned exactly once");
});

test("replaying a commit under the same Idempotency-Key answers the first response and commits once; the key cannot move to another job", async () => {
  const job = await plan(csvOf("m-1,cilt-1,1,Osmangazi,Onay Han,0,Han,han,akar,0,0,"));
  // "Onay Han" is already stored by the redelivery test: the commit inserts nothing but is still audited.
  const other = await plan(csvOf("m-2,cilt-1,1,Osmangazi,Yeni Cami,0,Cami,cami,hayrat,0,0,"));
  const sitesBefore = await siteCount();
  const headers = { ...editor, "idempotency-key": "import-commit-1" };

  const first = await commit(job.id, headers);
  const replay = await commit(job.id, headers);
  assert.equal(first.res.statusCode, 200, first.res.body);
  assert.equal(replay.res.statusCode, 200, "a retry after a lost response is not a 409");
  assert.deepEqual(replay.body, first.body);
  assert.equal((await auditRows("import.commit", job.id)).length, 1);
  assert.equal(await siteCount(), sitesBefore + (first.body.insertedCount ?? 0));

  const moved = await commit(other.id, headers);
  assert.equal(moved.res.statusCode, 422);
  assert.equal((moved.body as unknown as ErrorBody).error.code, "IDEMPOTENCY_KEY_REUSED");
  assert.equal((await detail(other.id)).status, "planned", "the refused request committed nothing");
  assert.equal((await auditRows("import.commit", other.id)).length, 0);

  // The same key from another actor is another key.
  const adminCommit = await commit(other.id, { ...admin, "idempotency-key": "import-commit-1" });
  assert.equal(adminCommit.res.statusCode, 200);
  assert.equal((await auditRows("import.commit", other.id))[0]?.actorId, "admin-1");
});
