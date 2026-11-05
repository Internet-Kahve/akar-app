import type { ChatModel, ChatPrompt, ChatReply } from "../platform/chat-model.ts";
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
      return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, `EN: ${value}`]));
    },
  };
  return fake;
}

/** A chat model that records its prompts and answers with `next` (default: a fixed answer using no blocks). */
export function fakeChat(): ChatModel & { calls: ChatPrompt[]; next: ChatReply; fail: Error | null } {
  const fake = {
    calls: [] as ChatPrompt[],
    next: { answer: "Yanıt", refs: [], general: false } as ChatReply,
    fail: null as Error | null,
    async reply(prompt: ChatPrompt) {
      fake.calls.push(prompt);
      if (fake.fail) throw fake.fail;
      return fake.next;
    },
  };
  return fake;
}
