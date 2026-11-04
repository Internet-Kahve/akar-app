/**
 * A closed building's interior on the site's page (Muhammed, 3 Nov 2026). Under a closed cover it cannot be seen, yet it
 * was drawn every frame: more than half the triangles of some models. It waits undrawn, in memory, until it can be seen.
 */

/** Interior parts that can wait undrawn. A part the cover lifts away is the lift's to show and hide. */
export const hideableInterior = (interior: string[] = [], cover: string[][] = []): string[] => {
  const lifted = new Set(cover.flat());
  return interior.filter((part) => !lifted.has(part));
};

/** Whether the interior must be drawn now: the cover open or on its way, the camera inside, or a part of it in question. */
export const interiorNeeded = (state: { coverOpen: boolean; cameraInside: boolean; parts: string[]; hidden: string[] }) =>
  state.coverOpen || state.cameraInside || state.parts.some((part) => state.hidden.includes(part));
