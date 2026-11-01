import type { Memory, SampleTrace } from "@akar/domain";
import type { Lang } from "./i18n";

export type MemoryFilter = "all" | "photo" | "angle" | "mine";

/** One row of «Yaşayan hafıza», whichever source it came from. */
export interface Trace {
  id: string;
  author: string;
  text: string;
  date: string;
  own: boolean;
  state: "pending" | "approved" | "sample";
  photo?: string | undefined;
  alt?: string | undefined;
  credit?: string | undefined;
  historyImageId?: string | undefined;
}

const newest = (a: Trace, b: Trace) => b.date.localeCompare(a.date);

/** The visitor's own traces first (a refused one is left out), then the rest from newest to oldest. */
export function memoryTraces({
  sample,
  own,
  approved,
}: {
  sample: SampleTrace[];
  own: Memory[];
  approved: Memory[];
}): Trace[] {
  const row = (m: Memory, mine: boolean): Trace => ({
    id: m.id,
    author: m.author,
    text: m.text,
    date: m.createdAt,
    own: mine,
    state: m.status === "pending" ? "pending" : "approved",
    photo: m.photo,
  });
  const mine = own.filter((m) => m.status !== "rejected").map((m) => row(m, true));
  const ownIds = new Set(mine.map((m) => m.id));
  const others = [
    ...approved.filter((m) => !ownIds.has(m.id)).map((m) => row(m, false)),
    ...sample.map(
      (s): Trace => ({
        id: s.id,
        author: s.author,
        text: s.text,
        date: s.addedOn,
        own: false,
        state: "sample",
        photo: s.photo.src,
        alt: s.photo.alt,
        credit: s.photo.description,
        historyImageId: s.historyImageId,
      }),
    ),
  ];
  return [...mine.sort(newest), ...others.sort(newest)];
}

/** «3 gün önce»; a date a year or more away is written out. */
export function relativeDay(date: string, lang: Lang, now = Date.now()): string {
  const then = new Date(date).getTime();
  if (!Number.isFinite(then)) return "";
  const days = Math.round((now - then) / 86_400_000);
  const locale = lang === "en" ? "en" : "tr";
  if (days >= 365)
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(then);
  const words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (days >= 30) return words.format(-Math.floor(days / 30), "month");
  if (days >= 7) return words.format(-Math.floor(days / 7), "week");
  return words.format(-Math.max(0, days), "day");
}

export const traceInitial = (name: string) => name.trim().slice(0, 1).toLocaleUpperCase("tr") || "–";
