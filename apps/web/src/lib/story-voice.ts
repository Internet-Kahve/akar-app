import type { StoryBlock, StoryNarration, UserPreferences } from "@akar/domain";
import { isLang, type Lang } from "./i18n";
import { readPreference, writePreference } from "./preferences";

/** Voice of the story player: its language and gender; `null` = not chosen (language then follows the site, gender is female). */
export type VoiceGender = "female" | "male";
export interface VoiceChoice {
  lang: Lang | null;
  gender: VoiceGender | null;
}

const LANG_KEY = "akar.ses.dil";
const GENDER_KEY = "akar.ses.cinsiyet";

export const isVoiceGender = (value: unknown): value is VoiceGender => value === "female" || value === "male";

/** What this device remembers of the visitor's voice choice. */
export function deviceVoice(): VoiceChoice {
  const lang = readPreference(LANG_KEY);
  const gender = readPreference(GENDER_KEY);
  return { lang: isLang(lang) ? lang : null, gender: isVoiceGender(gender) ? gender : null };
}

export function saveDeviceVoice(choice: VoiceChoice) {
  if (choice.lang) writePreference(LANG_KEY, choice.lang);
  if (choice.gender) writePreference(GENDER_KEY, choice.gender);
}

/** The account's voice when it has one; a key the account has not chosen keeps the device's. */
export function voiceFromAccount(account: Pick<UserPreferences, "voiceLang" | "voiceGender">, device: VoiceChoice): VoiceChoice {
  return { lang: account.voiceLang ?? device.lang, gender: account.voiceGender ?? device.gender };
}

/**
 * The recording the player plays for a sentence in the chosen voice, or `undefined` (the browser voice reads it
 * then). The simple wording is used only where it exists in the voice language; otherwise the plain text is
 * read, like the text on screen (`storyText`).
 */
export function pickNarration(
  block: Pick<StoryBlock, "simple" | "simpleEn" | "narrations">,
  lang: Lang,
  gender: VoiceGender,
  simple: boolean,
): StoryNarration | undefined {
  const variant = simple && (lang === "en" ? block.simpleEn : block.simple)?.trim() ? "simple" : "text";
  return block.narrations?.find((n) => n.lang === lang && n.voice === gender && n.variant === variant);
}
