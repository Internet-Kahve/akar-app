import type { StoryBlock } from "@akar/domain";
import { localize, type Lang } from "./i18n";

/**
 * A sentence as the visitor reads or hears it: the plain or the simple wording, in the site language. A sentence
 * with no English falls back to its Turkish (`lang: "tr"`), and the speech must then use a Turkish voice.
 */
export function storyText(
  block: Pick<StoryBlock, "text" | "simple" | "textEn" | "simpleEn">,
  simple: boolean,
  lang: Lang,
) {
  const tr = simple ? block.simple || block.text : block.text;
  const en = simple ? block.simpleEn || block.textEn : block.textEn;
  const shown = localize(lang, tr, en);
  return { tr, en, text: shown.text, lang: (lang === "en" && !shown.fallback ? "en" : "tr") as Lang };
}
