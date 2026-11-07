import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig } from "../config.ts";
import { AppError } from "../errors.ts";
import {
  chatModelFromConfig,
  chatModels,
  FREE_CHAT_MODELS,
  geminiChat,
  KEY_COOLDOWN_MS,
} from "./chat-model.ts";

const prompt = {
  system: "Eser kaynakları",
  history: [{ role: "user" as const, text: "Önceki soru" }],
  message: "Ne zaman yapıldı?",
};
const success = () =>
  Response.json({
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                answer: "1399",
                refs: ["s1"],
                general: false,
              }),
            },
          ],
        },
      },
    ],
  });
const limited = (status = 429, headers?: HeadersInit, retryDelay?: string) =>
  Response.json(
    {
      error: {
        details: retryDelay
          ? [
              {
                "@type": "type.googleapis.com/google.rpc.RetryInfo",
                retryDelay,
              },
            ]
          : [],
      },
    },
    { status, ...(headers && { headers }) },
  );
function script(...responses: Response[]) {
  const calls: {
    model: string;
    key: string;
    body: string;
    signal: AbortSignal | null | undefined;
  }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({
      model: String(input).split("/models/")[1]!.split(":")[0]!,
      key: new Headers(init?.headers).get("x-goog-api-key")!,
      body: String(init?.body),
      signal: init?.signal,
    });
    const response = responses.shift();
    assert.ok(response, "unexpected extra upstream attempt");
    return response;
  };
  return { fetchImpl, calls };
}
const config = (extra: Record<string, string> = {}) =>
  loadConfig({
    NODE_ENV: "test",
    DATABASE_URL: "postgres://local/db",
    ...extra,
  });
const rateLimited = (e: unknown) =>
  e instanceof AppError && e.statusCode === 429;
const upstreamFailed = (e: unknown) =>
  e instanceof AppError && e.statusCode === 502;

test("default config tries only 3.5, 3.1 and 2.5 Flash-Lite with the exact same question", async (t) => {
  const transport = script(limited(), limited(503), success());
  t.mock.method(globalThis, "fetch", transport.fetchImpl);
  const model = chatModelFromConfig(config({ GEMINI_API_KEY: "test-key" }));
  assert.ok(model);
  assert.deepEqual(await model.reply(prompt), {
    answer: "1399",
    refs: ["s1"],
    general: false,
  });
  assert.deepEqual(
    transport.calls.map((c) => c.model),
    ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"],
  );
  assert.deepEqual(
    transport.calls.map((c) => c.key),
    ["test-key", "test-key", "test-key"],
  );
  assert.equal(
    new Set(transport.calls.map((c) => c.body)).size,
    1,
    "history, system context, question and response schema survive fallback",
  );
  assert.equal(
    new Set(transport.calls.map((c) => c.signal)).size,
    1,
    "all attempts share one total timeout",
  );
  const body = JSON.parse(transport.calls[0]!.body);
  assert.equal(body.systemInstruction.parts[0].text, prompt.system);
  assert.equal(body.contents.at(-1).parts[0].text, prompt.message);
});

test("each model tries the available keys before lowering quality; cooldowns do not block a key on another model", async () => {
  const transport = script(limited(), limited(), success(), success());
  const model = geminiChat(
    ["a", "b"],
    ["strong", "small"],
    transport.fetchImpl,
    () => 0,
  );
  await model.reply(prompt);
  await model.reply(prompt);
  assert.deepEqual(
    transport.calls.map((c) => [c.model, c.key]),
    [
      ["strong", "a"],
      ["strong", "b"],
      ["small", "a"],
      ["small", "b"],
    ],
  );
});

test("a recovered top model is preferred again on the same provider instance", async () => {
  let clock = 0;
  const transport = script(limited(), success(), success(), success());
  const model = geminiChat(
    ["a"],
    ["strong", "small"],
    transport.fetchImpl,
    () => clock,
  );
  await model.reply(prompt);
  clock = KEY_COOLDOWN_MS - 1;
  await model.reply(prompt);
  clock = KEY_COOLDOWN_MS;
  await model.reply(prompt);
  assert.deepEqual(
    transport.calls.map((c) => c.model),
    ["strong", "small", "small", "strong"],
  );
});

for (const retry of [
  {
    name: "HTTP seconds",
    response: () => limited(429, { "retry-after": "120" }),
  },
  {
    name: "HTTP date",
    response: () =>
      limited(429, { "retry-after": new Date(120_000).toUTCString() }),
  },
  { name: "Google RetryInfo", response: () => limited(429, undefined, "120s") },
]) {
  test(`cooldown respects ${retry.name} beyond the default minute`, async () => {
    let clock = 0;
    const transport = script(retry.response(), success(), success(), success());
    const model = geminiChat(
      ["a"],
      ["strong", "small"],
      transport.fetchImpl,
      () => clock,
    );
    await model.reply(prompt);
    clock = 119_999;
    await model.reply(prompt);
    clock = 120_000;
    await model.reply(prompt);
    assert.deepEqual(
      transport.calls.map((c) => c.model),
      ["strong", "small", "small", "strong"],
    );
  });
}

test("all exhausted models return 429, without repeatedly calling cooling models; expiry permits recovery", async () => {
  let clock = 0;
  const transport = script(limited(), limited(503), success());
  const model = geminiChat(
    ["a"],
    ["strong", "small"],
    transport.fetchImpl,
    () => clock,
  );
  await assert.rejects(model.reply(prompt), rateLimited);
  await assert.rejects(model.reply(prompt), rateLimited);
  assert.equal(transport.calls.length, 2);
  clock += KEY_COOLDOWN_MS;
  assert.equal((await model.reply(prompt)).answer, "1399");
});

test("an unavailable model does not prevent a lower model from answering; all unavailable means 502", async () => {
  const transport = script(limited(404), success(), success());
  const model = geminiChat(
    ["a"],
    ["new", "stable"],
    transport.fetchImpl,
    () => 0,
  );
  await model.reply(prompt);
  await model.reply(prompt);
  assert.deepEqual(
    transport.calls.map((c) => c.model),
    ["new", "stable", "stable"],
  );
  const missing = script(limited(404), limited(404));
  const none = geminiChat(["a"], ["new", "stable"], missing.fetchImpl, () => 0);
  await assert.rejects(none.reply(prompt), upstreamFailed);
  await assert.rejects(none.reply(prompt), upstreamFailed);
  assert.equal(missing.calls.length, 2);
});

test("authentication and invalid requests fail without consuming every fallback or leaking upstream text", async () => {
  for (const status of [400, 401, 403]) {
    const transport = script(
      new Response("secret-echo", { status }),
      success(),
    );
    const model = geminiChat(
      ["secret-key"],
      ["strong", "small"],
      transport.fetchImpl,
    );
    await assert.rejects(
      model.reply(prompt),
      (e: unknown) =>
        upstreamFailed(e) && e instanceof Error && !/secret/.test(e.message),
    );
    assert.equal(transport.calls.length, 1);
  }
});

test("model configuration preserves explicit pins, deduplicates fallbacks and permits disabling the ladder", () => {
  assert.equal(config().GEMINI_CHAT_MODEL, "gemini-3.5-flash-lite");
  assert.deepEqual(chatModels(config().GEMINI_CHAT_MODEL), FREE_CHAT_MODELS);
  assert.deepEqual(chatModels("gemini-3.5-flash-lite"), [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
  ]);
  assert.deepEqual(chatModels("gemini-3.1-flash-lite"), [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
  ]);
  assert.deepEqual(chatModels("gemini-2.5-flash-lite"), [
    "gemini-2.5-flash-lite",
  ]);
  assert.deepEqual(chatModels("custom"), ["custom"]);
  assert.deepEqual(chatModels("strong", ["strong", "small", "small"]), [
    "strong",
    "small",
  ]);
  const explicit = config({
    GEMINI_CHAT_FALLBACK_MODELS: " small, tiny, small ",
  });
  assert.deepEqual(explicit.GEMINI_CHAT_FALLBACK_MODELS, ["small", "tiny"]);
  assert.deepEqual(
    chatModels(
      config().GEMINI_CHAT_MODEL,
      config({ GEMINI_CHAT_FALLBACK_MODELS: "" }).GEMINI_CHAT_FALLBACK_MODELS,
    ),
    ["gemini-3.5-flash-lite"],
  );
  assert.throws(() => config({ GEMINI_CHAT_FALLBACK_MODELS: "invalid/model" }));
  assert.equal(chatModelFromConfig(config()), null);
});

test("web search uses Google grounding, keeps the Flash-Lite ladder and exposes only cited safe URLs", async () => {
  const transport = script(
    limited(),
    Response.json({
      candidates: [
        {
          content: { parts: [{ text: "Yerel bilgi [s1]. Web ayrıntısı." }] },
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: "https://museum.example/history", title: "Müze" } },
              { web: { uri: "javascript:alert(1)", title: "Unsafe" } },
              { web: { uri: "https://unused.example", title: "Unused" } },
            ],
            groundingSupports: [{ groundingChunkIndices: [0, 1, 0, 99] }],
            searchEntryPoint: { renderedContent: "<div>Google</div>" },
          },
        },
      ],
    }),
  );
  const model = geminiChat(["key"], FREE_CHAT_MODELS, transport.fetchImpl);
  const reply = await model.search!(prompt);
  assert.deepEqual(
    transport.calls.map((c) => c.model),
    ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"],
  );
  const body = JSON.parse(transport.calls[0]!.body);
  assert.deepEqual(body.tools, [{ google_search: {} }]);
  assert.equal(body.generationConfig.responseSchema, undefined);
  assert.equal(body.generationConfig.responseMimeType, undefined);
  assert.deepEqual(reply.sources, [
    { title: "Müze", url: "https://museum.example/history" },
  ]);
  assert.deepEqual(reply.refs, ["s1"]);
  assert.equal(reply.searchSuggestions, "<div>Google</div>");
});

test("web answers without grounded citations are rejected; local generation never enables search", async () => {
  const transport = script(
    success(),
    Response.json({
      candidates: [
        {
          content: {
            parts: [{ text: "An unverified answer https://invented.example" }],
          },
        },
      ],
    }),
  );
  const model = geminiChat(["key"], FREE_CHAT_MODELS, transport.fetchImpl);
  await model.reply(prompt);
  assert.equal(JSON.parse(transport.calls[0]!.body).tools, undefined);
  await assert.rejects(model.search!(prompt), upstreamFailed);
});
