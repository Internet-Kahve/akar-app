import type { SiteProgress } from "@akar/api-client";

/**
 * The share card (5 Nov 2026): a 1080 × 1920 picture for an Instagram or WhatsApp story, drawn on a canvas when the
 * visitor asks to share a badge, an achievement or the week. It carries the visitor's figure, name, the medal and
 * the score; never an e-mail address or any other personal data. These are its pure parts; the drawing is in
 * `components/share-card.tsx`, loaded only when sharing starts.
 */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;

/** Offset of Europe/Istanbul from UTC at `at`, in minutes (+180 since 2016; read from the platform, not assumed). */
function istanbulOffsetMinutes(at: Date): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(part ?? "");
  if (!m) return 180;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/** The start of the week that holds `now`: Monday 00:00 in Istanbul, as an instant. */
export function istanbulWeekStart(now: Date): Date {
  const offset = istanbulOffsetMinutes(now);
  const local = new Date(now.getTime() + offset * 60_000); // Istanbul wall clock, read with the UTC getters
  const sinceMonday = (local.getUTCDay() + 6) % 7;
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - sinceMonday);
  return new Date(midnight - offset * 60_000);
}

/** Badges earned in the week that holds `now`, newest first. */
export function badgesThisWeek(progress: SiteProgress, now: Date): SiteProgress["badges"] {
  const start = istanbulWeekStart(now).getTime();
  const end = start + 7 * 24 * 3_600_000;
  return progress.badges
    .filter((b) => {
      const at = Date.parse(b.earnedAt);
      return at >= start && at < end;
    })
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
}

/** «3–9 Kasım» / «3–9 November», or across months «30 Ekim – 5 Kasım». */
export function weekRange(now: Date, lang: "tr" | "en"): string {
  const start = istanbulWeekStart(now);
  const end = new Date(start.getTime() + 6 * 24 * 3_600_000);
  const locale = lang === "en" ? "en-GB" : "tr-TR";
  const day = (d: Date) => new Intl.DateTimeFormat(locale, { timeZone: "Europe/Istanbul", day: "numeric" }).format(d);
  const dayMonth = (d: Date) => new Intl.DateTimeFormat(locale, { timeZone: "Europe/Istanbul", day: "numeric", month: "long" }).format(d);
  const month = (d: Date) => new Intl.DateTimeFormat(locale, { timeZone: "Europe/Istanbul", month: "long" }).format(d);
  return month(start) === month(end) ? `${day(start)}–${dayMonth(end)}` : `${dayMonth(start)} – ${dayMonth(end)}`;
}

/**
 * Breaks `text` into at most `maxLines` lines no wider than `maxWidth` by `measure`; a word too long for a line
 * stands alone, and what does not fit ends in «…».
 */
export function wrapLines(text: string, maxWidth: number, maxLines: number, measure: (s: string) => number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (!line || measure(next) <= maxWidth) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1]!;
  while (last.length > 1 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1).trimEnd();
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

/** A file name with no personal data: what is shared and which. */
export const shareFileName = (kind: "rozet" | "basarim" | "hafta", id: string): string =>
  `akar-${kind}-${id.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "kart"}.png`;
