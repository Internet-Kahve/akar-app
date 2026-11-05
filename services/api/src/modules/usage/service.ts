import { and, between, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { catalogRoutes, sitePartCards, siteTasks, sites, usageDaily } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { MAX_SENTENCE_INDEX, USAGE_EVENTS, type UsageEventName } from "@akar/domain";
import { DEFAULT_STATS_DAYS, MAX_STATS_DAYS } from "./events.ts";
import type { SiteStatsResponse, StatsResponse, UsageEvent } from "./schemas.ts";

const DAY_MS = 86_400_000;
const istanbulDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });

/** Calendar day in Istanbul, `YYYY-MM-DD`. */
export function usageDay(now: Date): string {
  return istanbulDay.format(now);
}

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

/** Range check for the stats endpoints: `to` defaults to today, `from` to 30 days ending at `to`. */
export function statsRange(query: { from?: string | undefined; to?: string | undefined }, now: Date): { from: string; to: string } {
  const to = query.to ?? usageDay(now);
  const from = query.from ?? addDays(to, -(DEFAULT_STATS_DAYS - 1));
  if (from > to) throw new AppError(400, "VALIDATION_FAILED", "`from`, `to`'dan sonra olamaz.");
  if (Date.parse(to) - Date.parse(from) >= MAX_STATS_DAYS * DAY_MS) {
    throw new AppError(400, "VALIDATION_FAILED", `En fazla ${MAX_STATS_DAYS} günlük dönem sorgulanabilir.`);
  }
  return { from, to };
}

type Key = { event: UsageEventName; siteId: string; ref: string };

/** Shape rules of one event, before the database check; null = not counted. */
function shape(e: UsageEvent): Key | null {
  const rule: { site: boolean; ref: string; server?: true } = USAGE_EVENTS[e.event];
  if (rule.server || rule.site !== (e.siteId !== undefined)) return null;
  const ref = e.ref;
  switch (rule.ref) {
    case "none":
      if (ref !== undefined) return null;
      break;
    case "sentence":
      if (ref === undefined || !/^\d{1,3}$/.test(ref) || Number(ref) > MAX_SENTENCE_INDEX) return null;
      break;
    case "lang":
      if (ref !== "tr" && ref !== "en") return null;
      break;
    case "signIn":
      if (ref !== "new" && ref !== "returning") return null;
      break;
    default:
      if (ref === undefined) return null;
  }
  // "07" and "7" are the same sentence.
  return { event: e.event, siteId: e.siteId ?? "", ref: rule.ref === "sentence" ? String(Number(ref)) : ref ?? "" };
}

/**
 * Adds the batch to the day's counters. Events that break their rule or name an unknown site, route, part card
 * (of that site) or task (of that site) are dropped, so made-up ids never become rows. Returns how many counted.
 */
export async function recordUsage(db: Db, events: UsageEvent[], guest: boolean, now: Date): Promise<number> {
  const keys = events.map(shape).filter((k): k is Key => k !== null);
  if (keys.length === 0) return 0;
  const siteIds = [...new Set(keys.map((k) => k.siteId).filter(Boolean))];
  const refsOf = (kind: string) => [...new Set(keys.filter((k) => USAGE_EVENTS[k.event].ref === kind).map((k) => k.ref))];
  const routeIds = refsOf("route");
  const cardIds = refsOf("partCard");
  const taskIds = refsOf("task");
  const [knownSites, knownRoutes, knownCards, knownTasks] = await Promise.all([
    siteIds.length ? db.select({ id: sites.id }).from(sites).where(inArray(sites.id, siteIds)) : [],
    routeIds.length ? db.select({ id: catalogRoutes.id }).from(catalogRoutes).where(inArray(catalogRoutes.id, routeIds)) : [],
    cardIds.length ? db.select({ id: sitePartCards.id, siteId: sitePartCards.siteId }).from(sitePartCards).where(inArray(sitePartCards.id, cardIds)) : [],
    taskIds.length ? db.select({ id: siteTasks.id, siteId: siteTasks.siteId }).from(siteTasks).where(inArray(siteTasks.id, taskIds)) : [],
  ]);
  const site = new Set(knownSites.map((r) => r.id));
  const route = new Set(knownRoutes.map((r) => r.id));
  const owned = new Set([...knownCards, ...knownTasks].map((r) => `${r.siteId}\n${r.id}`));

  const counts = new Map<string, Key & { count: number }>();
  let accepted = 0;
  for (const k of keys) {
    const kind = USAGE_EVENTS[k.event].ref;
    if (k.siteId && !site.has(k.siteId)) continue;
    if (kind === "route" && !route.has(k.ref)) continue;
    if ((kind === "partCard" || kind === "task") && !owned.has(`${k.siteId}\n${k.ref}`)) continue;
    const id = `${k.event}\n${k.siteId}\n${k.ref}`;
    const row = counts.get(id);
    if (row) row.count++;
    else counts.set(id, { ...k, count: 1 });
    accepted++;
  }
  if (counts.size === 0) return 0;
  const day = usageDay(now);
  await db
    .insert(usageDaily)
    .values([...counts.values()].map((r) => ({ day, event: r.event, siteId: r.siteId, ref: r.ref, guest, count: r.count })))
    .onConflictDoUpdate({
      target: [usageDaily.day, usageDaily.event, usageDaily.siteId, usageDaily.ref, usageDaily.guest],
      set: { count: sql`${usageDaily.count} + excluded.count` },
    });
  return accepted;
}

/** One count of an event the API records itself (`server` in `USAGE_EVENTS`), signed-in, no site or detail. */
export async function countServerEvent(db: Db, event: UsageEventName, now: Date): Promise<void> {
  await db
    .insert(usageDaily)
    .values({ day: usageDay(now), event, siteId: "", ref: "", guest: false, count: 1 })
    .onConflictDoUpdate({
      target: [usageDaily.day, usageDaily.event, usageDaily.siteId, usageDaily.ref, usageDaily.guest],
      set: { count: sql`${usageDaily.count} + 1` },
    });
}

/** Today's (Istanbul) total of one event, guests and signed-in together. */
export async function countToday(db: Db, event: UsageEventName, now: Date): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${usageDaily.count}), 0)::int` })
    .from(usageDaily)
    .where(and(eq(usageDaily.day, usageDay(now)), eq(usageDaily.event, event)));
  return row?.n ?? 0;
}

const guestSum = sql<number>`coalesce(sum(${usageDaily.count}) filter (where ${usageDaily.guest}), 0)::int`;
const signedSum = sql<number>`coalesce(sum(${usageDaily.count}) filter (where not ${usageDaily.guest}), 0)::int`;
const total = sql`sum(${usageDaily.count})`;

export async function getStats(db: Db, from: string, to: string): Promise<StatsResponse> {
  const inRange = between(usageDaily.day, from, to);
  const [totals, daily, siteRows, routeRows] = await Promise.all([
    db.select({ event: usageDaily.event, guest: guestSum, signedIn: signedSum })
      .from(usageDaily).where(inRange).groupBy(usageDaily.event).orderBy(usageDaily.event),
    db.select({ day: usageDaily.day, event: usageDaily.event, guest: guestSum, signedIn: signedSum })
      .from(usageDaily).where(inRange).groupBy(usageDaily.day, usageDaily.event).orderBy(usageDaily.day, usageDaily.event),
    db.select({ siteId: usageDaily.siteId, name: sites.name, event: usageDaily.event, guest: guestSum, signedIn: signedSum })
      .from(usageDaily).leftJoin(sites, eq(sites.id, usageDaily.siteId))
      .where(and(inRange, ne(usageDaily.siteId, "")))
      .groupBy(usageDaily.siteId, sites.name, usageDaily.event),
    db.select({ routeId: usageDaily.ref, name: catalogRoutes.name, guest: guestSum, signedIn: signedSum })
      .from(usageDaily).leftJoin(catalogRoutes, eq(catalogRoutes.id, usageDaily.ref))
      .where(and(inRange, eq(usageDaily.event, "route.open")))
      .groupBy(usageDaily.ref, catalogRoutes.name).orderBy(desc(total), usageDaily.ref),
  ]);

  const bySite = new Map<string, StatsResponse["sites"][number] & { views: number }>();
  for (const r of siteRows) {
    let s = bySite.get(r.siteId);
    if (!s) bySite.set(r.siteId, (s = { siteId: r.siteId, name: r.name, counts: [], views: 0 }));
    s.counts.push({ event: r.event as UsageEventName, guest: r.guest, signedIn: r.signedIn });
    if (r.event === "site.view") s.views = r.guest + r.signedIn;
  }
  const siteList = [...bySite.values()]
    .sort((a, b) => b.views - a.views || a.siteId.localeCompare(b.siteId))
    .map(({ views: _, counts, ...s }) => ({ ...s, counts: counts.sort((a, b) => a.event.localeCompare(b.event)) }));

  return {
    from,
    to,
    totals: totals.map((r) => ({ ...r, event: r.event as UsageEventName })),
    daily: daily.map((r) => ({ ...r, event: r.event as UsageEventName })),
    sites: siteList,
    routes: routeRows,
  };
}

export async function getSiteStats(db: Db, siteId: string, from: string, to: string): Promise<SiteStatsResponse> {
  const [rows, [site], cards, tasks] = await Promise.all([
    db.select({ event: usageDaily.event, ref: usageDaily.ref, guest: guestSum, signedIn: signedSum })
      .from(usageDaily)
      .where(and(between(usageDaily.day, from, to), eq(usageDaily.siteId, siteId)))
      .groupBy(usageDaily.event, usageDaily.ref),
    db.select({ name: sites.name }).from(sites).where(eq(sites.id, siteId)),
    db.select({ id: sitePartCards.id, title: sitePartCards.title }).from(sitePartCards).where(eq(sitePartCards.siteId, siteId)),
    db.select({ id: siteTasks.id, title: siteTasks.title }).from(siteTasks).where(eq(siteTasks.siteId, siteId)),
  ]);
  if (!site && rows.length === 0) throw new AppError(404, "NOT_FOUND", "Eser bulunamadı.");
  const cardTitle = new Map(cards.map((c) => [c.id, c.title]));
  const taskTitle = new Map(tasks.map((t) => [t.id, t.title]));
  const sentence = (r: { ref: string }) => (/^\d+$/.test(r.ref) ? Number(r.ref) : -1);
  return {
    from,
    to,
    siteId,
    name: site?.name ?? null,
    rows: rows
      .map((r) => {
        const kind = USAGE_EVENTS[r.event as UsageEventName]?.ref;
        const label = kind === "partCard" ? cardTitle.get(r.ref) ?? null : kind === "task" ? taskTitle.get(r.ref) ?? null : null;
        return { ...r, event: r.event as UsageEventName, label };
      })
      .sort((a, b) => a.event.localeCompare(b.event) || sentence(a) - sentence(b) || a.ref.localeCompare(b.ref)),
  };
}
