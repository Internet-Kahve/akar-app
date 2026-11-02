export const SHEET_HALF = 0.55;
export const SHEET_FULL = 0.92;
/** A site's card rises at most this far (prototype `eaSinir`): above it the model stays in sight. */
export const SITE_CARD_FULL = 0.75;
/** Of the content after the card's top part, this much shows while it is closed, fading out (prototype «göz»). */
export const SITE_CARD_PEEK = 44;
/** A sheet let go this close to its lowest or highest stop sits there; anywhere else it stays where it was left. */
export const SHEET_SNAP_PX = 48;
/** A pointer that moved less than this tapped. */
export const SHEET_TAP_PX = 6;

/** The stops of a sheet: the map's sheet rises to 92 % of the screen; a site's card to its content or 75 %. */
export type SheetStops = { lowest: number; highest: number; open: number };

export const mapSheetStops = (lowest: number, viewport: number): SheetStops => ({
  lowest,
  highest: viewport * SHEET_FULL,
  open: viewport * SHEET_HALF,
});

/** A site's card on a phone (prototype `#eser-alt`): closed shows its top part; open is all of it, up to 75 %. */
export function siteCardStops(lowest: number, content: number, viewport: number): SheetStops {
  const highest = Math.max(lowest, Math.min(viewport * SITE_CARD_FULL, content));
  return { lowest, highest, open: highest };
}

export function clampSheet(height: number, stops: SheetStops) {
  return Math.max(stops.lowest, Math.min(stops.highest, height));
}

/** Where a sheet let go at `height` comes to rest. */
export function settleSheet(height: number, stops: SheetStops) {
  if (height < stops.lowest + SHEET_SNAP_PX) return stops.lowest;
  if (height > stops.highest - SHEET_SNAP_PX) return stops.highest;
  return clampSheet(height, stops);
}

/** The handle's tap: closed opens (the map half way, a site's card all the way), anything else closes. */
export function toggleSheet(height: number, stops: SheetStops) {
  return height <= stops.lowest + 1 ? stops.open : stops.lowest;
}
