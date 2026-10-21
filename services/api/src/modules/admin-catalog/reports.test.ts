import type { HeritageSite, SiteSource } from "@akar/domain";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { media, sources } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import { insertDraftSites, type DraftSite } from "../catalog/drafts.ts";
import { siteDedupeKey, slugify } from "../catalog/service.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import type { DuplicateGroup } from "./reports.ts";
import { adminReportRoutes } from "./reports-routes.ts";
import { adminSiteRoutes } from "./sites-routes.ts";
import type { AdminSiteDetail, AdminSiteListItem } from "./sites-schemas.ts";

type Headers = Record<string, string>;
type Page<T> = { items: T[]; nextCursor: string | null };

const editor = authHeader({ id: "editor-1", role: "editor" });
const admin = authHeader({ id: "admin-1", role: "admin" });
const user = authHeader({ id: "user-1", role: "user" });
const moderator = authHeader({ id: "mod-1", role: "moderator" });

let app: App;
let stop: (() => Promise<void>) | undefined;

const published = (id: string, name: string, district: string): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district,
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

const draft = (cityId: string, name: string, district: string, over: Partial<DraftSite> = {}): DraftSite => ({
  id: `${cityId}-${slugify(name)}-${slugify(district)}`,
  name,
  district,
  typeId: "han",
  role: "akar",
  address: null,
  location: null,
  locationSource: null,
  dedupeKey: siteDedupeKey(name, district),
  importMeta: {},
  locator: "s. 1",
  sourceSummary: "Envanter, s. 1",
  sourceId: "src-inv",
  ...over,
});

const inventory: SiteSource = { id: "src-inv", title: "Envanter", kind: "book", author: "", year: "", page: "", url: "", trust: "inferred" };

/** Sorted after every padding draft, so a `ready` page has to read past the first scan batch to find it. */
const READY_NAME = "Zeytin Hanı";
const PADDING = 105;

let readyId = "";

before(async () => {
  ({ app, stop } = await startTestApp({ register: [adminReportRoutes, adminSiteRoutes] }));
  const db = app.deps.db;
  await loadCatalog(db, {
    sites: [
      published("koza-han", "Koza Hanı", "Hanlar Bölgesi"),
      published("bursa-emir-bedesten", "Emir Bedesten", "Osmangazi"),
      // Same bare name, both published: nothing for an editor to decide.
      published("yeni-cami-a", "Yeni Cami", "Osmangazi"),
      published("yeni-cami-b", "Yeni Camii", "Yıldırım"),
    ],
    routes: [],
  });
  await insertDraftSites(db, {
    city: { id: "bursa", name: "Bursa" },
    sources: [inventory],
    drafts: [
      // Same building as the published one: "Hanlar Bölgesi" is Osmangazi.
      draft("bursa", "Koza Han", "Osmangazi", { location: [29.06, 40.18], locationSource: "osm" }),
      // Same name, other district: maybe a different building.
      draft("bursa", "Koza Hanı", "Nilüfer", { location: [29.0, 40.2], locationSource: "nominatim-street" }),
      draft("bursa", "Emir Bedesteni", "Osmangazi", { location: [29.061, 40.183], locationSource: "nominatim-neighbourhood" }),
      ...Array.from({ length: PADDING }, (_, i) => draft("bursa", `Dolgu Hanı ${String(i).padStart(3, "0")}`, "Osmangazi")),
    ],
  });
  await insertDraftSites(db, {
    city: { id: "edirne", name: "Edirne" },
    sources: [inventory],
    drafts: [
      draft("edirne", "Rüstem Paşa Hanı", "Merkez"),
      draft("edirne", "Rüstem Paşa Han", "Merkez"),
      // A bare type word names no building; a parenthetical is the building's own name. Neither pair is a duplicate.
      ...[
        ["Camii", "Merkez"],
        ["Camii", "Keşan"],
        ["(Balabancık) Camii", "Merkez"],
        ["(Batpazarı) Camii", "Keşan"],
      ].map(([name, district]) => draft("edirne", name!, district!, { location: [26.55, 41.67], locationSource: "osm" })),
    ],
  });

  // One draft that passes the publish gate, built through the editor endpoints.
  await db.insert(sources).values({ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" });
  await db.insert(media).values(
    ["ph-1", "ph-2"].map((id) => ({ id, kind: "photo" as const, mime: "image/jpeg", url: `https://cdn.test/${id}.jpg`, alt: `${id} alt`, license: "CC BY 4.0", sourceId: "src-vgm", trust: "verified" as const })),
  );
  const created = await call<AdminSiteDetail>("/v1/admin/sites", editor, "POST", {
    name: READY_NAME,
    city: "bursa",
    district: "Osmangazi",
    typeId: "han",
    description: "Hanlar bölgesinde bir han.",
  });
  assert.equal(created.res.statusCode, 201, created.res.body);
  readyId = created.body.id;
  const base = `/v1/admin/sites/${readyId}`;
  const writes: [string, object][] = [
    [`${base}/location`, { coordinates: [29.06, 40.18] }],
    [`${base}/sources`, { sources: [{ id: "src-vgm", title: "VGM Bursa Envanteri", kind: "book", trust: "verified" }] }],
    [`${base}/media`, { photoIds: ["ph-1", "ph-2"], coverPhotoId: "ph-1" }],
    [
      `${base}/stories`,
      { blocks: [{ title: "Giriş", text: "Han 1491'de yapıldı.", simple: "Han eskidir.", trust: "verified", photoId: "ph-1", sourceId: "src-vgm", highlights: [] }] },
    ],
  ];
  for (const [url, payload] of writes) {
    const { res, body } = await call<AdminSiteDetail>(url, editor, "PUT", payload);
    assert.equal(res.statusCode, 200, `${url}: ${res.body}`);
    if (url.endsWith("/stories")) assert.deepEqual(body.issues, [], "the fixture draft must be publishable");
  }
});
after(() => stop?.());

async function call<T>(url: string, headers?: Headers, method: "GET" | "POST" | "PUT" = "GET", payload?: object) {
  const res = await app.inject({ method, url, headers: { ...headers }, ...(payload ? { payload } : {}) });
  return { res, body: res.json<T>() };
}

/** Walks every page of a report and returns the items in order. */
async function all<T>(url: string, limit: number): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;
  for (let pages = 0; pages < 500; pages++) {
    const sep = url.includes("?") ? "&" : "?";
    const { res, body }: { res: { statusCode: number; body: string }; body: Page<T> } = await call<Page<T>>(
      `${url}${sep}limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`,
      editor,
    );
    assert.equal(res.statusCode, 200, res.body);
    assert.ok(body.items.length <= limit);
    if (body.nextCursor) assert.equal(body.items.length, limit, "a page with a next cursor is full");
    items.push(...body.items);
    if (!body.nextCursor) return items;
    cursor = body.nextCursor;
  }
  throw new Error("pagination did not end");
}

const REPORTS = ["/v1/admin/reports/draft-issues", "/v1/admin/reports/locations", "/v1/admin/reports/duplicates"];

test("reports are for editors and admins: guests get 401, users and moderators 403", async () => {
  for (const url of REPORTS) {
    assert.equal((await call(url)).res.statusCode, 401, url);
    for (const headers of [user, moderator]) assert.equal((await call(url, headers)).res.statusCode, 403, url);
    for (const headers of [editor, admin]) {
      const { res } = await call(url, headers);
      assert.equal(res.statusCode, 200, `${url}: ${res.body}`);
      assert.equal(res.headers["cache-control"], "no-store", url);
    }
  }
});

test("draft issues: drafts only, split into blocked and ready by the publish gate, every page full across scan batches", async () => {
  const blocked = await all<AdminSiteListItem>("/v1/admin/reports/draft-issues", 7);
  const ready = await all<AdminSiteListItem>("/v1/admin/reports/draft-issues?state=ready", 1);

  assert.deepEqual(
    ready.map((s) => s.id),
    [readyId],
  );
  assert.ok(blocked.every((s) => s.status === "draft" && s.issues.length > 0 && s.issueCount === s.issues.length));
  assert.equal(new Set(blocked.map((s) => s.id)).size, blocked.length, "no draft twice");
  assert.equal(blocked.length, PADDING + 3 + 6, "every imported draft of both cities, none published");
  assert.ok(!blocked.some((s) => s.id === readyId));

  const missing = blocked.find((s) => s.name === "Dolgu Hanı 000");
  assert.ok(missing?.issues.some((i) => /enlem ve boylam/.test(i)), JSON.stringify(missing?.issues));
  const approximate = blocked.find((s) => s.name === "Emir Bedesteni");
  assert.ok(approximate?.issues.some((i) => i.startsWith("Konum yaklaşık")), JSON.stringify(approximate?.issues));

  const edirne = await all<AdminSiteListItem>("/v1/admin/reports/draft-issues?city=edirne", 20);
  assert.equal(edirne.length, 6);
  assert.ok(edirne.every((s) => s.city.id === "edirne"));
});

test("locations: drafts without a pin or with a street / neighbourhood-centre pin, nothing else", async () => {
  const names = async (query: string) => (await all<AdminSiteListItem>(`/v1/admin/reports/locations${query}`, 50)).map((s) => s.name);

  const approximate = await names("?state=approximate");
  assert.deepEqual(approximate, ["Emir Bedesteni", "Koza Hanı"]);

  const missing = await names("?state=missing&city=bursa");
  assert.equal(missing.length, PADDING);
  assert.ok(missing.every((n) => n.startsWith("Dolgu Hanı")));

  const both = await names("");
  assert.equal(both.length, PADDING + 2 + 2, "approximate + missing in both cities");
  for (const placed of ["Koza Han", READY_NAME]) assert.ok(!both.includes(placed), `${placed} has a real pin`);
});

test("duplicates: same bare name in one city with a draft among them; published-only pairs and other cities stay apart", async () => {
  const groups = await all<DuplicateGroup>("/v1/admin/reports/duplicates", 1);
  const byKey = Object.fromEntries(groups.map((g) => [`${g.city.id}:${g.key}`, g]));
  assert.deepEqual(Object.keys(byKey).sort(), ["bursa:emir bedesten", "bursa:koza han", "edirne:rustem pasa han"]);

  const koza = byKey["bursa:koza han"]!;
  assert.deepEqual(
    koza.sites.map((s) => [s.id, s.status]),
    [
      ["koza-han", "published"],
      ["bursa-koza-han-osmangazi", "draft"],
      ["bursa-koza-hani-nilufer", "draft"],
    ],
    "published first, then by name",
  );
  assert.equal(koza.sameDistrict, true, "Hanlar Bölgesi and Osmangazi are one district");
  assert.equal(byKey["bursa:emir bedesten"]?.sameDistrict, true);
  assert.equal(byKey["edirne:rustem pasa han"]?.sameDistrict, true);

  const edirne = await all<DuplicateGroup>("/v1/admin/reports/duplicates?city=edirne", 20);
  assert.deepEqual(edirne.map((g) => g.key), ["rustem pasa han"]);
});
