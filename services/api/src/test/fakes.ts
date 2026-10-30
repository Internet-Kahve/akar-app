import type { Translator, TranslateFields } from "../platform/translate.ts";
import type { TtsProvider } from "../platform/tts.ts";

/** A voice-over provider that records its calls and returns small bytes shaped like an mp3 (an ID3 tag, then the text). */
export function fakeTts(): TtsProvider & { calls: { text: string; model: string }[]; fail: Error | null } {
  const fake = {
    calls: [] as { text: string; model: string }[],
    fail: null as Error | null,
    async synthesize(input: { text: string; model: string }) {
      fake.calls.push(input);
      if (fake.fail) throw fake.fail;
      return Buffer.concat([Buffer.from("ID3"), Buffer.from(`${input.model}|${input.text}`, "utf8")]);
    },
  };
  return fake;
}

/** A translator that records its calls and answers `EN: <text>` for each field. */
export function fakeTranslator(): Translator & { calls: TranslateFields[]; fail: Error | null } {
  const fake = {
    calls: [] as TranslateFields[],
    fail: null as Error | null,
    async translate(fields: TranslateFields) {
      fake.calls.push(fields);
      if (fake.fail) throw fake.fail;
      const out: TranslateFields = {};
      if (fields.text !== undefined) out.text = `EN: ${fields.text}`;
      if (fields.simple !== undefined) out.simple = `EN: ${fields.simple}`;
      return out;
    },
  };
  return fake;
}
