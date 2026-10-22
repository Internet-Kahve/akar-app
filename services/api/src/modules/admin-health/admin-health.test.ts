import type { HeritageSite } from "@akar/domain";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { App } from "../../app.ts";
import type { Db } from "../../db/client.ts";
import { media, memories } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import type { Role } from "../../platform/auth.ts";
import { authHeader } from "../../test/auth.ts";
import { startTestApp } from "../../test/harness.ts";
import { adminHealthRoutes } from "./routes.ts";
import type { AdminHealthResponse } from "./schemas.ts";
import { storageLevel } from "./service.ts";

const SITE = "ulu-cami";
const HOUR = 3_600_000;
const QUOTA_BYTES = 1024 * 1024; // STORAGE_QUOTA_MB = 1

const site: HeritageSite = {
  id: SITE,
  name: "Ulu Cami",
  city: "Bursa",
  district: "Osmangazi",
  year: "1400",
  architect: "—",
  kind: "cami",
  coordinates: [29.06, 40.18],
  minutes: 2,
  description: "Ulu Cami açıklaması",
  status: "published",
  stories: [{ id: "s1", title: "Başlık", text: "Metin", simple: "Metin", trust: "representative" }],
  source: "test",
  tier: "Tier 2",
};

let app: App;
let db: Db;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({ register: [adminHealthRoutes], env: { STORAGE_QUOTA_MB: "1" } }));
  db = app.deps.db;
  await loadCatalog(db, { sites: [site], routes: [] });
});
after(async () => {
  await stop?.();
});
beforeEach(async () => {
  await db.delete(memories);
  await db.delete(media);
});

const health = (role: Role | null) =>
  app.inject({ method: "GET", url: "/v1/admin/health", headers: role ? authHeader({ id: `${role}-1`, role }) : {} });
const healthAs = async (role: Role) => (await health(role)).json<AdminHealthResponse>();

let seq = 0;
const seedMemory = (hoursAgo: number, status: "pending" | "approved" = "pending") =>
  db.insert(memories).values({
    id: `mem-${++seq}`,
    siteId: SITE,
    authorId: "author",
    authorName: "Ayşe",
    text: "Anı",
    status,
    kvkkConsentAt: new Date(),
    kvkkTextVersion: "kvkk-v1",
    createdAt: new Date(Date.now() - hoursAgo * HOUR),
  });

const seedMedia = (kind: "photo" | "model" | "audio", bytes: number | null) =>
  db.insert(media).values({ id: `media-${++seq}`, kind, mime: "application/octet-stream", url: `https://cdn.akar.test/${seq}`, license: "CC0", trust: "representative", bytes });

test("guests get 401 and visitors 403", async () => {
  assert.equal((await health(null)).statusCode, 401);
  assert.equal((await health("user")).statusCode, 403);
  assert.equal((await health("editor")).statusCode, 403);
});

test("a moderator sees the stale-pending warning and no storage; an admin sees both; never cached", async () => {
  await seedMemory(60);
  const moderator = await health("moderator");
  assert.equal(moderator.statusCode, 200);
  assert.equal(moderator.headers["cache-control"], "no-store");
  const body = moderator.json<Record<string, unknown>>();
  assert.equal("storage" in body, false);
  assert.equal((body.pendingStale as { count: number }).count, 1);

  const admin = await healthAs("admin");
  assert.equal(admin.pendingStale.count, 1);
  assert.equal(admin.storage?.quotaBytes, QUOTA_BYTES);
});

test("pending memories count as stale after 48 hours, not before; only pending ones count", async () => {
  await seedMemory(47);
  await seedMemory(72, "approved");
  assert.deepEqual((await healthAs("moderator")).pendingStale, { count: 0, oldestCreatedAt: null, thresholdHours: 48 });

  await seedMemory(49);
  await seedMemory(100);
  const { pendingStale } = await healthAs("moderator");
  assert.equal(pendingStale.count, 2);
  assert.equal(pendingStale.thresholdHours, 48);
  const oldest = new Date(pendingStale.oldestCreatedAt!).getTime();
  assert.ok(Math.abs(Date.now() - oldest - 100 * HOUR) < 60_000);
});

test("storage sums media bytes by kind, counting rows without a size as 0", async () => {
  await seedMedia("photo", 300_000);
  await seedMedia("photo", 200_000);
  await seedMedia("photo", null);
  await seedMedia("model", 100_000);
  const { storage } = await healthAs("admin");
  assert.deepEqual(storage, {
    usedBytes: 600_000,
    quotaBytes: QUOTA_BYTES,
    percent: 57.2,
    level: "ok",
    byKind: { photo: 500_000, model: 100_000, audio: 0 },
  });
});

test("storage level turns warn at 80 % and critical at 95 % of the quota", async () => {
  await seedMedia("photo", 800_000); // 76.3 %
  assert.equal((await healthAs("admin")).storage?.level, "ok");
  await seedMedia("audio", 100_000); // 85.8 %
  assert.equal((await healthAs("admin")).storage?.level, "warn");
  await seedMedia("model", 100_000); // 95.4 %
  assert.equal((await healthAs("admin")).storage?.level, "critical");
});

test("level boundaries are inclusive", () => {
  assert.equal(storageLevel(79.99), "ok");
  assert.equal(storageLevel(80), "warn");
  assert.equal(storageLevel(94.99), "warn");
  assert.equal(storageLevel(95), "critical");
  assert.equal(storageLevel(120), "critical");
});
