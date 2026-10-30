import { and, eq, inArray, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog, cities, media, narrations, sources, storyBlocks } from "../../db/schema/index.ts";
import type { ErrorBody } from "../../errors.ts";
import { DEFAULT_TTS_VOICES, parseVoiceModels } from "../../platform/tts.ts";
import { authHeader } from "../../test/auth.ts";
import { fakeTranslator, fakeTts } from "../../test/fakes.ts";
import { startTestApp } from "../../test/harness.ts";
import type { AdminSiteDetail } from "../admin-catalog/sites-schemas.ts";
import { createFsStorage, type FsStorage } from "../media/storage-fs.ts";
import { NARRATION_ACTION } from "./service.ts";
import { narrationHash, spokenText } from "./spoken.ts";

type Summary = { generated: number; skipped: number; stale: number };
type Translated = { translated: number; skipped: number };

const editor = authHeader({ id: "editor-1", role: "editor" });
const user = authHeader({ id: "user-1", role: "user" });

const tts = fakeTts();
const translator = fakeTranslator();
const models = parseVoiceModels(DEFAULT_TTS_VOICES) as Record<string, string>;

let app: App;
let root: string;
let stop: (() => Promise<void>) | undefined;
let storage: { uploads: FsStorage; media: FsStorage };

before(async () => {
  root = await mkdtemp(join(tmpdir(), "akar-narrations-"));
  const links = { uploadBaseUrl: "http://api.akar.test", signingSecret: "test-signing-secret-0123456789abcdef" };
  storage = {
    uploads: createFsStorage({ ...links, root: join(root, "uploads") }),
    media: createFsStorage({ ...links, root: join(root, "media"), publicBaseUrl: "https://cdn.akar.test/media" }),
  };
  ({ app, stop } = await startTestApp({ storage, tts, translator }));
  await app.deps.db.insert(cities).values({ id: "bursa", name: "Bursa" });
  await app.deps.db.insert(sources).values({ id: "src-1", title: "Kaynak", kind: "book", trust: "verified" });
  await app.deps.db.insert(media).values({ id: "ph-1", kind: "photo", mime: "image/jpeg", url: "https://cdn.test/ph-1.jpg", alt: "Fotoğraf", license: "CC0", sourceId: "src-1", trust: "verified" });
});
after(async () => {
  await stop?.();
  await rm(root, { recursive: true, force: true });
});

const call = async <T = unknown>(method: "GET" | "POST" | "PUT", url: string, headers: Record<string, string> = editor, payload?: object) => {
  const res = await app.inject({ method, url, headers, ...(payload === undefined ? {} : { payload }) });
  return { res, body: res.json<T>() };
};

const block = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: "Giriş",
  text: "Han 1491'de yapıldı.",
  simple: "Han eskidir.",
  trust: "verified",
  photoId: "ph-1",
  sourceId: "src-1",
  highlights: [],
  ...over,
});

/** A draft site with the given sentences. */
async function newSite(name: string, blocks: object[]): Promise<string> {
  const created = await call<AdminSiteDetail>("POST", "/v1/admin/sites", editor, { name, city: "bursa", district: "Osmangazi", typeId: "han", description: "Bir han." });
  assert.equal(created.res.statusCode, 201, created.res.body);
  const id = created.body.id;
  await call("PUT", `/v1/admin/sites/${id}/sources`, editor, { sources: [{ id: "src-1", title: "Kaynak", kind: "book", trust: "verified" }] });
  await call("PUT", `/v1/admin/sites/${id}/media`, editor, { photoIds: ["ph-1"], coverPhotoId: "ph-1" });
  const saved = await call<AdminSiteDetail>("PUT", `/v1/admin/sites/${id}/stories`, editor, { blocks });
  assert.equal(saved.res.statusCode, 200, saved.res.body);
  return id;
}

const narrate = (siteId: string, body?: object, headers: Record<string, string> = editor) => call<Summary>("POST", `/v1/admin/sites/${siteId}/narrations`, headers, body);
const rowsOf = (siteId: string) => app.deps.db.select().from(narrations).where(eq(narrations.siteId, siteId));
const detailOf = async (siteId: string) => (await call<AdminSiteDetail>("GET", `/v1/admin/sites/${siteId}`)).body;

test("the voice-over is for editors: a plain user gets 403 and a guest 401, and nothing is spoken", async () => {
  const id = await newSite("Yetki Hanı", [block("b1")]);
  for (const [path, body] of [["narrations", undefined], ["translate", undefined]] as const) {
    const refused = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/${path}`, user, body);
    assert.equal(refused.res.statusCode, 403, path);
    const guest = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/${path}`, {}, body);
    assert.equal(guest.res.statusCode, 401, path);
  }
  assert.equal(tts.calls.length, 0);
  assert.equal(translator.calls.length, 0);
});

test("four voices are generated for every variant, a second call generates nothing, and a changed text replaces only its recordings", async () => {
  const id = await newSite("Sesli Han", [
    block("b1", { textEn: "The inn was built in 1491.", simpleEn: "The inn is old." }),
    block("b2", { text: "İkinci cümle.", simple: "Kısa." }),
  ]);
  tts.calls.length = 0;

  const first = await narrate(id);
  assert.equal(first.res.statusCode, 200, first.res.body);
  // b1: tr text + simple and en text + simple, two voices each (8); b2: Turkish only (4).
  assert.deepEqual(first.body, { generated: 12, skipped: 0, stale: 0 });
  assert.equal(tts.calls.length, 12);
  assert.deepEqual([...new Set(tts.calls.map((c) => c.model))].sort(), Object.values(models).sort());
  const spoken = tts.calls.find((c) => c.text.includes("bin dört yüz"));
  assert.ok(spoken, "digits are spoken as words");
  assert.ok(!tts.calls.some((c) => /\d/.test(c.text) && c.model.endsWith("-tr")), "no digits reach the Turkish voices");

  const rows = await rowsOf(id);
  assert.equal(rows.length, 12);
  const mediaRows = await app.deps.db.select().from(media).where(inArray(media.id, rows.map((r) => r.mediaId)));
  assert.equal(mediaRows.length, 12);
  assert.ok(mediaRows.every((m) => m.kind === "audio" && m.mime === "audio/mpeg"));
  for (const row of rows) {
    const key = (await app.deps.db.select({ key: media.storageKey }).from(media).where(eq(media.id, row.mediaId)))[0]!.key!;
    assert.ok(await storage.media.head(key), "the audio object is stored");
  }
  const audit = await app.deps.db.select().from(auditLog).where(and(eq(auditLog.entityId, id), eq(auditLog.action, NARRATION_ACTION)));
  assert.equal(audit.length, 12);
  assert.ok(audit.every((a) => Number((a.after as { chars: number }).chars) > 0));
  assert.equal((await detailOf(id)).has.audio, true);
  assert.equal((await detailOf(id)).stories.find((s) => s.id === "b1")?.narrations.length, 8);

  tts.calls.length = 0;
  const second = await narrate(id);
  assert.deepEqual(second.body, { generated: 0, skipped: 12, stale: 0 });
  assert.equal(tts.calls.length, 0);

  // Only the Turkish sentence of b2 changes: its two recordings are stale, hidden from the detail, then replaced.
  const oldTexts = rows.filter((r) => r.subjectId === "b2" && r.variant === "text" && r.lang === "tr");
  assert.equal(oldTexts.length, 2);
  const oldMedia = oldTexts.map((r) => r.mediaId);
  const oldKeys = (await app.deps.db.select({ key: media.storageKey }).from(media).where(inArray(media.id, oldMedia))).map((m) => m.key!);
  const saved = await call("PUT", `/v1/admin/sites/${id}/stories`, editor, { blocks: [block("b1", { textEn: "The inn was built in 1491.", simpleEn: "The inn is old." }), block("b2", { text: "Üçüncü cümle.", simple: "Kısa." })] });
  assert.equal(saved.res.statusCode, 200, saved.res.body);
  assert.equal((await detailOf(id)).stories.find((s) => s.id === "b2")?.narrations.length, 2, "the stale recordings of b2 are not offered");

  const third = await narrate(id);
  assert.deepEqual(third.body, { generated: 2, skipped: 10, stale: 2 });
  assert.deepEqual(await app.deps.db.select({ id: media.id }).from(media).where(inArray(media.id, oldMedia)), [], "the replaced media rows are gone");
  for (const key of oldKeys) assert.equal(await storage.media.head(key), null, "the replaced objects are deleted");
  assert.equal((await rowsOf(id)).length, 12);
  assert.equal((await detailOf(id)).stories.find((s) => s.id === "b2")?.narrations.length, 4);

  // One sentence only.
  tts.calls.length = 0;
  const one = await narrate(id, { storyBlockId: "b1" });
  assert.deepEqual(one.body, { generated: 0, skipped: 8, stale: 0 });
});

test("the stored hash is the digest of the spoken text and the model; an Idempotency-Key replays without speaking again", async () => {
  const id = await newSite("Özet Hanı", [block("b1", { text: "Kapı 3. kattadır." })]);
  const key = { ...editor, "idempotency-key": "narrate-1" };
  const first = await narrate(id, undefined, key);
  assert.equal(first.body.generated, 4);
  const [row] = (await rowsOf(id)).filter((r) => r.variant === "text" && r.voice === "female");
  assert.equal(row?.textHash, narrationHash(models["tr.female"]!, spokenText("tr", "Kapı 3. kattadır.")));
  const callsBefore = tts.calls.length;
  await app.deps.db.update(storyBlocks).set({ text: "Başka." }).where(eq(storyBlocks.siteId, id));
  const replay = await narrate(id, undefined, key);
  assert.deepEqual(replay.body, first.body);
  assert.equal(tts.calls.length, callsBefore, "the stored answer was returned");
  const reused = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/narrations`, key, { storyBlockId: "b1" });
  assert.equal(reused.res.statusCode, 422);
  assert.equal(reused.body.error.code, "IDEMPOTENCY_KEY_REUSED");
});

test("without the key the answer is 503; at the daily limit it is 429 and nothing is spoken or stored", async () => {
  const id = await newSite("Sınırlı Han", [block("b1")]);
  const live = app.deps.tts;
  app.deps.tts = null;
  try {
    const off = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/narrations`);
    assert.equal(off.res.statusCode, 503);
    assert.equal(off.body.error.code, "SERVICE_UNAVAILABLE");
  } finally {
    app.deps.tts = live;
  }
  assert.equal((await rowsOf(id)).length, 0);

  const [usage] = await app.deps.db
    .select({ used: sql<number>`coalesce(sum((${auditLog.after}->>'chars')::int), 0)::int` })
    .from(auditLog)
    .where(and(eq(auditLog.action, NARRATION_ACTION), sql`${auditLog.at} > now() - interval '24 hours'`));
  const used = usage?.used ?? 0;
  const limit = app.deps.config.TTS_DAILY_CHAR_LIMIT;
  try {
    Object.assign(app.deps.config, { TTS_DAILY_CHAR_LIMIT: used + 10 });
    const calls = tts.calls.length;
    const capped = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/narrations`);
    assert.equal(capped.res.statusCode, 429, capped.res.body);
    assert.equal(capped.body.error.code, "RATE_LIMITED");
    assert.equal(tts.calls.length, calls);
    assert.equal((await rowsOf(id)).length, 0);
    assert.ok(used >= 0);
  } finally {
    Object.assign(app.deps.config, { TTS_DAILY_CHAR_LIMIT: limit });
  }
});

test("a failing provider is a 502 and leaves no half-saved recording", async () => {
  const id = await newSite("Arızalı Han", [block("b1")]);
  tts.fail = new Error("boom");
  try {
    const res = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/narrations`);
    assert.ok(res.res.statusCode >= 500, res.res.body);
  } finally {
    tts.fail = null;
  }
  assert.equal((await rowsOf(id)).length, 0);
});

test("translate fills only empty English fields, marks them machine, and skips what is already there; a save then marks the text reviewed only when it changed", async () => {
  const id = await newSite("Çeviri Hanı", [
    block("b1", { textEn: "Handwritten.", simple: "Han eskidir." }),
    block("b2", { text: "İkinci.", simple: "Kısa." }),
  ]);
  translator.calls.length = 0;

  const done = await call<Translated>("POST", `/v1/admin/sites/${id}/translate`);
  assert.equal(done.res.statusCode, 200, done.res.body);
  assert.deepEqual(translator.calls, [{ simple: "Han eskidir." }, { text: "İkinci.", simple: "Kısa." }]);
  const rows = await app.deps.db.select().from(storyBlocks).where(eq(storyBlocks.siteId, id));
  const b1 = rows.find((r) => r.id === "b1")!;
  const b2 = rows.find((r) => r.id === "b2")!;
  assert.equal(b1.textEn, "Handwritten.", "an existing translation is never overwritten");
  assert.equal(b1.textEnStatus, "reviewed");
  assert.deepEqual([b1.simpleEn, b1.simpleEnStatus], ["EN: Han eskidir.", "machine"]);
  assert.deepEqual([b2.textEn, b2.textEnStatus, b2.simpleEn, b2.simpleEnStatus], ["EN: İkinci.", "machine", "EN: Kısa.", "machine"]);

  const again = await call<Translated>("POST", `/v1/admin/sites/${id}/translate`);
  assert.equal(again.body.translated, 0);
  assert.equal(translator.calls.length, 2, "nothing is asked twice");

  // An unchanged machine text stays machine; an edited one becomes reviewed.
  const detail = await detailOf(id);
  const save = (edited: boolean) =>
    call<AdminSiteDetail>("PUT", `/v1/admin/sites/${id}/stories`, editor, {
      blocks: detail.stories.map((s) => ({ ...s, textEn: edited && s.id === "b2" ? "Second, edited." : s.textEn })),
    });
  assert.equal((await save(false)).res.statusCode, 200);
  const unchanged = (await app.deps.db.select().from(storyBlocks).where(and(eq(storyBlocks.siteId, id), eq(storyBlocks.id, "b2"))))[0]!;
  assert.deepEqual([unchanged.textEnStatus, unchanged.simpleEnStatus], ["machine", "machine"]);
  assert.equal((await save(true)).res.statusCode, 200);
  const edited = (await app.deps.db.select().from(storyBlocks).where(and(eq(storyBlocks.siteId, id), eq(storyBlocks.id, "b2"))))[0]!;
  assert.deepEqual([edited.textEn, edited.textEnStatus, edited.simpleEnStatus], ["Second, edited.", "reviewed", "machine"]);

  const live = app.deps.translator;
  app.deps.translator = null;
  try {
    const off = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/translate`);
    assert.equal(off.res.statusCode, 503);
  } finally {
    app.deps.translator = live;
  }
});

test("removing a sentence removes its recordings and their audio", async () => {
  const id = await newSite("Silinen Han", [block("b1"), block("b2")]);
  await narrate(id);
  const gone = (await rowsOf(id)).filter((r) => r.subjectId === "b2").map((r) => r.mediaId);
  assert.equal(gone.length, 4);
  const saved = await call("PUT", `/v1/admin/sites/${id}/stories`, editor, { blocks: [block("b1")] });
  assert.equal(saved.res.statusCode, 200, saved.res.body);
  assert.equal((await rowsOf(id)).length, 4);
  assert.deepEqual(await app.deps.db.select({ id: media.id }).from(media).where(inArray(media.id, gone)), []);
});
