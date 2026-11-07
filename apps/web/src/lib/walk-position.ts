"use client";
import { useEffect, useState } from "react";
import type { LocateMessages } from "./locate";
import { distanceM, type LngLat } from "./nearby";

/**
 * The visit rule of the API (`VISIT_RADIUS_M`, default 30 m), forgiving the device's accuracy up to 50 m as the
 * server does (`withinSiteRadius`): the walk offers «Ziyaretini doğrula» only where the server would say yes.
 */
export const VISIT_RADIUS_M = 30;
const ACCURACY_SLACK_M = 50;

export function nearStop(distance: number, accuracyM: number, radiusM = VISIT_RADIUS_M): boolean {
  return distance - Math.min(Math.max(0, accuracyM), ACCURACY_SLACK_M) <= radiusM;
}

/** How far the stop is, from the visitor's position: `null` until a position has come. */
export function stopDistance(from: LngLat | undefined, to: LngLat): number | null {
  return from ? distanceM(from, to) : null;
}

/** «120 m», «1,2 km»: metres rounded to ten under a kilometre (a phone's position is not finer), then one decimal. */
export function formatDistance(metres: number, lang: "tr" | "en"): string {
  if (metres < 995) return `${Math.max(10, Math.round(metres / 10) * 10)} m`;
  const km = new Intl.NumberFormat(lang === "en" ? "en-GB" : "tr-TR", { maximumFractionDigits: 1 }).format(metres / 1000);
  return `${km} km`;
}

export interface WatchedPosition {
  coordinates?: LngLat;
  accuracyM?: number;
  error?: string;
}

/**
 * The device's position while `on` (a walk the visitor asked to follow by location), from the browser's own watch.
 * It never leaves the device: the walk measures the distance here, and only «Ziyaretini doğrula» sends a position
 * (through the client's own `locate`, as before). Off, the watch stops, so the GPS does not run for nothing.
 */
export function useWatchedPosition(on: boolean, messages: LocateMessages): WatchedPosition {
  const [position, setPosition] = useState<WatchedPosition>({});
  useEffect(() => {
    if (!on) {
      setPosition({});
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPosition({ error: messages.unsupported });
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => setPosition({ coordinates: [p.coords.longitude, p.coords.latitude], accuracyM: p.coords.accuracy }),
      (error) =>
        setPosition((current) =>
          // A timeout after a position keeps the last one; the watch goes on.
          error.code === 3 && current.coordinates
            ? current
            : { error: error.code === 1 ? messages.denied : error.code === 3 ? messages.timeout : messages.failed },
        ),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
    // The messages are read when the watch starts; a language change does not restart the GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  return position;
}
