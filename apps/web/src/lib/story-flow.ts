import { distanceM, type LngLat } from "./nearby";

/** A target farther than this is only pointed at: the arc stays near the site. */
export const FAR_TARGET_M = 3_000;
const SHORT_ARC_M = 240;
const ARC_POINTS = 48;
/** How far the arc bows out, as a share of its length. */
const ARC_BOW = 0.22;

/** Where the arc ends: at the target, or a short way towards a distant one. */
export function flowEnd(from: LngLat, to: LngLat): LngLat {
  const distance = distanceM(from, to);
  if (distance <= FAR_TARGET_M) return to;
  const share = SHORT_ARC_M / distance;
  return [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share];
}

/** Points of a curve from `from` to `to`, bowing to the left of the way. */
export function flowArc(from: LngLat, to: LngLat): LngLat[] {
  const dx = to[0] - from[0],
    dy = to[1] - from[1];
  return Array.from({ length: ARC_POINTS + 1 }, (_, i) => {
    const t = i / ARC_POINTS,
      bow = 4 * t * (1 - t) * ARC_BOW;
    return [from[0] + dx * t - dy * bow, from[1] + dy * t + dx * bow];
  });
}
