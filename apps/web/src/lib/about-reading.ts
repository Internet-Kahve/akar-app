import type { AboutChapter, AboutPhoto, HeritageSite, Trust } from "@akar/domain";
import type { Lang } from "./i18n";

type Section = NonNullable<HeritageSite["sections"]>[number];

/**
 * "Eser hakkında" in the site language. English only when every paragraph has its English: a page is never
 * half Turkish, half English. Then chapter and paragraph titles and the reading layer use their English where
 * written. `english: false` = the Turkish text is shown (and read aloud) as it is.
 */
export function aboutInLang(site: HeritageSite, lang: Lang): { site: HeritageSite; english: boolean } {
  const sections = site.sections ?? [];
  if (lang !== "en" || !sections.length || !sections.every((s) => s.bodyEn?.trim()))
    return { site, english: false };
  return {
    english: true,
    site: {
      ...site,
      sections: sections.map((s) => ({ ...s, title: s.titleEn?.trim() || s.title, body: s.bodyEn!.trim() })),
      ...(site.chapters && {
        chapters: site.chapters.map((c) => ({
          ...c,
          ...c.readingEn,
          title: c.titleEn?.trim() || c.title,
        })),
      }),
    },
  };
}

/** Average reading speed used for "N dk okuma". */
const WORDS_PER_MINUTE = 200;
/** More photographs than this in one place are laid out as a grid (plate collages), not a strip. */
export const STRIP_MAX = 3;

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

export const wordCount = (sections: Section[]) =>
  sections.reduce((n, s) => n + words(s.body), 0);

export const readingMinutes = (wordTotal: number) =>
  Math.max(1, Math.round(wordTotal / WORDS_PER_MINUTE));

/** A paragraph of the chapter text, or an inscription / verse card (a paragraph opening with “ and its "Mealen:" lines). */
export type Block =
  | {
      kind: "text";
      id: string;
      text: string;
      trust: Trust;
      /** Carries a summary sentence: hidden in the collapsed preview so the sentence is not read twice. */
      inSummary: boolean;
      photos: AboutPhoto[];
    }
  | {
      kind: "inscription";
      id: string;
      original: string;
      /** The meaning lines, each with the paragraph (`Section.id`) it comes from: a voice-over belongs to that paragraph. */
      meaning: Array<{ sectionId: string; text: string }>;
      trust: Trust;
      photos: AboutPhoto[];
    };

/** Opens the meaning lines of an inscription: «Mealen:» in the Turkish text, «Meaning:» in the English one. */
const MEANING = /(Mealen|Meaning):/;
const meaningAt = (text: string) => {
  const m = MEANING.exec(text);
  return m ? { at: m.index, end: m.index + m[0].length } : null;
};

/** Chapter paragraphs in book order; book photographs stay after the paragraph they were placed behind. */
export function chapterBlocks(sections: Section[], summary: string[]): Block[] {
  const blocks: Block[] = [];
  const sentences = summary.map((s) => s.trim()).filter(Boolean);
  for (const section of sections) {
    const text = section.body.trim();
    const photos = section.photos ?? [];
    const last = blocks[blocks.length - 1];
    const meaning = meaningAt(text);
    if (
      last?.kind === "inscription" &&
      meaning?.at === 0 &&
      !last.photos.length
    ) {
      last.meaning.push({ sectionId: section.id, text: text.slice(meaning.end).trim() });
      last.photos = photos;
    } else if (text.startsWith("“")) {
      blocks.push({
        kind: "inscription",
        id: section.id,
        original: meaning ? text.slice(0, meaning.at).trim() : text,
        meaning: meaning ? [{ sectionId: section.id, text: text.slice(meaning.end).trim() }] : [],
        trust: section.trust,
        photos,
      });
    } else {
      blocks.push({
        kind: "text",
        id: section.id,
        text,
        trust: section.trust,
        inSummary: sentences.some((s) => text.includes(s)),
        photos,
      });
    }
  }
  return blocks;
}

/** The trust most paragraphs share; a paragraph with another one shows its own tag. */
export function dominantTrust(sections: Section[]): Trust {
  const counts = new Map<Trust, number>();
  for (const s of sections) counts.set(s.trust, (counts.get(s.trust) ?? 0) + 1);
  let best: Trust = "verified";
  let top = 0;
  for (const [trust, n] of counts)
    if (n > top) {
      best = trust;
      top = n;
    }
  return best;
}

export type TextPart = { text: string; term?: AboutChapter["terms"][number] };

/** Splits `text` so every occurrence of a chapter term (longest first, exact spelling) is its own part. */
export function splitTerms(
  text: string,
  terms: AboutChapter["terms"],
): TextPart[] {
  const list = [...terms]
    .filter((t) => t.word)
    .sort((a, b) => b.word.length - a.word.length);
  if (!list.length) return [{ text }];
  const parts: TextPart[] = [];
  let from = 0;
  let plain = 0;
  while (from + plain < text.length) {
    const at = from + plain;
    const hit = list.find((t) => text.startsWith(t.word, at));
    if (!hit) {
      plain++;
      continue;
    }
    if (plain) parts.push({ text: text.slice(from, at) });
    parts.push({ text: hit.word, term: hit });
    from = at + hit.word.length;
    plain = 0;
  }
  if (plain) parts.push({ text: text.slice(from) });
  return parts;
}

/** Photo box ratio: the file's own once it is loaded, else the stored one (book crop), else 3:2. */
export const photoRatio = (aspect: number | undefined, natural?: number) =>
  natural && Number.isFinite(natural)
    ? natural
    : aspect && aspect > 0
      ? aspect
      : 1.5;

/** «s. 19–23» from a chapter's source titles («Envanter Cilt 1 · s. 20, 34»); empty when none names a page. */
export function chapterPages(titles: string[]) {
  const pages = titles.flatMap((title) =>
    [...(title.match(/\bs\.\s*([\d,\s–-]+)/)?.[1]?.matchAll(/\d+/g) ?? [])].map((m) => Number(m[0])),
  );
  if (!pages.length) return "";
  const low = Math.min(...pages),
    high = Math.max(...pages);
  return low === high ? `s. ${low}` : `s. ${low}–${high}`;
}
