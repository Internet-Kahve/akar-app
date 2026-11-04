import type { UsageCount, UsageRange, UsageStats } from "@akar/api-client";
import type { UsageEventName } from "@akar/domain";

const DAY_MS = 86_400_000;
const istanbulDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The last `days` Istanbul days up to today, both ends included (the API counts in Istanbul days). */
export function lastDays(days: number, now: Date): UsageRange {
  const to = istanbulDay.format(now);
  return { from: addDays(to, -(days - 1)), to };
}

function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export type Split = { guest: number; signedIn: number };

/** One point per day of the range for one event; days without counts are zero. */
export function dailySeries(
  stats: Pick<UsageStats, "from" | "to" | "daily">,
  event: UsageEventName,
): Array<Split & { day: string }> {
  const byDay = new Map(
    stats.daily.filter((d) => d.event === event).map((d) => [d.day, d]),
  );
  const out: Array<Split & { day: string }> = [];
  for (let day = stats.from; day <= stats.to; day = addDays(day, 1)) {
    const d = byDay.get(day);
    out.push({ day, guest: d?.guest ?? 0, signedIn: d?.signedIn ?? 0 });
  }
  return out;
}

/** Guest + signed-in count of one event in a list; 0 when absent. */
export function total(counts: UsageCount[], event: UsageEventName): number {
  const c = counts.find((x) => x.event === event);
  return c ? c.guest + c.signedIn : 0;
}

/**
 * Story drop-off: how many reached each sentence, index order, gaps filled with 0, each with its share of the
 * first sentence's count (`null` when nobody reached the first one).
 */
export function sentenceFunnel(
  rows: Array<Split & { event: string; ref: string }>,
): Array<{ index: number; count: number; share: number | null }> {
  const counts = new Map<number, number>();
  for (const r of rows) {
    if (r.event !== "story.sentence") continue;
    const i = Number(r.ref);
    if (Number.isInteger(i) && i >= 0) counts.set(i, (counts.get(i) ?? 0) + r.guest + r.signedIn);
  }
  if (!counts.size) return [];
  const first = counts.get(0) ?? 0;
  const last = Math.max(...counts.keys());
  return Array.from({ length: last + 1 }, (_, index) => {
    const count = counts.get(index) ?? 0;
    return { index, count, share: first ? count / first : null };
  });
}
