export const SHEET_HALF = 0.55;
export const SHEET_FULL = 0.92;
/** A sheet let go this close to its lowest or highest stop sits there; anywhere else it stays where it was left. */
export const SHEET_SNAP_PX = 48;
/** A pointer that moved less than this tapped. */
export const SHEET_TAP_PX = 6;

export function clampSheet(height: number, lowest: number, viewport: number) {
  return Math.max(lowest, Math.min(viewport * SHEET_FULL, height));
}

/** Where a sheet let go at `height` comes to rest. */
export function settleSheet(height: number, lowest: number, viewport: number) {
  const highest = viewport * SHEET_FULL;
  if (height < lowest + SHEET_SNAP_PX) return lowest;
  if (height > highest - SHEET_SNAP_PX) return highest;
  return clampSheet(height, lowest, viewport);
}

/** The handle's tap: closed opens half way, anything else closes. */
export function toggleSheet(height: number, lowest: number, viewport: number) {
  return height <= lowest + 1 ? viewport * SHEET_HALF : lowest;
}
