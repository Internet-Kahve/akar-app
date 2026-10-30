import type { MapPlacement } from "@akar/domain";
import { M_PER_DEG_LAT, M_PER_DEG_LNG } from "./osm-buildings";

/** A placement as the panel edits it: the saved fields plus whether visitors' maps draw it. */
export type PlacementDraft = MapPlacement & { visible: boolean };

/** One arrow-key or button step, in metres. */
export const NUDGE_M = 0.5;
/** Heading step of the slider, in degrees. */
export const HEADING_STEP = 0.5;

/** Where an unplaced model starts: the site's own location, facing north at ground level. */
export const defaultPlacement = (at: [number, number]): PlacementDraft => ({
  lng: at[0],
  lat: at[1],
  headingDeg: 0,
  scale: 1,
  altitudeM: 0,
  anchorNode: null,
  hiddenPoints: [],
  keptPoints: [],
  visible: true,
});

/** The saved placement, with `visible` filled in (the public view has none: it is shown). */
export const toDraft = (p: MapPlacement): PlacementDraft => ({
  ...p,
  visible: p.visible ?? true,
});

/** 0 ≤ x < 360, in the half-degree steps the slider has. */
export function normalizeHeading(deg: number): number {
  const turned = ((deg % 360) + 360) % 360;
  const stepped = Math.round(turned / HEADING_STEP) * HEADING_STEP;
  return stepped >= 360 ? 0 : stepped;
}

/** Clockwise quarter turn. */
export const rotate90 = (p: PlacementDraft): PlacementDraft => ({
  ...p,
  headingDeg: normalizeHeading(p.headingDeg + 90),
});

/** Seventh decimal is about a centimetre; keeps repeated steps from piling up float noise. */
const round7 = (x: number) => Math.round(x * 1e7) / 1e7;

/** Moves the model by metres towards the east and the north. */
export function nudge(
  p: PlacementDraft,
  eastM: number,
  northM: number,
): PlacementDraft {
  return {
    ...p,
    lng: round7(
      p.lng + eastM / (M_PER_DEG_LNG * Math.cos((p.lat * Math.PI) / 180)),
    ),
    lat: round7(p.lat + northM / M_PER_DEG_LAT),
  };
}

export const placementKey = (p: PlacementDraft | null) =>
  p ? JSON.stringify(p) : "";

/** Arrow key → east and north steps; `null` for any other key. */
export function arrowStep(key: string): [number, number] | null {
  switch (key) {
    case "ArrowRight":
      return [NUDGE_M, 0];
    case "ArrowLeft":
      return [-NUDGE_M, 0];
    case "ArrowUp":
      return [0, NUDGE_M];
    case "ArrowDown":
      return [0, -NUDGE_M];
    default:
      return null;
  }
}

/** Puts the model at a map point (the handle was dragged or a building chosen). */
export const moveTo = (
  p: PlacementDraft,
  lng: number,
  lat: number,
): PlacementDraft => ({ ...p, lng: round7(lng), lat: round7(lat) });
