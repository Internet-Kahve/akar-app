import { AppError } from "../errors.ts";
import { narrationLangs, narrationVoices, type NarrationLang, type NarrationVoice } from "../db/schema/narrations.ts";

/** Voice model per language and voice, e.g. `tr.female` → `flux-dilek-tr`. */
export type VoiceKey = `${NarrationLang}.${NarrationVoice}`;
export type VoiceModels = Record<VoiceKey, string>;

export const DEFAULT_TTS_VOICES = "tr.female=flux-dilek-tr,tr.male=flux-mehmet-tr,en.female=flux-sienna-en,en.male=flux-cliff-en";

export const voiceKey = (lang: NarrationLang, voice: NarrationVoice): VoiceKey => `${lang}.${voice}`;

/** Parses `TTS_VOICES` (`lang.voice=model,…`): all four combinations are required. Returns the models or an error message. */
export function parseVoiceModels(raw: string): VoiceModels | string {
  const models: Partial<Record<VoiceKey, string>> = {};
  for (const entry of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    const eq = entry.indexOf("=");
    const key = entry.slice(0, eq).trim();
    const model = eq < 0 ? "" : entry.slice(eq + 1).trim();
    const [lang, voice, extra] = key.split(".");
    if (extra !== undefined || !narrationLangs.includes(lang as NarrationLang) || !narrationVoices.includes(voice as NarrationVoice)) {
      return `TTS_VOICES: "${entry}" geçersiz; biçim <tr|en>.<female|male>=<model>.`;
    }
    if (!/^[\w.-]+$/.test(model)) return `TTS_VOICES: "${key}" için model adı geçersiz.`;
    models[voiceKey(lang as NarrationLang, voice as NarrationVoice)] = model;
  }
  for (const lang of narrationLangs) {
    for (const voice of narrationVoices) {
      if (!models[voiceKey(lang, voice)]) return `TTS_VOICES: ${voiceKey(lang, voice)} eksik.`;
    }
  }
  return models as VoiceModels;
}

/** Text-to-speech behind an interface: Deepgram in production, a fake in tests. */
export interface TtsProvider {
  /** Speaks `text` with the voice `model`; returns the audio as mp3 bytes. Throws `AppError` (502) when the service fails. */
  synthesize(input: { text: string; model: string }): Promise<Buffer>;
}

const DEEPGRAM_URL = "https://api.deepgram.com/v2/speak";
const REQUEST_TIMEOUT_MS = 120_000;

/** Deepgram Flux batch REST: `POST /v2/speak?model=…`, `{text}` in, mp3 out. */
export function deepgramTts(apiKey: string, fetchImpl: typeof fetch = fetch): TtsProvider {
  return {
    async synthesize({ text, model }) {
      let res: Response;
      try {
        res = await fetchImpl(`${DEEPGRAM_URL}?model=${encodeURIComponent(model)}`, {
          method: "POST",
          headers: { authorization: `Token ${apiKey}`, "content-type": "application/json" },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch {
        throw new AppError(502, "UPSTREAM_FAILED", "Seslendirme hizmetine ulaşılamadı. Biraz sonra tekrar dene.");
      }
      if (!res.ok) {
        // The body can echo the request; only the status goes into the message.
        await res.arrayBuffer().catch(() => undefined);
        throw new AppError(502, "UPSTREAM_FAILED", `Seslendirme hizmeti isteği reddetti (HTTP ${res.status}).`);
      }
      const audio = Buffer.from(await res.arrayBuffer());
      if (!audio.length) throw new AppError(502, "UPSTREAM_FAILED", "Seslendirme hizmeti boş ses döndürdü.");
      return audio;
    },
  };
}

export function ttsFromConfig(config: { DEEPGRAM_API_KEY?: string | undefined }): TtsProvider | null {
  return config.DEEPGRAM_API_KEY ? deepgramTts(config.DEEPGRAM_API_KEY) : null;
}
