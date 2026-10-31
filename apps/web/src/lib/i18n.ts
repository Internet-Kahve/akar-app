import { messages, type MessageKey } from "./messages";
import { readPreference, writePreference } from "./preferences";

/** Site language of the public web (§11.57); the panel stays Turkish. */
export type Lang = "tr" | "en";
export const LANGS: readonly Lang[] = ["tr", "en"];
const LANG_KEY = "akar.dil";

export function isLang(value: unknown): value is Lang {
  return value === "tr" || value === "en";
}

/** First visit: any Turkish entry in the browser's languages means Turkish, anything else English. */
export function detectLang(languages: readonly string[]): Lang {
  return languages.some((l) => l.toLowerCase().startsWith("tr")) ? "tr" : "en";
}

/** The language chosen on this device, else the browser's. */
export function deviceLang(): Lang {
  const saved = readPreference(LANG_KEY);
  if (isLang(saved)) return saved;
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  return detectLang(list.filter(Boolean));
}

/** `null` until the visitor picks a language on this device (detection does not count as a choice). */
export function savedDeviceLang(): Lang | null {
  const saved = readPreference(LANG_KEY);
  return isLang(saved) ? saved : null;
}

export function saveDeviceLang(lang: Lang) {
  writePreference(LANG_KEY, lang);
}

export type MessageVars = Record<string, string | number>;

/** UI string in `lang`; `{name}` placeholders are filled from `vars`. */
export function translate(lang: Lang, key: MessageKey, vars?: MessageVars): string {
  const text: string = messages[lang][key];
  return vars ? text.replace(/\{(\w+)\}/g, (all, name: string) => (name in vars ? String(vars[name]) : all)) : text;
}

/** Content text in `lang`: English falls back to the Turkish original, flagged so the UI can say so. */
export function localize(lang: Lang, tr: string, en: string | null | undefined): { text: string; fallback: boolean } {
  if (lang === "tr") return { text: tr, fallback: false };
  const english = en?.trim();
  return english ? { text: english, fallback: false } : { text: tr, fallback: !!tr };
}
