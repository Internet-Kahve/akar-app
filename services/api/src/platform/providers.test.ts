import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../errors.ts";
import { geminiChat, KEY_COOLDOWN_MS } from "./chat-model.ts";
import { geminiTranslator } from "./translate.ts";
import { deepgramTts, DEFAULT_TTS_VOICES, parseVoiceModels } from "./tts.ts";

type Call = { url: string; init: RequestInit };

/** A fetch that answers from a script and records the requests; the network is never touched. */
function scripted(...answers: (Response | Error)[]): { fetchImpl: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = answers.shift();
    if (!next) throw new Error("no scripted answer left");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const gemini = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
const candidate = (value: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
const headersOf = (call: Call | undefined) => (call?.init.headers ?? {}) as Record<string, string>;
const isUpstreamFailure = (err: unknown) => err instanceof AppError && err.statusCode === 502 && err.code === "UPSTREAM_FAILED";

test("TTS_VOICES: the default has the four documented voices; a partial or malformed list is refused", () => {
  assert.deepEqual(parseVoiceModels(DEFAULT_TTS_VOICES), {
    "tr.female": "flux-dilek-tr",
    "tr.male": "flux-mehmet-tr",
    "en.female": "flux-sienna-en",
    "en.male": "flux-cliff-en",
  });
  assert.equal(typeof parseVoiceModels("tr.female=flux-dilek-tr"), "string");
  assert.equal(typeof parseVoiceModels(`${DEFAULT_TTS_VOICES},de.female=x`), "string");
  assert.equal(typeof parseVoiceModels("tr.female=a b,tr.male=x,en.female=y,en.male=z"), "string");
});

test("Deepgram: the text goes to the model in the query, the key in a header; failures are 502 without the key or body in the message", async () => {
  const { fetchImpl, calls } = scripted(new Response(Buffer.from("ID3audio")), new Response("secret-echo", { status: 401 }), new Error("socket hang up"));
  const tts = deepgramTts("dg-key", fetchImpl);

  const audio = await tts.synthesize({ text: "Merhaba", model: "flux-dilek-tr" });
  assert.equal(audio.toString(), "ID3audio");
  assert.equal(calls[0]?.url, "https://api.deepgram.com/v2/speak?model=flux-dilek-tr");
  assert.equal(headersOf(calls[0]).authorization, "Token dg-key");
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), { text: "Merhaba" });

  for (let failure = 0; failure < 2; failure++) {
    await assert.rejects(tts.synthesize({ text: "x", model: "m" }), (err: unknown) => {
      assert.ok(isUpstreamFailure(err));
      assert.ok(err instanceof AppError && !err.message.includes("dg-key") && !err.message.includes("secret-echo"));
      return true;
    });
  }
});

test("Gemini: one request per block with the glossary prompt and a JSON schema for the fields; a 429 is retried with a growing pause", async () => {
  const { fetchImpl, calls } = scripted(gemini({}, 429), gemini({}, 503), gemini(candidate({ text: "Hello", simple: "Hi" })));
  const pauses: number[] = [];
  const translator = geminiTranslator("gm-key", "gemini-test", fetchImpl, async (ms) => void pauses.push(ms));

  const out = await translator.translate({ text: "Merhaba", simple: "Selam" });
  assert.deepEqual(out, { text: "Hello", simple: "Hi" });
  assert.equal(calls.length, 3);
  assert.deepEqual(pauses, [2000, 4000]);
  assert.equal(calls[0]?.url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent");
  assert.equal(headersOf(calls[0])["x-goog-api-key"], "gm-key");
  const body = JSON.parse(String(calls[2]?.init.body));
  assert.match(body.systemInstruction.parts[0].text, /Ulucami/);
  assert.deepEqual(JSON.parse(body.contents[0].parts[0].text), { text: "Merhaba", simple: "Selam" });
  assert.deepEqual(body.generationConfig.responseSchema.required, ["text", "simple"]);
});

test("Gemini: part card fields (title, body) are translated under their own keys, and the plain-language hint is only sent with `simple`", async () => {
  const card = scripted(gemini(candidate({ title: "Dome", body: "The dome." })));
  assert.deepEqual(await geminiTranslator("k", "m", card.fetchImpl, async () => {}).translate({ title: "Kubbe", body: "Kubbe." }), { title: "Dome", body: "The dome." });
  const sent = JSON.parse(String(card.calls[0]?.init.body));
  assert.deepEqual(sent.generationConfig.responseSchema.required, ["title", "body"]);
  assert.doesNotMatch(sent.systemInstruction.parts[0].text, /simple/);
});

test("Gemini: only the asked fields are sent; a persistent 429 ends as 502 after the bounded retries; a reply without the fields is refused", async () => {
  const only = scripted(gemini(candidate({ simple: "Hi" })));
  assert.deepEqual(await geminiTranslator("k", "m", only.fetchImpl, async () => {}).translate({ simple: "Selam" }), { simple: "Hi" });
  const sent = JSON.parse(String(only.calls[0]?.init.body));
  assert.deepEqual(Object.keys(JSON.parse(sent.contents[0].parts[0].text)), ["simple"]);

  const limited = scripted(gemini({}, 429), gemini({}, 429), gemini({}, 429), gemini({}, 429), gemini({}, 429));
  await assert.rejects(geminiTranslator("k", "m", limited.fetchImpl, async () => {}).translate({ text: "x" }), isUpstreamFailure);
  assert.equal(limited.calls.length, 4, "the first request and three retries");

  const empty = scripted(gemini(candidate({ text: "  " })));
  await assert.rejects(geminiTranslator("k", "m", empty.fetchImpl, async () => {}).translate({ text: "x" }), isUpstreamFailure);
});

const prompt = { system: "S", history: [{ role: "assistant" as const, text: "Önce" }], message: "Soru" };
const keyOf = (call: Call | undefined) => headersOf(call)["x-goog-api-key"];

test("chat: a key at its limit rests for a minute and the same question goes to the next key; all resting = 429 without a request", async () => {
  let clock = 0;
  const answer = gemini(candidate({ answer: "Yanıt", refs: ["s1"], general: false }));
  const { fetchImpl, calls } = scripted(gemini({}, 429), answer, gemini(candidate({ answer: "B", refs: [], general: true })), gemini({}, 503), gemini(candidate({ answer: "C", refs: [], general: false })));
  const model = geminiChat(["k1", "k2", "k3"], "flash-lite", fetchImpl, () => clock);

  assert.deepEqual(await model.reply(prompt), { answer: "Yanıt", refs: ["s1"], general: false });
  assert.deepEqual(calls.map(keyOf), ["k1", "k2"]);
  const body = JSON.parse(String(calls[0]?.init.body));
  assert.deepEqual(body.contents.map((c: { role: string }) => c.role), ["model", "user"]);
  assert.equal(body.systemInstruction.parts[0].text, "S");

  // Next turn starts at k2; k1 is still resting, so k2 answers, then k3 hits 503 and k2 takes it again.
  assert.equal((await model.reply(prompt)).general, true);
  assert.equal((await model.reply(prompt)).answer, "C");
  assert.deepEqual(calls.slice(2).map(keyOf), ["k2", "k3", "k2"]);

  const busy = scripted(gemini({}, 429), gemini({}, 429));
  const two = geminiChat(["a", "b"], "m", busy.fetchImpl, () => clock);
  await assert.rejects(two.reply(prompt), (err: unknown) => err instanceof AppError && err.statusCode === 429);
  await assert.rejects(two.reply(prompt), (err: unknown) => err instanceof AppError && err.statusCode === 429);
  assert.equal(busy.calls.length, 2, "resting keys are not called");

  clock += KEY_COOLDOWN_MS + 1;
  const rested = scripted(gemini(candidate({ answer: "Tekrar", refs: [], general: false })));
  const again = geminiChat(["a"], "m", rested.fetchImpl, () => clock);
  assert.equal((await again.reply(prompt)).answer, "Tekrar");
});

test("chat: other failures are 502 without the key in the message; an empty answer is refused", async () => {
  const { fetchImpl } = scripted(new Response("secret-echo", { status: 400 }), gemini(candidate({ answer: " ", refs: [], general: false })), new Error("socket"));
  const model = geminiChat(["gm-key"], "m", fetchImpl);
  for (let i = 0; i < 3; i++) {
    await assert.rejects(model.reply(prompt), (err: unknown) => isUpstreamFailure(err) && err instanceof AppError && !err.message.includes("gm-key") && !err.message.includes("secret-echo"));
  }
});
