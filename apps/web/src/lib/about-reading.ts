import type { AboutChapter, AboutPhoto, HeritageSite, Trust } from "@akar/domain";

type Section = NonNullable<HeritageSite["sections"]>[number];

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
      meaning: string[];
      trust: Trust;
      photos: AboutPhoto[];
    };

const MEANING = "Mealen:";

/** Chapter paragraphs in book order; book photographs stay after the paragraph they were placed behind. */
export function chapterBlocks(sections: Section[], summary: string[]): Block[] {
  const blocks: Block[] = [];
  const sentences = summary.map((s) => s.trim()).filter(Boolean);
  for (const section of sections) {
    const text = section.body.trim();
    const photos = section.photos ?? [];
    const last = blocks[blocks.length - 1];
    if (
      last?.kind === "inscription" &&
      text.startsWith(MEANING) &&
      !last.photos.length
    ) {
      last.meaning.push(text.slice(MEANING.length).trim());
      last.photos = photos;
    } else if (text.startsWith("“")) {
      const at = text.indexOf(MEANING);
      blocks.push({
        kind: "inscription",
        id: section.id,
        original: at > 0 ? text.slice(0, at).trim() : text,
        meaning: at > 0 ? [text.slice(at + MEANING.length).trim()] : [],
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
