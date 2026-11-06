import type { HeritageRoute, RouteLeg } from "@akar/domain";
import type { LngLat } from "./nearby";

/**
 * Stored walking leg from `fromId` to `toId` on `route`, or `null` when that pair is not
 * consecutive on the route or its path is not computed yet (drawn schematic, §11.79).
 */
export function walkingLeg(route: HeritageRoute | undefined, fromId: string, toId: string): RouteLeg | null {
  if (!route?.legs) return null;
  const i = route.siteIds.indexOf(fromId);
  return i >= 0 && route.siteIds[i + 1] === toId ? (route.legs[i] ?? null) : null;
}

/** Whole minutes of a leg, at least 1. */
export const legMinutes = (leg: RouteLeg) => Math.max(1, Math.round(leg.seconds / 60));

/** "850 m" / "1,2 km", matching the API's route `distance`. */
export const legDistance = (leg: RouteLeg) =>
  leg.meters < 1000 ? `${Math.round(leg.meters)} m` : `${(leg.meters / 1000).toFixed(1).replace(".", ",")} km`;

/** Walking directions from where the visitor is to `[lng, lat]` in Google Maps (app if installed). */
export const googleWalkUrl = ([lng, lat]: LngLat) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

/** The same in Apple Maps (unified map URLs: `daddr`, `dirflg=w`). */
export const appleWalkUrl = ([lng, lat]: LngLat) => `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;

/** iPhone/iPad, where Apple Maps is offered next to Google. iPadOS reports a Mac with touch. */
export const isAppleMobile = () =>
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
