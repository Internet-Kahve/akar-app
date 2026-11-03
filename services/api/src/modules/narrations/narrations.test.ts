import { and, eq, inArray, sql } from "drizzle-orm";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { App } from "../../app.ts";
import { auditLog, cities, media, narrations, sitePartCards, sources, storyBlocks } from "../../db/schema/index.ts";
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
  await app.deps.db.insert(media).values({ id: "m-1", kind: "model", mime: "model/gltf-binary", url: "https://cdn.test/m-1.glb", license: "CC0", trust: "verified", title: "Model 1", bytes: 2048, parts: ["kubbe", "minare"] });
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

const card = (id: string, over: Record<string, unknown> = {}) => ({ id, parts: ["kubbe"], title: "Kubbe", body: "Orta kubbe 1491'de yapıldı.", photoIds: [], trust: "verified", ...over });

/** A draft site with a model and the given part cards (and no story). */
async function newCardSite(name: string, cards: object[]): Promise<string> {
  const id = await newSite(name, []);
  assert.equal((await call("PUT", `/v1/admin/sites/${id}/model`, editor, { mediaId: "m-1" })).res.statusCode, 200);
  const saved = await call<AdminSiteDetail>("PUT", `/v1/admin/sites/${id}/part-cards`, editor, { cards });
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

test("part cards are voiced like sentences: the body in a female and a male voice per language, never the simple variant, current ones only", async () => {
  const id = await newCardSite("Kartlı Han", [card("pk1-1", { titleEn: "Dome", bodyEn: "The central dome was built in 1491." }), card("pk1-2", { title: "Minare", body: "Tuğla minare.", parts: ["minare"] })]);
  tts.calls.length = 0;

  const first = await narrate(id);
  assert.equal(first.res.statusCode, 200, first.res.body);
  // pk1-1: Turkish and English body, a female and a male voice each (4); pk1-2: Turkish only (2). The title is never read.
  assert.deepEqual(first.body, { generated: 6, skipped: 0, stale: 0 });
  assert.equal(tts.calls.length, 6);
  assert.ok(!tts.calls.some((c) => c.text.includes("Dome") || c.text.includes("Minare")), "titles are not spoken");
  const rows = await rowsOf(id);
  assert.ok(rows.every((r) => r.subjectType === "part_card" && r.variant === "text"));
  assert.equal(rows.find((r) => r.subjectId === "pk1-1" && r.lang === "tr" && r.voice === "female")?.textHash, narrationHash(models["tr.female"]!, spokenText("tr", "Orta kubbe 1491'de yapıldı.")));

  const detail = await detailOf(id);
  const pk1 = detail.partCards.find((c) => c.id === "pk1-1")!;
  assert.deepEqual(pk1.narrations.map((n) => [n.lang, n.variant, n.voice]), [
    ["tr", "text", "female"],
    ["tr", "text", "male"],
    ["en", "text", "female"],
    ["en", "text", "male"],
  ]);
  assert.equal(detail.partCards.find((c) => c.id === "pk1-2")?.narrations.length, 2);
  assert.equal(detail.has.audio, true);
  const files = new Set(detail.media.filter((m) => m.kind === "audio").map((m) => m.id));
  assert.ok(pk1.narrations.every((n) => files.has(n.mediaId)), "the audio files are in the media list");

  tts.calls.length = 0;
  const second = await narrate(id);
  assert.deepEqual(second.body, { generated: 0, skipped: 6, stale: 0 });
  assert.equal(tts.calls.length, 0);

  // The Turkish body of pk1-2 changes: its recordings are stale and not listed until regenerated; pk1-1 is untouched.
  const oldMedia = rows.filter((r) => r.subjectId === "pk1-2").map((r) => r.mediaId);
  const saved = await call("PUT", `/v1/admin/sites/${id}/part-cards`, editor, { cards: [card("pk1-1", { titleEn: "Dome", bodyEn: "The central dome was built in 1491." }), card("pk1-2", { title: "Minare", body: "Taş minare.", parts: ["minare"] })] });
  assert.equal(saved.res.statusCode, 200, saved.res.body);
  const stale = await detailOf(id);
  assert.equal(stale.partCards.find((c) => c.id === "pk1-2")?.narrations.length, 0, "stale recordings are not listed");
  assert.equal(stale.partCards.find((c) => c.id === "pk1-1")?.narrations.length, 4);
  const third = await narrate(id);
  assert.deepEqual(third.body, { generated: 2, skipped: 4, stale: 2 });
  assert.deepEqual(await app.deps.db.select({ id: media.id }).from(media).where(inArray(media.id, oldMedia)), [], "the replaced audio is gone");
  assert.equal((await detailOf(id)).partCards.find((c) => c.id === "pk1-2")?.narrations.length, 2);

  // One card only; the audit row names the card.
  tts.calls.length = 0;
  const one = await narrate(id, { partCardId: "pk1-1" });
  assert.deepEqual(one.body, { generated: 0, skipped: 4, stale: 0 });
  await app.deps.db.update(sitePartCards).set({ body: "Başka." }).where(eq(sitePartCards.id, "pk1-1"));
  const again = await narrate(id, { partCardId: "pk1-1" });
  assert.deepEqual(again.body, { generated: 2, skipped: 2, stale: 2 });
  assert.deepEqual([...new Set(tts.calls.map((c) => c.text))], ["Başka."]);
  const audit = await app.deps.db.select().from(auditLog).where(and(eq(auditLog.entityId, id), eq(auditLog.action, NARRATION_ACTION)));
  assert.ok(audit.every((a) => (a.after as { partCardId?: string }).partCardId !== undefined && (a.after as { storyBlockId?: string }).storyBlockId === undefined));
});

test("without an id the whole site is voiced and translated: sentences and cards", async () => {
  const id = await newCardSite("Karma Han", [card("pk2-1")]);
  assert.equal((await call("PUT", `/v1/admin/sites/${id}/stories`, editor, { blocks: [block("b1")] })).res.statusCode, 200);
  tts.calls.length = 0;
  const all = await narrate(id);
  assert.deepEqual(all.body, { generated: 6, skipped: 0, stale: 0 }, "b1 text + simple in Turkish (4) and the card (2)");
  const only = await narrate(id, { storyBlockId: "b1" });
  assert.deepEqual(only.body, { generated: 0, skipped: 4, stale: 0 });

  translator.calls.length = 0;
  const done = await call<Translated>("POST", `/v1/admin/sites/${id}/translate`);
  assert.deepEqual(done.body, { translated: 2, skipped: 0 });
  assert.deepEqual(translator.calls, [{ text: "Han 1491'de yapıldı.", simple: "Han eskidir." }, { title: "Kubbe", body: "Orta kubbe 1491'de yapıldı." }]);
});

test("translating a card fills only its empty English fields, marks them machine and audits the card", async () => {
  const id = await newCardSite("Çeviri Kartı Hanı", [card("pk3-1", { titleEn: "Handwritten dome" }), card("pk3-2", { title: "Minare", body: "Tuğla minare.", parts: ["minare"] }), card("pk3-3", { titleEn: "Done", bodyEn: "Done too." })]);
  translator.calls.length = 0;

  const done = await call<Translated>("POST", `/v1/admin/sites/${id}/translate`);
  assert.equal(done.res.statusCode, 200, done.res.body);
  assert.deepEqual(done.body, { translated: 2, skipped: 1 });
  assert.deepEqual(translator.calls, [{ body: "Orta kubbe 1491'de yapıldı." }, { title: "Minare", body: "Tuğla minare." }], "one request per card, only the empty fields");
  const rows = await app.deps.db.select().from(sitePartCards).where(eq(sitePartCards.siteId, id));
  const pick = (cardId: string) => {
    const r = rows.find((x) => x.id === cardId)!;
    return [r.titleEn, r.titleEnStatus, r.bodyEn, r.bodyEnStatus];
  };
  assert.deepEqual(pick("pk3-1"), ["Handwritten dome", "reviewed", "EN: Orta kubbe 1491'de yapıldı.", "machine"]);
  assert.deepEqual(pick("pk3-2"), ["EN: Minare", "machine", "EN: Tuğla minare.", "machine"]);
  assert.deepEqual(pick("pk3-3"), ["Done", "reviewed", "Done too.", "reviewed"]);
  const audit = await app.deps.db.select().from(auditLog).where(and(eq(auditLog.entityId, id), eq(auditLog.action, "partCard.translate")));
  assert.deepEqual(audit.map((a) => (a.after as { partCardId: string }).partCardId).sort(), ["pk3-1", "pk3-2"]);

  translator.calls.length = 0;
  const again = await call<Translated>("POST", `/v1/admin/sites/${id}/translate`, editor, { partCardId: "pk3-2" });
  assert.deepEqual(again.body, { translated: 0, skipped: 1 });
  assert.equal(translator.calls.length, 0, "nothing is asked twice");
  // The detail reports the English texts and their status.
  const detail = await detailOf(id);
  const pk2 = detail.partCards.find((c) => c.id === "pk3-2")!;
  assert.deepEqual([pk2.titleEn, pk2.titleEnStatus, pk2.bodyEnStatus], ["EN: Minare", "machine", "machine"]);
});

test("storyBlockId and partCardId together are a 400; an unknown card is a 404; each id only reaches its own kind", async () => {
  const id = await newCardSite("Kimlik Hanı", [card("pk4-1")]);
  assert.equal((await call("PUT", `/v1/admin/sites/${id}/stories`, editor, { blocks: [block("b1")] })).res.statusCode, 200);
  tts.calls.length = 0;
  translator.calls.length = 0;
  for (const path of ["narrations", "translate"]) {
    const both = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/${path}`, editor, { storyBlockId: "b1", partCardId: "pk4-1" });
    assert.equal(both.res.statusCode, 400, path);
    assert.ok(both.body.error.fieldErrors["_"], path);
    const unknown = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/${path}`, editor, { partCardId: "yok" });
    assert.equal(unknown.res.statusCode, 404, path);
    assert.equal(unknown.body.error.message, "Parça kartı bulunamadı.");
    const wrongKind = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/${path}`, editor, { partCardId: "b1" });
    assert.equal(wrongKind.res.statusCode, 404, path);
    const story = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/${path}`, editor, { storyBlockId: "pk4-1" });
    assert.equal(story.res.statusCode, 404, path);
    assert.equal(story.body.error.message, "Hikâye cümlesi bulunamadı.");
  }
  assert.equal(tts.calls.length, 0);
  assert.equal(translator.calls.length, 0);
  assert.equal((await rowsOf(id)).length, 0);
});

test("removing a part card removes its recordings and their audio, and keeps the other cards'", async () => {
  const id = await newCardSite("Silinen Kart Hanı", [card("pk5-1"), card("pk5-2", { title: "Minare", body: "Minare metni.", parts: ["minare"] })]);
  await narrate(id);
  const gone = (await rowsOf(id)).filter((r) => r.subjectId === "pk5-2").map((r) => r.mediaId);
  assert.equal(gone.length, 2);
  const saved = await call("PUT", `/v1/admin/sites/${id}/part-cards`, editor, { cards: [card("pk5-1")] });
  assert.equal(saved.res.statusCode, 200, saved.res.body);
  const left = await rowsOf(id);
  assert.deepEqual([...new Set(left.map((r) => r.subjectId))], ["pk5-1"]);
  assert.equal(left.length, 2);
  assert.deepEqual(await app.deps.db.select({ id: media.id }).from(media).where(inArray(media.id, gone)), []);
  // Removing every card clears the rest.
  await call("PUT", `/v1/admin/sites/${id}/part-cards`, editor, { cards: [] });
  assert.equal((await rowsOf(id)).length, 0);
});

const readingLists = { summary: [], figures: [], quotes: [], timeline: [], terms: [] };
const paragraph = (id: string | undefined, body: string, bodyEn: string) => ({ ...(id && { id }), kind: "history", title: "Tarihçe", body, bodyEn, trust: "verified" });
const aboutBody = (chapter: string, sections: object[]) => ({ chapters: [{ id: chapter, title: "Tarihçe", titleEn: "History", kind: "history", ...readingLists, sections }], looseSections: [] });

/** A draft site with a chapter «Tarihçe» holding a paragraph, an inscription with its meaning and one without. */
async function newAboutSite(name: string): Promise<{ id: string; sections: string[]; chapter: string }> {
  const id = await newSite(name, []);
  const chapter = `chapter-${id}`;
  const saved = await call<AdminSiteDetail>(
    "PUT",
    `/v1/admin/sites/${id}/about`,
    editor,
    aboutBody(chapter, [
      paragraph(undefined, "Han 1491'de yapıldı.", "The inn was built in 1491."),
      paragraph(undefined, "“Bismillâh” Mealen: Allah'ın adıyla.", "“Bismillâh” Meaning: In the name of God."),
      paragraph(undefined, "“Yalnız yazı”", "“Only the wording”"),
    ]),
  );
  assert.equal(saved.res.statusCode, 200, saved.res.body);
  return { id, sections: saved.body.sections.map((s) => s.id), chapter };
}

test("«Eser hakkında» is voiced per chapter title and paragraph; an inscription reads only its meaning, and one without a meaning is not voiced", async () => {
  const { id, sections, chapter } = await newAboutSite("Okunan Han");
  tts.calls.length = 0;
  const run = await narrate(id);
  assert.equal(run.res.statusCode, 200, run.res.body);
  assert.equal(run.body.generated, 12);
  const spoken = new Set(tts.calls.map((c) => c.text));
  assert.deepEqual([...spoken].sort(), ["Allah'ın adıyla.", "Han bin dört yüz doksan birde yapıldı.", "History", "In the name of God.", "Tarihçe", "The inn was built in 1491."].sort());
  const rows = await rowsOf(id);
  assert.deepEqual(new Set(rows.map((r) => `${r.subjectType}:${r.subjectId}`)), new Set([`about_chapter:${chapter}`, `about_section:${sections[0]}`, `about_section:${sections[1]}`]));

  const detail = await call<{ sections: Array<{ id: string; narrations: unknown[] }>; chapters: Array<{ narrations: unknown[] }> }>("GET", `/v1/admin/sites/${id}`);
  assert.deepEqual(detail.body.sections.map((s) => s.narrations.length), [4, 4, 0]);
  assert.equal(detail.body.chapters[0]!.narrations.length, 4);

  // One paragraph is a target of its own; a changed text replaces only its recordings.
  await call("PUT", `/v1/admin/sites/${id}/about`, editor,
    aboutBody(chapter, [
      paragraph(sections[0], "Han 1492'de yapıldı.", "The inn was built in 1492."),
      paragraph(sections[1], "“Bismillâh” Mealen: Allah'ın adıyla.", "“Bismillâh” Meaning: In the name of God."),
      paragraph(sections[2], "“Yalnız yazı”", "“Only the wording”"),
    ]),
  );
  const one = await narrate(id, { aboutSectionId: sections[0] });
  assert.deepEqual(one.body, { generated: 4, skipped: 0, stale: 4 });
  const unknown = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/narrations`, editor, { aboutChapterId: "yok" });
  assert.equal(unknown.res.statusCode, 404);
});

test("removing a paragraph or a chapter removes its recordings and their audio; about texts are never machine translated", async () => {
  const { id, sections, chapter } = await newAboutSite("Silinen Paragraf Hanı");
  await narrate(id);
  const gone = (await rowsOf(id)).filter((r) => r.subjectId === sections[1]).map((r) => r.mediaId);
  assert.equal(gone.length, 4);
  const saved = await call("PUT", `/v1/admin/sites/${id}/about`, editor,
    aboutBody(chapter, [paragraph(sections[0], "Han 1491'de yapıldı.", "The inn was built in 1491.")]),
  );
  assert.equal(saved.res.statusCode, 200, saved.res.body);
  assert.equal((await rowsOf(id)).filter((r) => r.subjectType === "about_section").length, 4);
  assert.deepEqual(await app.deps.db.select({ id: media.id }).from(media).where(inArray(media.id, gone)), []);
  // A chapter left out takes the recordings of its title (its paragraphs go with it unless sent again).
  assert.equal((await rowsOf(id)).filter((r) => r.subjectType === "about_chapter").length, 4);
  const emptied = await call("PUT", `/v1/admin/sites/${id}/about`, editor, { chapters: [], looseSections: [] });
  assert.equal(emptied.res.statusCode, 200, emptied.res.body);
  assert.equal((await rowsOf(id)).filter((r) => r.subjectType.startsWith("about_")).length, 0);
  assert.equal((await rowsOf(id)).length, 0);

  translator.calls.length = 0;
  const translate = await call<ErrorBody>("POST", `/v1/admin/sites/${id}/translate`, editor, { aboutSectionId: sections[0] });
  assert.equal(translate.res.statusCode, 400);
  assert.equal(translator.calls.length, 0);
});
