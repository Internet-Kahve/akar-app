/**
 * UI strings of the public web in Turkish and English (§11.57), one file per group of screens under
 * `messages/`. Keys are `area.thing`; placeholders are `{name}`. Each part types its English against its
 * Turkish, so a missing or extra English key is a type error.
 */
import * as shell from "./messages/shell";
import * as site from "./messages/site";

const tr = { ...shell.tr, ...site.tr };

// A key defined in two parts would silently take the later text: name the clash at compile time.
type Clash = keyof typeof shell.tr & keyof typeof site.tr;
const noClash: [Clash] extends [never] ? true : Clash = true;
void noClash;

export type MessageKey = keyof typeof tr;

export const messages: Record<"tr" | "en", Record<MessageKey, string>> = {
  tr,
  en: { ...shell.en, ...site.en },
};
