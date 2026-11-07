import type { HeritageSite } from "@akar/domain";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import type { App } from "../../app.ts";
import type { Db } from "../../db/client.ts";
import { usageDaily } from "../../db/schema/index.ts";
import { loadCatalog } from "../../db/seed.ts";
import { AppError } from "../../errors.ts";
import { authHeader } from "../../test/auth.ts";
import { fakeChat } from "../../test/fakes.ts";
import { startTestApp } from "../../test/harness.ts";
import { CHAT_PER_MINUTE } from "./routes.ts";
import type { ChatResponse } from "./schemas.ts";

const site = (
  id: string,
  name: string,
  status: HeritageSite["status"] = "published",
): HeritageSite => ({
  id,
  name,
  city: "Bursa",
  district: "Osmangazi",
  year: "1399",
  architect: "Ali Neccar",
  kind: "cami",
  coordinates: [29.06, 40.18],
  minutes: 2,
  description: `${name} açıklaması`,
  status,
  stories: [
    {
      id: `${id}-s1`,
      title: "Yapım",
      text: "Yıldırım Bayezid 1396'da yaptırmaya başladı.",
      simple: "Sade",
      trust: "verified",
    },
    {
      id: `${id}-s2`,
      title: "Minber",
      text: "Minber ceviz ağacındandır.",
      simple: "Sade",
      trust: "verified",
    },
  ],
  source: "test",
  tier: "Tier 2",
});

const chat = fakeChat();
let app: App;
let db: Db;
let stop: (() => Promise<void>) | undefined;

before(async () => {
  ({ app, stop } = await startTestApp({
    chat,
    env: { CHAT_DAILY_LIMIT: "2" },
  }));
  db = app.deps.db;
  await loadCatalog(db, {
    sites: [
      site("ulu-cami", "Ulu Cami"),
      site("koza-han", "Koza Han"),
      site("taslak", "Taslak Eser", "draft"),
    ],
    routes: [],
  });
});
after(async () => {
  await stop?.();
});
beforeEach(async () => {
  await db.delete(usageDaily);
  chat.calls.length = 0;
  chat.fail = null;
  chat.searchCalls.length = 0;
  chat.searchFail = null;
  chat.searchNext = { answer: "Web", refs: [], sources: [] };
  chat.next = { answer: "Yanıt", refs: [], general: false };
});

// A new account per test: the per-minute limit counts per account and would carry over between tests.
let user: Record<string, string> = {};
let n = 0;
beforeEach(() => {
  user = authHeader({ id: `u-${++n}`, role: "user" });
});
const ask = (payload: object, headers?: Record<string, string>) =>
  app.inject({
    method: "POST",
    url: "/v1/chat",
    payload,
    headers: headers ?? user,
  });
const counted = async () =>
  (await db.select().from(usageDaily)).reduce(
    (n, r) => (r.event === "chat.message" ? n + r.count : n),
    0,
  );

test("guests get 401 and the model is not called", async () => {
  const res = await ask({ message: "Ulu Cami ne zaman yapıldı?" }, {});
  assert.equal(res.statusCode, 401);
  assert.equal(chat.calls.length, 0);
});

test("on a site page the site's sentences are the context; cited keys come back as sources, made-up keys are dropped", async () => {
  chat.next = {
    answer: "1396'da başladı.",
    refs: ["s1", "s1", "x9"],
    general: false,
  };
  const res = await ask({
    message: "Ne zaman yapıldı?",
    siteId: "ulu-cami",
    history: [
      { role: "user", text: "Merhaba" },
      { role: "assistant", text: "Merhaba!" },
    ],
  });
  assert.equal(res.statusCode, 200);
  const body = res.json<ChatResponse>();
  assert.deepEqual(body, {
    answer: "1396'da başladı.",
    general: false,
    sources: [
      { kind: "story", siteId: "ulu-cami", title: "Yapım", source: null },
    ],
  });
  const prompt = chat.calls[0]!;
  assert.match(prompt.system, /\[s1\] Hikâye: Yapım: Yıldırım Bayezid 1396'da/);
  assert.doesNotMatch(prompt.system, /Koza Han/);
  assert.equal(prompt.message, "Ne zaman yapıldı?");
  assert.deepEqual(
    prompt.history.map((t) => t.role),
    ["user", "assistant"],
  );
  assert.equal(await counted(), 1);
  assert.equal(chat.searchCalls.length, 0);
});

test("without a site the published catalog is the context; drafts stay out; English asks for an English answer", async () => {
  chat.next = { answer: "Two sites.", refs: ["c1", "c2"], general: true };
  const body = (
    await ask({ message: "Which sites are there?", lang: "en" })
  ).json<ChatResponse>();
  assert.equal(body.general, true);
  assert.deepEqual(body.sources.map((s) => s.siteId).sort(), [
    "koza-han",
    "ulu-cami",
  ]);
  assert.match(chat.calls[0]!.system, /İngilizce/);
  assert.doesNotMatch(chat.calls[0]!.system, /Taslak Eser/);
  assert.match(chat.calls[0]!.system, /Minber ceviz ağacındandır/);
});

test("an unpublished or unknown site is 404 before the model is asked", async () => {
  assert.equal(
    (await ask({ message: "Soru", siteId: "taslak" })).statusCode,
    404,
  );
  assert.equal((await ask({ message: "Soru", siteId: "yok" })).statusCode, 404);
  assert.equal(chat.calls.length, 0);
});

test("the shared daily cap answers 429 without calling the model; a failed answer is not counted", async () => {
  chat.fail = new AppError(502, "UPSTREAM_FAILED", "x");
  assert.equal((await ask({ message: "Soru" })).statusCode, 502);
  assert.equal(await counted(), 0);
  chat.fail = null;
  assert.equal((await ask({ message: "Soru" })).statusCode, 200);
  assert.equal((await ask({ message: "Soru" })).statusCode, 200);
  const calls = chat.calls.length;
  const res = await ask({ message: "Soru" });
  assert.equal(res.statusCode, 429);
  assert.equal(res.json().error.code, "RATE_LIMITED");
  assert.equal(chat.calls.length, calls);
});

test("clients cannot send `chat.message` through /v1/events (it would move the cap)", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/v1/events",
    payload: { events: [{ event: "chat.message" }] },
    headers: user,
  });
  assert.equal(res.json().accepted, 0);
  assert.equal(await counted(), 0);
});

test("messages over 500 characters and more than 10 history turns are refused", async () => {
  assert.equal((await ask({ message: "a".repeat(501) })).statusCode, 400);
  assert.equal(
    (
      await ask({
        message: "Soru",
        history: Array.from({ length: 11 }, () => ({
          role: "user",
          text: "x",
        })),
      })
    ).statusCode,
    400,
  );
  assert.equal(chat.calls.length, 0);
});

test(`one account gets ${CHAT_PER_MINUTE} questions a minute; another account is not held back`, async () => {
  chat.fail = new AppError(502, "UPSTREAM_FAILED", "x"); // not counted, so the daily cap stays out of the way
  for (let i = 0; i < CHAT_PER_MINUTE; i++)
    assert.equal((await ask({ message: "Soru" })).statusCode, 502);
  assert.equal((await ask({ message: "Soru" })).statusCode, 429);
  assert.equal(
    (await ask({ message: "Soru" }, authHeader({ id: "other", role: "user" })))
      .statusCode,
    502,
  );
});

test("insufficient local evidence triggers web search once, cites local and web sources, and counts one answer", async () => {
  chat.next = {
    answer: "Minber cevizdendir; restorasyon bilgisi yok.",
    refs: ["s2"],
    general: false,
    needsWeb: true,
  };
  chat.searchNext = {
    answer: "Minber cevizdendir [s2]. Restorasyon kaydı müzededir.",
    refs: ["s2", "madeup"],
    sources: [{ title: "Müze", url: "https://museum.example/history" }],
    searchSuggestions: "<div>Google</div>",
  };
  const response = await ask({
    message: "Minber ve restorasyonu?",
    siteId: "ulu-cami",
  });
  assert.equal(response.statusCode, 200);
  const body = response.json<ChatResponse>();
  assert.equal(chat.searchCalls.length, 1);
  assert.match(chat.searchCalls[0]!.system, /Öncelik yine Akar metinlerinde/);
  assert.equal(body.general, true);
  assert.deepEqual(
    body.sources.map((s) => s.kind),
    ["story", "web"],
  );
  assert.equal(body.sources[1]?.url, "https://museum.example/history");
  assert.doesNotMatch(body.answer, /\[s2\]/);
  assert.equal(body.searchSuggestions, "<div>Google</div>");
  assert.equal(await counted(), 1);
});

test("a failed or unsourced web lookup preserves the local answer with an explicit availability note", async () => {
  chat.next = {
    answer: "Yerel yanıt; ek ayrıntı yok.",
    refs: ["s1"],
    general: false,
    needsWeb: true,
  };
  chat.searchFail = new Error("provider failed");
  const body = (
    await ask({ message: "Ayrıntı?", siteId: "ulu-cami" })
  ).json<ChatResponse>();
  assert.equal(body.answer, chat.next.answer);
  assert.equal(body.webUnavailable, true);
  assert.equal(body.general, false);
  assert.equal(body.sources.length, 1);
  assert.equal(await counted(), 1);
  chat.searchFail = null;
  const noSources = (
    await ask({ message: "Ayrıntı?", siteId: "ulu-cami" })
  ).json<ChatResponse>();
  assert.equal(noSources.webUnavailable, true);
  assert.equal(noSources.answer, chat.next.answer);
});
