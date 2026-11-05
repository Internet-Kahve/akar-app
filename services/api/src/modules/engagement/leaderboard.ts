import { istanbulWeekStart, type WeeklyLeaderboard } from "@akar/domain";
import { eq, sql } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { profiles } from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { asAvatarId } from "../identity/service.ts";

/** How many rows the list shows. */
export const LEADERBOARD_SIZE = 10;

type Row = {
  kind: "list" | "me";
  points: number;
  display_name: string | null;
  avatar_id: string | null;
  rank: number | null;
};

/**
 * «Haftanın Gezgini» (decision §11.74): the points ledger summed per user since Monday 00:00 Europe/Istanbul.
 * - The score is the server's: `point_events` only, so an event repeated earns nothing (the ledger's unique key) and
 *   a removed memory takes its points back within the week too.
 * - Listed: accounts that turned the list on (`profiles.leaderboard_visible`, off by default) with a display name and
 *   more than 0 points this week. Guests (`guest:…`) and erased accounts never; an erased account has no profile row.
 * - Ties: who got there first (the earlier last event), then the id, so the order is stable.
 * - Never in the answer: e-mail or user id.
 */
export async function weeklyLeaderboard(db: Db | Tx, viewerId: string | null, now = new Date()): Promise<WeeklyLeaderboard> {
  const start = istanbulWeekStart(now);
  const { rows } = await db.execute<Row>(sql`
    with totals as (
      select pe.user_id, sum(pe.points)::int as points, max(pe.at) as last_at
      from point_events pe
      where pe.at >= ${start.toISOString()}::timestamptz
        and pe.user_id not like 'guest:%'
        and not exists (select 1 from deleted_accounts d where d.user_id = pe.user_id)
      group by pe.user_id
    ),
    listed as (
      select t.user_id, t.points, p.display_name, p.avatar_id,
             (row_number() over (order by t.points desc, t.last_at asc, t.user_id asc))::int as rank
      from totals t
      join profiles p on p.user_id = t.user_id
      where p.leaderboard_visible and p.display_name is not null and t.points > 0
    )
    select 'list' as kind, points, display_name, avatar_id, rank from listed where rank <= ${LEADERBOARD_SIZE}
    union all
    select 'me' as kind, t.points, null, null, l.rank
    from totals t left join listed l on l.user_id = t.user_id
    where t.user_id = ${viewerId ?? ""}
    order by rank asc nulls last
  `);
  const items = rows
    .filter((r) => r.kind === "list")
    .map((r) => ({ rank: r.rank!, name: r.display_name!, avatarId: asAvatarId(r.avatar_id), points: r.points }));
  let me: WeeklyLeaderboard["me"] = null;
  if (viewerId) {
    const [profile] = await db.select({ visible: profiles.leaderboardVisible }).from(profiles).where(eq(profiles.userId, viewerId));
    const own = rows.find((r) => r.kind === "me");
    me = { rank: own?.rank ?? null, points: own?.points ?? 0, visible: profile?.visible ?? false };
  }
  return { weekStart: start.toISOString(), items, me };
}
