import { AppError } from "../errors.ts";

export type ChatTurn = { role: "user" | "assistant"; text: string };
export type ChatPrompt = {
  system: string;
  history: ChatTurn[];
  message: string;
};
/** `refs`: keys of the context blocks the answer used; `general`: the answer also leans on general knowledge. */
export type ChatReply = {
  answer: string;
  refs: string[];
  general: boolean;
  needsWeb?: boolean;
};
export type WebReply = {
  answer: string;
  refs: string[];
  sources: { title: string; url: string }[];
  searchSuggestions?: string;
};

/** The site assistant's language model behind an interface: Gemini in production, a fake in tests. */
export interface ChatModel {
  /** One answer. Throws `AppError`: 429 when every available model/key is at its limit, 502 on any other failure. */
  reply(prompt: ChatPrompt): Promise<ChatReply>;
  /** Used only after local evidence is insufficient. Sources come from search metadata, never generated URLs. */
  search?(prompt: ChatPrompt): Promise<WebReply>;
}

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30_000;
/** Minimum rest for one model/key pair after 429/503; other models keep their own quota. */
export const KEY_COOLDOWN_MS = 60_000;

/** The assistant's Flash-Lite fallback order, newest first. */
export const FREE_CHAT_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
] as const;
export const DEFAULT_CHAT_MODEL = FREE_CHAT_MODELS[0];
const UNAVAILABLE_COOLDOWN_MS = 5 * 60_000;

/** Explicit fallbacks win; a pinned known model only falls to the models below it. */
export function chatModels(
  primary: string,
  fallbacks?: readonly string[],
): string[] {
  const index = FREE_CHAT_MODELS.findIndex((model) => model === primary);
  return [
    ...new Set([
      primary,
      ...(fallbacks ?? (index < 0 ? [] : FREE_CHAT_MODELS.slice(index + 1))),
    ]),
  ];
}

/** Respect both HTTP Retry-After and Google's google.rpc.RetryInfo without returning upstream text to the client. */
async function retryDelay(res: Response, now: () => number): Promise<number> {
  const header = res.headers.get("retry-after");
  const headerMs = header
    ? /^\d+(?:\.\d+)?$/.test(header)
      ? Number(header) * 1000
      : Date.parse(header) - now()
    : 0;
  const body = (await res.json().catch(() => null)) as {
    error?: { details?: { "@type"?: string; retryDelay?: string }[] };
  } | null;
  const details = Array.isArray(body?.error?.details) ? body.error.details : [];
  const delays = details.flatMap((detail) => {
    if (
      detail?.["@type"] !== "type.googleapis.com/google.rpc.RetryInfo" ||
      typeof detail.retryDelay !== "string"
    )
      return [];
    const match = /^(\d+(?:\.\d+)?)s$/.exec(detail.retryDelay);
    return match ? [Number(match[1]) * 1000] : [];
  });
  return Math.max(
    KEY_COOLDOWN_MS,
    ...[headerMs, ...delays].filter(Number.isFinite),
  );
}

const BUSY = "Asistan şu an çok yoğun. Bir dakika sonra tekrar dene.";
const FAILED = "Asistana ulaşılamadı. Biraz sonra tekrar dene.";

export function sourceUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && !url.username && !url.password)
      return url.href;
  } catch {
    /* Invalid provider/source URL. */
  }
}

type Candidate = {
  content?: { parts?: { text?: string; thought?: boolean }[] };
  groundingMetadata?: {
    groundingChunks?: { web?: { uri?: string; title?: string } }[];
    groundingSupports?: { groundingChunkIndices?: number[] }[];
    searchEntryPoint?: { renderedContent?: string };
  };
};

function groundedReply(
  candidate: Candidate | undefined,
  answer: string,
): WebReply {
  const metadata = candidate?.groundingMetadata;
  const indices = new Set(
    (metadata?.groundingSupports ?? []).flatMap(
      (s) => s.groundingChunkIndices ?? [],
    ),
  );
  const sources = new Map<string, { title: string; url: string }>();
  for (const index of indices) {
    const web = metadata?.groundingChunks?.[index]?.web;
    const url = sourceUrl(web?.uri);
    if (url)
      sources.set(url, {
        url,
        title: web?.title?.trim() || new URL(url).hostname,
      });
  }
  if (!answer || !sources.size)
    throw new AppError(502, "UPSTREAM_FAILED", FAILED);
  const refs = [...answer.matchAll(/\[([a-z][a-z0-9_]*)\]/g)].map((m) => m[1]!);
  const html = metadata?.searchEntryPoint?.renderedContent;
  return {
    answer,
    refs,
    sources: [...sources.values()],
    ...(html && html.length <= 50_000 && { searchSuggestions: html }),
  };
}

/**
 * Try all available keys on the strongest model first, then lower models with the identical prompt.
 * Quotas are per project/model, not key: keys of the same project may both be limited. Each pair rests
 * independently; after its cooldown the strongest model is preferred again. State is per server instance.
 */
export function geminiChat(
  apiKeys: string[],
  model: string | readonly string[],
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): ChatModel {
  const keys = [...new Set(apiKeys)];
  const models = [...new Set(typeof model === "string" ? [model] : model)];
  if (!keys.length || !models.length)
    throw new Error("geminiChat needs at least one key and model");
  const cooldowns = models.map(() =>
    keys.map(() => ({ until: 0, busy: false })),
  );
  let turn = 0;

  async function generate(
    prompt: ChatPrompt,
    search: boolean,
  ): Promise<ChatReply | WebReply> {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: prompt.system }] },
      contents: [
        ...prompt.history.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.text }],
        })),
        { role: "user", parts: [{ text: prompt.message }] },
      ],
      ...(search && { tools: [{ google_search: {} }] }),
      generationConfig: search
        ? { temperature: 0.4 }
        : {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                answer: { type: "STRING" },
                refs: { type: "ARRAY", items: { type: "STRING" } },
                general: { type: "BOOLEAN" },
                needsWeb: {
                  type: "BOOLEAN",
                  description:
                    "Yerel kaynaklar yanıt için eksikse true; yeterliyse veya konu dışıysa false.",
                },
              },
              required: ["answer", "refs", "general", "needsWeb"],
            },
          },
    });

    const start = turn++ % keys.length;
    // One 30-second budget per phase (local answer or optional web search), shared by all fallback attempts.
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let busy = false;
    for (const [modelIndex, name] of models.entries()) {
      const url = `${GEMINI_URL}/${encodeURIComponent(name)}:generateContent`;
      for (let i = 0; i < keys.length; i++) {
        const index = (start + i) % keys.length;
        const rest = cooldowns[modelIndex]![index]!;
        if (rest.until > now()) {
          busy ||= rest.busy;
          continue;
        }
        if (signal.aborted) throw new AppError(502, "UPSTREAM_FAILED", FAILED);
        let res: Response;
        try {
          res = await fetchImpl(url, {
            method: "POST",
            headers: {
              "x-goog-api-key": keys[index]!,
              "content-type": "application/json",
            },
            body,
            signal,
          });
        } catch {
          throw new AppError(502, "UPSTREAM_FAILED", FAILED);
        }
        if (res.status === 429 || res.status === 503) {
          const delay = await retryDelay(res, now);
          rest.until = now() + delay;
          rest.busy = busy = true;
          continue;
        }
        if (res.status === 404) {
          // A new model may not be available to this project yet; a retired one must not block lower models.
          await res.arrayBuffer().catch(() => undefined);
          rest.until = now() + UNAVAILABLE_COOLDOWN_MS;
          rest.busy = false;
          continue;
        }
        if (!res.ok) {
          await res.arrayBuffer().catch(() => undefined);
          throw new AppError(502, "UPSTREAM_FAILED", FAILED);
        }
        const json = (await res.json().catch(() => null)) as {
          candidates?: Candidate[];
        } | null;
        const raw = json?.candidates?.[0]?.content?.parts
          ?.filter((p) => !p.thought)
          .map((p) => p.text ?? "")
          .join("");
        if (search)
          return groundedReply(json?.candidates?.[0], raw?.trim() ?? "");
        let parsed: {
          answer?: unknown;
          refs?: unknown;
          general?: unknown;
          needsWeb?: unknown;
        } | null = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          // handled below
        }
        const answer =
          typeof parsed?.answer === "string" ? parsed.answer.trim() : "";
        if (!answer) throw new AppError(502, "UPSTREAM_FAILED", FAILED);
        const refs = Array.isArray(parsed?.refs)
          ? parsed.refs.filter((r): r is string => typeof r === "string")
          : [];
        return {
          answer,
          refs,
          general: parsed?.general === true,
          ...(parsed?.needsWeb === true && { needsWeb: true }),
        };
      }
    }
    if (busy) throw new AppError(429, "RATE_LIMITED", BUSY);
    throw new AppError(502, "UPSTREAM_FAILED", FAILED);
  }
  return {
    reply: (prompt) => generate(prompt, false) as Promise<ChatReply>,
    search: (prompt) => generate(prompt, true) as Promise<WebReply>,
  };
}

export function chatModelFromConfig(config: {
  GEMINI_CHAT_API_KEYS: string[];
  GEMINI_API_KEY?: string | undefined;
  GEMINI_CHAT_MODEL: string;
  GEMINI_CHAT_FALLBACK_MODELS?: string[] | undefined;
}): ChatModel | null {
  const keys = config.GEMINI_CHAT_API_KEYS.length
    ? config.GEMINI_CHAT_API_KEYS
    : config.GEMINI_API_KEY
      ? [config.GEMINI_API_KEY]
      : [];
  return keys.length
    ? geminiChat(
        keys,
        chatModels(
          config.GEMINI_CHAT_MODEL,
          config.GEMINI_CHAT_FALLBACK_MODELS,
        ),
        fetch,
      )
    : null;
}
