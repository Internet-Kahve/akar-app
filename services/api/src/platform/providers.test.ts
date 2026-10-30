import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "../errors.ts";
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
