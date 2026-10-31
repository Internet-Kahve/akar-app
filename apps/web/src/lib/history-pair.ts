import type { AngleMatch, HeritageSite, HistoryImage, SampleTrace, SitePhoto } from "@akar/domain";
import { translate, type Lang } from "./i18n";

/** The present-day side of an archive photograph, with what the screen must say about it. */
export interface HistoryPair {
  photo: SitePhoto;
  /** Who the corner label credits: the archive («AKAR arşivi» / "AKAR archive") for the archive pair, the sample's author for a sample. */
  by: string;
  /** The pair is a team-made İz Bırak sample, not the archive's pair: the screen tags it «Örnek». */
  example: boolean;
  /** `near`: the two photographs were not taken from exactly the same point; the screen says so. */
  angleMatch: AngleMatch | undefined;
}

/**
 * What stands beside an archive photograph as "today". The archive pair (`presentPhoto`) wins. Without one, the
 * newest team-made sample that shows this photograph's view stands in, tagged as an example (a later one wins a tie
 * on the day). Nothing else is ever presented as a pair. `lang` words the archive's credit.
 */
export function pairOf(site: Pick<HeritageSite, "sampleTraces">, image: HistoryImage, lang: Lang): HistoryPair | null {
  if (image.presentPhoto) {
    return { photo: image.presentPhoto, by: translate(lang, "site.archiveName"), example: false, angleMatch: image.presentAngleMatch };
  }
  let newest: SampleTrace | undefined;
  for (const trace of site.sampleTraces ?? []) {
    if (trace.historyImageId === image.id && (!newest || trace.addedOn >= newest.addedOn)) newest = trace;
  }
  return newest ? { photo: newest.photo, by: newest.author, example: true, angleMatch: newest.angleMatch } : null;
}
