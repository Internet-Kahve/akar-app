import { sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { walkingLegs } from "../../db/schema/index.ts";
import { RoutingError, type WalkingRouter } from "../../platform/routing.ts";

type Point = [number, number];
export type LegKey = { from: Point; to: Point };
export type StoredLeg = { coordinates: Point[]; meters: number; seconds: number };

export type WalkingFillOptions = {
  /** Legs asked for in one run; a route of 10 stops has 9. */
  maxLegs?: number;
  /** Whole run, all requests and retries included. */
  budgetMs?: number;
  requestMs?: number;
  /** Extra attempts after a timeout / 5xx / broken answer, shared by the whole run. */
  retries?: number;
};

export type WalkingFillResult = {
  computed: number;
  noRoute: number;
  failed: number;
  /** Why the run asked nothing (more): daily limit reached, or the service said stop (429, key refused). */
  stopped: "daily-limit" | "service" | null;
};

export const legKey = ({ from, to }: LegKey) => `${from[0]},${from[1]};${to[0]},${to[1]}`;

/**
 * Consecutive published stops of published routes whose leg is not cached yet, or whose last attempt found
 * no path more than an hour ago. Coordinates come straight from `sites.location`, exactly as the route read
 * looks them up.
 */
async function missingLegs(db: Db, limit: number): Promise<LegKey[]> {
  const rows = await db.execute<{ fl: number; fa: number; tl: number; ta: number }>(sql`
    with stops as (
      select rs.route_id, rs.position, ST_X(s.location) as lng, ST_Y(s.location) as lat
      from route_stops rs
      join catalog_routes r on r.id = rs.route_id and r.status = 'published'
      join sites s on s.id = rs.site_id and s.status = 'published'
    ), pairs as (
      select lng as fl, lat as fa, lead(lng) over w as tl, lead(lat) over w as ta
      from stops window w as (partition by route_id order by position)
    )
    select distinct p.fl, p.fa, p.tl, p.ta
    from pairs p
    left join walking_legs l on l.from_lng = p.fl and l.from_lat = p.fa and l.to_lng = p.tl and l.to_lat = p.ta
    where p.tl is not null
      and (p.fl, p.fa) is distinct from (p.tl, p.ta)
      and (l.from_lng is null or (l.failed_at is not null and l.failed_at < now() - interval '1 hour'))
    order by p.fl, p.fa, p.tl, p.ta
    limit ${limit}`);
  return rows.rows.map((r) => ({ from: [r.fl, r.fa], to: [r.tl, r.ta] }));
}

/** Requests in the last 24 h, failed attempts included (each attempt rewrites `computed_at`). */
async function usedToday(db: Db): Promise<number> {
  const rows = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from ${walkingLegs} where ${walkingLegs.computedAt} > now() - interval '24 hours'`,
  );
  return rows.rows[0]?.n ?? 0;
}

async function store(db: Db, leg: LegKey, path: StoredLeg | null): Promise<void> {
  const values = {
    fromLng: leg.from[0],
    fromLat: leg.from[1],
    toLng: leg.to[0],
    toLat: leg.to[1],
    geometry: path?.coordinates ?? null,
    meters: path?.meters ?? null,
    seconds: path?.seconds ?? null,
    failedAt: path ? null : new Date(),
  };
  await db
    .insert(walkingLegs)
    .values(values)
    .onConflictDoUpdate({
      target: [walkingLegs.fromLng, walkingLegs.fromLat, walkingLegs.toLng, walkingLegs.toLat],
      set: { geometry: values.geometry, meters: values.meters, seconds: values.seconds, failedAt: values.failedAt, computedAt: sql`now()` },
    });
}

/**
 * Asks the routing service for missing legs, within a request count, a time budget and the rolling daily
 * limit. Runs from the maintenance cron, outside any request or transaction: a route save never waits on
 * the service. A leg that fails is left for the next run; a route keeps its straight line meanwhile.
 */
export async function fillWalkingLegs(
  deps: { db: Db; router: WalkingRouter; dailyLimit: number },
  { maxLegs = 9, budgetMs = 20_000, requestMs = 5_000, retries = 2 }: WalkingFillOptions = {},
): Promise<WalkingFillResult> {
  const result: WalkingFillResult = { computed: 0, noRoute: 0, failed: 0, stopped: null };
  const allowance = Math.min(maxLegs, deps.dailyLimit - (await usedToday(deps.db)));
  if (allowance <= 0) return { ...result, stopped: "daily-limit" };
  const deadline = AbortSignal.timeout(budgetMs);
  let retriesLeft = retries;
  for (const leg of await missingLegs(deps.db, allowance)) {
    for (;;) {
      if (deadline.aborted) return result;
      try {
        const path = await deps.router.walk(leg.from, leg.to, AbortSignal.any([deadline, AbortSignal.timeout(requestMs)]));
        await store(deps.db, leg, path);
        result.computed++;
        break;
      } catch (err) {
        const kind = err instanceof RoutingError ? err.kind : "failed";
        if (kind === "stop") return { ...result, stopped: "service" };
        if (kind === "no-route") {
          await store(deps.db, leg, null);
          result.noRoute++;
          break;
        }
        if (retriesLeft > 0 && !deadline.aborted) {
          retriesLeft--;
          continue;
        }
        result.failed++;
        break;
      }
    }
  }
  return result;
}

/** Cached paths for the given legs, keyed `fromLng,fromLat;toLng,toLat`; legs without a path are absent. */
export async function storedLegs(db: Db, legs: LegKey[]): Promise<Map<string, StoredLeg>> {
  const unique = [...new Map(legs.map((l) => [legKey(l), l])).values()];
  if (!unique.length) return new Map();
  const tuples = sql.join(
    unique.map((l) => sql`(${l.from[0]}::float8, ${l.from[1]}::float8, ${l.to[0]}::float8, ${l.to[1]}::float8)`),
    sql`, `,
  );
  const rows = await db.execute<{ fl: number; fa: number; tl: number; ta: number; geometry: Point[]; meters: number; seconds: number }>(sql`
    select from_lng as fl, from_lat as fa, to_lng as tl, to_lat as ta, geometry, meters, seconds
    from walking_legs
    where geometry is not null and (from_lng, from_lat, to_lng, to_lat) in (${tuples})`);
  return new Map(
    rows.rows.map((r) => [legKey({ from: [r.fl, r.fa], to: [r.tl, r.ta] }), { coordinates: r.geometry, meters: r.meters, seconds: r.seconds }]),
  );
}
