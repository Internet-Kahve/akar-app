import { AppError } from "../errors.ts";

export type ChatTurn = { role: "user" | "assistant"; text: string };
export type ChatPrompt = { system: string; history: ChatTurn[]; message: string };
/** `refs`: keys of the context blocks the answer used; `general`: the answer also leans on general knowledge. */
export type ChatReply = { answer: string; refs: string[]; general: boolean };

/** The site assistant's language model behind an interface: Gemini in production, a fake in tests. */
export interface ChatModel {
  /** One answer. Throws `AppError`: 429 when every key is at its limit, 502 on any other failure. */
  reply(prompt: ChatPrompt): Promise<ChatReply>;
}

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30_000;
/** A key that answered 429/503 is skipped this long (the free tier's limit is per minute). */
export const KEY_COOLDOWN_MS = 60_000;

const BUSY = "Asistan şu an çok yoğun. Bir dakika sonra tekrar dene.";
const FAILED = "Asistana ulaşılamadı. Biraz sonra tekrar dene.";

/**
 * Gemini `generateContent` over a list of API keys (§11.74). Requests start at the next key in turn; a key that
 * answers 429 or 503 rests for `KEY_COOLDOWN_MS` and the same request goes to the next one. Cooldowns live in
 * memory, so each serverless instance learns them on its own.
 */
export function geminiChat(
  apiKeys: string[],
  model: string,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): ChatModel {
  if (apiKeys.length === 0) throw new Error("geminiChat needs at least one key");
  const url = `${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`;
  const restUntil = apiKeys.map(() => 0);
  let turn = 0;

  return {
    async reply(prompt) {
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: prompt.system }] },
        contents: [
          ...prompt.history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.text }] })),
          { role: "user", parts: [{ text: prompt.message }] },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: { answer: { type: "STRING" }, refs: { type: "ARRAY", items: { type: "STRING" } }, general: { type: "BOOLEAN" } },
            required: ["answer", "refs", "general"],
          },
        },
      });

      const start = turn++ % apiKeys.length;
      for (let i = 0; i < apiKeys.length; i++) {
        const index = (start + i) % apiKeys.length;
        if (restUntil[index]! > now()) continue;
        let res: Response;
        try {
          res = await fetchImpl(url, {
            method: "POST",
            headers: { "x-goog-api-key": apiKeys[index]!, "content-type": "application/json" },
            body,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
        } catch {
          throw new AppError(502, "UPSTREAM_FAILED", FAILED);
        }
        if (res.status === 429 || res.status === 503) {
          await res.arrayBuffer().catch(() => undefined);
          restUntil[index] = now() + KEY_COOLDOWN_MS;
          continue;
        }
        if (!res.ok) {
          await res.arrayBuffer().catch(() => undefined);
          throw new AppError(502, "UPSTREAM_FAILED", FAILED);
        }
        const json = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null;
        const raw = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
        let parsed: { answer?: unknown; refs?: unknown; general?: unknown } | null = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          // handled below
        }
        const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : "";
        if (!answer) throw new AppError(502, "UPSTREAM_FAILED", FAILED);
        const refs = Array.isArray(parsed?.refs) ? parsed.refs.filter((r): r is string => typeof r === "string") : [];
        return { answer, refs, general: parsed?.general === true };
      }
      throw new AppError(429, "RATE_LIMITED", BUSY);
    },
  };
}

export function chatModelFromConfig(config: { GEMINI_CHAT_API_KEYS: string[]; GEMINI_API_KEY?: string | undefined; GEMINI_CHAT_MODEL: string }): ChatModel | null {
  const keys = config.GEMINI_CHAT_API_KEYS.length ? config.GEMINI_CHAT_API_KEYS : config.GEMINI_API_KEY ? [config.GEMINI_API_KEY] : [];
  return keys.length ? geminiChat(keys, config.GEMINI_CHAT_MODEL, fetch) : null;
}
