import { asc, inArray } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { siteSampleTraces } from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { SampleTraceDto } from "./schemas.ts";

/** A sample trace row (§11.47); `addedOn` comes back from `date` as `YYYY-MM-DD`. */
export type SampleTraceRow = typeof siteSampleTraces.$inferSelect;

/** The sample traces of the given sites, ordered by (site, position). */
export function loadSampleTraces(q: Db | Tx, siteIds: string[]): Promise<SampleTraceRow[]> {
  if (!siteIds.length) return Promise.resolve([]);
  return q
    .select()
    .from(siteSampleTraces)
    .where(inArray(siteSampleTraces.siteId, siteIds))
    .orderBy(asc(siteSampleTraces.siteId), asc(siteSampleTraces.position));
}

export function sampleTraceDto(t: SampleTraceRow): SampleTraceDto {
  return {
    id: t.id,
    author: t.author,
    text: t.text,
    mediaId: t.mediaId,
    historyImageId: t.historyImageId,
    angleMatch: t.angleMatch,
    addedOn: t.addedOn,
  };
}
