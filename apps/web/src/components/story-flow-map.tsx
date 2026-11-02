"use client";
import { useEffect, useRef } from "react";
import { Landmark } from "lucide-react";
import type { GeoJSONSource, Map as MapType } from "maplibre-gl";
import type { StoryFlow } from "@akar/domain";
import { flowArc, flowEnd } from "../lib/story-flow";
import { TrustTag } from "./side-sheet";
import { useI18n } from "./i18n";
import { followTheme, mapStyle } from "../lib/map-theme";

const DRAW_MS = 2200;
const COIN_MS = 2600;
const COINS = 3;

/** The income road of a waqf: a gold arc from the site that earns to the one it supports, with coins along it. */
export function StoryFlowMap({
  flow,
  fromName,
  from,
  to,
}: {
  flow: StoryFlow;
  fromName: string;
  from: [number, number];
  to: [number, number];
}) {
  const { t, lang } = useI18n();
  const content = lang === "en" ? "tr" : undefined;
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false,
      frame = 0,
      map: MapType | null = null,
      unfollow: (() => void) | undefined;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const end = flowEnd(from, to);
    const arc = flowArc(from, end);
    import("maplibre-gl")
      .then((lib) => {
        if (disposed || !box.current) return;
        lib.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        const bounds = new lib.LngLatBounds(from, from).extend(end);
        map = new lib.Map({
          container: box.current,
          style: mapStyle(),
          bounds,
          fitBoundsOptions: { padding: 110, maxZoom: 17 },
          pitch: 52,
          interactive: false,
          attributionControl: { compact: true },
        });
        const m = map;
        unfollow = followTheme(m);
        m.on("load", () => {
          if (disposed) return;
          m.addSource("flow", {
            type: "geojson",
            lineMetrics: true,
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: arc },
            },
          });
          m.addSource("flow-coins", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          const glow = (progress: number) =>
            [
              "interpolate",
              ["linear"],
              ["line-progress"],
              0,
              "#8A6A16",
              Math.max(0.0001, progress),
              "#E3BC5E",
              Math.min(0.9999, Math.max(0.0002, progress + 0.0001)),
              "rgba(227,188,94,0)",
              1,
              "rgba(227,188,94,0)",
            ] as never;
          m.addLayer({
            id: "flow-glow",
            type: "line",
            source: "flow",
            layout: { "line-cap": "round" },
            paint: {
              "line-width": 18,
              "line-blur": 12,
              "line-opacity": 0.45,
              "line-gradient": glow(calm ? 1 : 0),
            },
          });
          m.addLayer({
            id: "flow-line",
            type: "line",
            source: "flow",
            layout: { "line-cap": "round" },
            paint: { "line-width": 6, "line-gradient": glow(calm ? 1 : 0) },
          });
          m.addLayer({
            id: "flow-coins",
            type: "circle",
            source: "flow-coins",
            paint: {
              "circle-radius": 6.5,
              "circle-color": "#E3BC5E",
              "circle-stroke-color": "#8A6A16",
              "circle-stroke-width": 1.5,
            },
          });
          // As the prototype: only the two buildings stay marked, and the road's label stands at its middle.
          const mark = (at: [number, number], name: string, className: string) => {
            const el = document.createElement("div");
            el.className = className;
            el.innerHTML = "<i></i><b></b>";
            el.querySelector("b")!.textContent = name;
            new lib.Marker({ element: el, anchor: "bottom" }).setLngLat(at).addTo(m);
          };
          mark(from, fromName, "flow-end from");
          if (flow.toSiteId) mark(end, flow.toName, "flow-end to");
          const middle = document.createElement("div");
          middle.className = "flow-label";
          middle.textContent = flow.label;
          new lib.Marker({ element: middle }).setLngLat(arc[Math.floor(arc.length / 2)]!).addTo(m);
          if (calm) return;
          const started = performance.now();
          const tick = (now: number) => {
            if (disposed) return;
            const drawn = Math.min(1, (now - started) / DRAW_MS);
            m.setPaintProperty("flow-line", "line-gradient", glow(drawn));
            m.setPaintProperty("flow-glow", "line-gradient", glow(drawn));
            if (drawn === 1) {
              const features = Array.from({ length: COINS }, (_, i) => {
                const at =
                  (((now - started - DRAW_MS) / COIN_MS + i / COINS) % 1) *
                  (arc.length - 1);
                return {
                  type: "Feature" as const,
                  properties: {},
                  geometry: {
                    type: "Point" as const,
                    coordinates: arc[Math.floor(at)]!,
                  },
                };
              });
              m.getSource<GeoJSONSource>("flow-coins")?.setData({
                type: "FeatureCollection",
                features,
              });
            }
            frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        });
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      unfollow?.();
      map?.remove();
    };
  }, [from, to]);
  return (
    <div className="story-flow">
      <div ref={box} className="story-flow-map" aria-hidden="true" />
      <div className="story-flow-card">
        <small>
          <Landmark size={14} />
          {t("site.flowCardTag")}
        </small>
        <h3 lang={content}>
          {fromName} → {flow.toName}
        </h3>
        <p lang={content}>{flow.label}</p>
        <TrustTag
          trust={flow.trust}
          quote={flow.label}
          sources={flow.source ? [{ title: flow.source }] : []}
        />
      </div>
    </div>
  );
}
