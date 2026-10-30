import { setTimeout as sleep } from "node:timers/promises";
import { AppError } from "../errors.ts";

/** The Turkish texts of one story block; the translator returns the English of the fields it was given. */
export type TranslateFields = { text?: string; simple?: string };

/** Turkish → English translation of site texts behind an interface: Gemini in production, a fake in tests. */
export interface Translator {
  /** One request for one block: translates the given fields. Throws `AppError` (502) on failure. */
  translate(fields: TranslateFields): Promise<TranslateFields>;
}

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000;

/** The prompt every request carries: names and historical terms stay as they are, the text is not shortened or commented. */
export const TRANSLATE_PROMPT = [
  "You translate Turkish texts of a cultural-heritage guide (Ottoman architecture, Bursa and other Turkish cities) into English.",
  "The input is a JSON object whose values are Turkish texts; answer with a JSON object with the same keys and the English translations as values: no notes, no quotes, no markdown, same paragraph breaks, nothing added or left out.",
  "Keep proper names and historical terms in their Turkish form: Ulucami, Yıldırım Bayezid, Bedesten, Koza Han, Orhan Gazi, Yeşil Türbe, minber, şadırvan, medrese, külliye, hamam, han, vakıf, kubbe, mihrap and the like.",
  "Keep the terms of the inventory forms («Envanter»: yapı türü, plan tipi, kitabe, çini, kalem işi) in Turkish and add a short English gloss in parentheses on first use only when a general reader would not know the term.",
  "Write numbers, years and centuries in the English style (1399, 13th century). Do not invent facts.",
].join("\n");

const PLAIN_HINT = 'The value of the key "simple" is written in simple language for younger readers: keep its sentences short and its words plain.';

type Sleep = (ms: number) => Promise<unknown>;

/**
 * Gemini `generateContent`, one request per story block. The free tier is rate limited: a 429 (or 503) is retried a few
 * times with a growing pause, then the call fails with a 502 the panel can show.
 */
export function geminiTranslator(apiKey: string, model: string, fetchImpl: typeof fetch = fetch, pause: Sleep = sleep): Translator {
  const url = `${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`;
  return {
    async translate(fields) {
      const keys = (["text", "simple"] as const).filter((k) => fields[k] !== undefined);
      const input = Object.fromEntries(keys.map((k) => [k, fields[k]]));
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: keys.includes("simple") ? `${TRANSLATE_PROMPT}\n${PLAIN_HINT}` : TRANSLATE_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: { type: "OBJECT", properties: Object.fromEntries(keys.map((k) => [k, { type: "STRING" }])), required: keys },
        },
      });
      for (let attempt = 0; ; attempt++) {
        let res: Response;
        try {
          res = await fetchImpl(url, {
            method: "POST",
            headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
            body,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
        } catch {
          throw new AppError(502, "UPSTREAM_FAILED", "Çeviri hizmetine ulaşılamadı. Biraz sonra tekrar dene.");
        }
        if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
          await res.arrayBuffer().catch(() => undefined);
          await pause(BASE_DELAY_MS * 2 ** attempt);
          continue;
        }
        if (!res.ok) {
          await res.arrayBuffer().catch(() => undefined);
          const busy = res.status === 429 ? " Kullanım sınırına takıldı; birkaç dakika sonra tekrar dene." : "";
          throw new AppError(502, "UPSTREAM_FAILED", `Çeviri hizmeti isteği reddetti (HTTP ${res.status}).${busy}`);
        }
        const json = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null;
        const raw = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
        } catch {
          // handled below
        }
        const out: TranslateFields = {};
        for (const k of keys) {
          const value = parsed?.[k];
          if (typeof value !== "string" || !value.trim()) throw new AppError(502, "UPSTREAM_FAILED", "Çeviri hizmeti beklenen yanıtı döndürmedi.");
          out[k] = value.trim();
        }
        return out;
      }
    },
  };
}

export function translatorFromConfig(config: { GEMINI_API_KEY?: string | undefined; GEMINI_MODEL: string }): Translator | null {
  return config.GEMINI_API_KEY ? geminiTranslator(config.GEMINI_API_KEY, config.GEMINI_MODEL) : null;
}
