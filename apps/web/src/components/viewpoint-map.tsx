"use client";
import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MapType } from "maplibre-gl";
import type { HistoryImage } from "@akar/domain";
import { viewCone } from "../lib/viewpoint";
import { useI18n } from "./i18n";

const featureOf = (image: HistoryImage) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "Polygon" as const,
    coordinates: [viewCone(image.viewpoint!)],
  },
});

/** Where the selected photograph was taken from, its view, and the site's other known shots in grey. */
export function ViewpointMap({
  images,
  selected,
}: {
  images: HistoryImage[];
  selected: HistoryImage;
}) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    ready = useRef(false);
  const draw = () => {
    const m = map.current,
      v = selected.viewpoint;
    if (!m || !ready.current || !v) return;
    m.getSource<GeoJSONSource>("shots")?.setData({
      type: "FeatureCollection",
      features: images
        .filter((i) => i.viewpoint && i.id !== selected.id)
        .map(featureOf),
    });
    m.getSource<GeoJSONSource>("shot")?.setData(featureOf(selected));
    m.easeTo({ center: [v.lng, v.lat], zoom: 15.5, duration: 500 });
  };
  useEffect(() => {
    let disposed = false;
    import("maplibre-gl")
      .then((lib) => {
        const v = selected.viewpoint;
        if (disposed || !box.current || !v) return;
        lib.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        const m = new lib.Map({
          container: box.current,
          style: "/harita/akar-style.json",
          center: [v.lng, v.lat],
          zoom: 15.5,
          attributionControl: { compact: true },
          dragRotate: false,
        });
        map.current = m;
        m.on("load", () => {
          if (disposed) return;
          const empty = { type: "FeatureCollection" as const, features: [] };
          m.addSource("shots", { type: "geojson", data: empty });
          m.addSource("shot", { type: "geojson", data: empty });
          m.addLayer({
            id: "shots",
            type: "fill",
            source: "shots",
            paint: { "fill-color": "#8C948F", "fill-opacity": 0.22 },
          });
          m.addLayer({
            id: "shot",
            type: "fill",
            source: "shot",
            paint: { "fill-color": "#2E6B4C", "fill-opacity": 0.42 },
          });
          m.addLayer({
            id: "shot-edge",
            type: "line",
            source: "shot",
            paint: { "line-color": "#2E6B4C", "line-width": 1.5 },
          });
          ready.current = true;
          draw();
        });
      })
      .catch(() => {});
    return () => {
      disposed = true;
      ready.current = false;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(draw, [selected, images]);
  return <div ref={box} className="viewpoint-map" aria-label={t("site.viewpointMap")} />;
}
