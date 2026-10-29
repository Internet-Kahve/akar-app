import type { AngleMatch, HeritageSite, HistoryImage, SampleTrace, SitePhoto } from "@akar/domain";

/** Name in the corner label of the archive's own present-day pair (the team's choice from the archive). */
export const ARCHIVE_PAIR_BY = "AKAR arşivi";

/** The present-day side of an archive photograph, with what the screen must say about it. */
export interface HistoryPair {
  photo: SitePhoto;
  /** Who the corner label credits: «AKAR arşivi» for the archive pair, the sample's author for a sample. */
  by: string;
  /** The pair is a team-made İz Bırak sample, not the archive's pair: the screen tags it «Örnek». */
  example: boolean;
  /** `near`: the two photographs were not taken from exactly the same point; the screen says so. */
  angleMatch: AngleMatch | undefined;
}

/**
 * What stands beside an archive photograph as "today". The archive pair (`presentPhoto`) wins. Without one, the
 * newest team-made sample that shows this photograph's view stands in, tagged as an example (a later one wins a tie
 * on the day). Nothing else is ever presented as a pair.
 */
export function pairOf(site: Pick<HeritageSite, "sampleTraces">, image: HistoryImage): HistoryPair | null {
  if (image.presentPhoto) {
    return { photo: image.presentPhoto, by: ARCHIVE_PAIR_BY, example: false, angleMatch: image.presentAngleMatch };
  }
  let newest: SampleTrace | undefined;
  for (const trace of site.sampleTraces ?? []) {
    if (trace.historyImageId === image.id && (!newest || trace.addedOn >= newest.addedOn)) newest = trace;
  }
  return newest ? { photo: newest.photo, by: newest.author, example: true, angleMatch: newest.angleMatch } : null;
}
