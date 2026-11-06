/** One walking path from the routing service. */
export type WalkingPath = { coordinates: [number, number][]; meters: number; seconds: number };

/**
 * Why a leg could not be computed. `no-route`: the service answered but found no path (stored, retried
 * after an hour); `stop`: quota used up or key refused, ask nothing more this run; `failed`: timeout, 5xx or
 * a broken answer (not stored, tried again on the next run).
 */
export class RoutingError extends Error {
  readonly kind: "no-route" | "stop" | "failed";
  constructor(kind: "no-route" | "stop" | "failed", message: string) {
    super(message);
    this.kind = kind;
  }
}

/** Pedestrian routing behind an interface: openrouteservice in production, a fake in tests. */
export interface WalkingRouter {
  /** Walking path from `from` to `to` (`[lng, lat]`). Throws `RoutingError`. */
  walk(from: [number, number], to: [number, number], signal: AbortSignal): Promise<WalkingPath>;
}

const ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

/** 6 decimals ≈ 0.1 m: enough for a map line, a third of the JSON. */
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** openrouteservice Directions V2, `foot-walking` profile (free Standard plan: 2000/day, 40/min). */
export function openRouteService(apiKey: string, fetchImpl: typeof fetch = fetch): WalkingRouter {
  return {
    async walk(from, to, signal) {
      let res: Response;
      try {
        res = await fetchImpl(ORS_URL, {
          method: "POST",
          headers: { authorization: apiKey, "content-type": "application/json", accept: "application/geo+json" },
          body: JSON.stringify({ coordinates: [from, to] }),
          signal,
        });
      } catch {
        throw new RoutingError("failed", "Yönlendirme hizmetine ulaşılamadı.");
      }
      if (res.status === 429) throw new RoutingError("stop", "Yönlendirme hizmeti kotası doldu.");
      if (res.status === 401 || res.status === 403) throw new RoutingError("stop", "Yönlendirme hizmeti anahtarı reddetti.");
      if (res.status === 404) throw new RoutingError("no-route", "Yürüme yolu bulunamadı.");
      if (!res.ok) {
        // The body can echo the request; only the status goes into the message.
        await res.arrayBuffer().catch(() => undefined);
        throw new RoutingError(res.status >= 500 ? "failed" : "no-route", `Yönlendirme hizmeti isteği reddetti (HTTP ${res.status}).`);
      }
      const body = (await res.json().catch(() => null)) as {
        features?: { geometry?: { coordinates?: unknown }; properties?: { summary?: { distance?: unknown; duration?: unknown } } }[];
      } | null;
      const feature = body?.features?.[0];
      const coordinates = feature?.geometry?.coordinates;
      const { distance, duration } = feature?.properties?.summary ?? {};
      const valid =
        Array.isArray(coordinates) &&
        coordinates.length >= 2 &&
        coordinates.every((c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) &&
        typeof distance === "number" && Number.isFinite(distance) && distance >= 0 &&
        typeof duration === "number" && Number.isFinite(duration) && duration >= 0;
      if (!valid) throw new RoutingError("failed", "Yönlendirme hizmeti bozuk yanıt döndürdü.");
      return {
        coordinates: (coordinates as number[][]).map((c) => [round6(c[0]!), round6(c[1]!)] as [number, number]),
        meters: Math.round(distance),
        seconds: Math.round(duration),
      };
    },
  };
}

export function routerFromConfig(config: { ROUTING_API_KEY?: string | undefined }): WalkingRouter | null {
  return config.ROUTING_API_KEY ? openRouteService(config.ROUTING_API_KEY) : null;
}
