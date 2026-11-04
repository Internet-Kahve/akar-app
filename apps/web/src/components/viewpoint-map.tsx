"use client";
import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MapType } from "maplibre-gl";
import type { HeritageSite, HistoryImage, HistoryViewpoint } from "@akar/domain";
import { coneReach, viewCone } from "../lib/viewpoint";
import { useI18n } from "./i18n";
import { followTheme, mapStyle } from "../lib/map-theme";

const GREEN = "#2E7D32";
const empty = { type: "FeatureCollection" as const, features: [] };
const point = (v: HistoryViewpoint, properties: Record<string, number> = {}) => ({
  type: "Feature" as const,
  properties,
  geometry: { type: "Point" as const, coordinates: [v.lng, v.lat] },
});

/**
 * «Nereden çekildi?» (prototype `ggHaritaKur`): the selected photograph's viewpoint and green view cone, the site's
 * other shots as small green dots (a tap selects one), every other site's old photographs in grey, and the sites'
 * names. It frames the viewpoint, the site and the cone when it opens, then follows the selection.
 */
export function ViewpointMap({
  site,
  sites,
  images,
  selected,
  onSelect,
}: {
  site: HeritageSite;
  sites: HeritageSite[];
  images: HistoryImage[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const { t, text } = useI18n();
  const box = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    lib = useRef<typeof import("maplibre-gl") | null>(null),
    ready = useRef(false),
    pick = useRef(onSelect);
  pick.current = onSelect;
  const draw = (fit: boolean) => {
    const m = map.current,
      image = images[selected];
    if (!m || !ready.current || !image) return;
    const v = image.viewpoint,
      reach = v && coneReach(v, site.coordinates),
      own = new Set(images.map((i) => i.id));
    m.getSource<GeoJSONSource>("gg-bu")?.setData({
      type: "FeatureCollection",
      features: images.flatMap((i, index) => (i.viewpoint && index !== selected ? [point(i.viewpoint, { i: index })] : [])),
    });
    m.getSource<GeoJSONSource>("gg-diger")?.setData({
      type: "FeatureCollection",
      features: sites.flatMap((s) =>
        (s.historyImages ?? []).flatMap((i) => (i.viewpoint && !own.has(i.id) ? [point(i.viewpoint)] : [])),
      ),
    });
    m.getSource<GeoJSONSource>("gg-secili")?.setData(v ? { type: "FeatureCollection", features: [point(v)] } : empty);
    const cone = v && viewCone(v, reach);
    m.getSource<GeoJSONSource>("gg-koni")?.setData(
      cone ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [cone] } } : empty,
    );
    if (!v || !cone) return;
    if (fit && lib.current) {
      const bounds = new lib.current.LngLatBounds([v.lng, v.lat], [v.lng, v.lat]);
      bounds.extend(site.coordinates);
      cone.forEach((c) => bounds.extend(c));
      m.fitBounds(bounds, { padding: 28, maxZoom: 17.5, duration: 0 });
    } else m.easeTo({ center: [v.lng, v.lat], duration: 400 });
  };
  useEffect(() => {
    let disposed = false,
      unfollow: (() => void) | undefined;
    import("maplibre-gl")
      .then((maplibre) => {
        if (disposed || !box.current) return;
        lib.current = maplibre;
        maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        const m = new maplibre.Map({
          container: box.current,
          style: mapStyle(),
          center: site.coordinates,
          zoom: 16,
          attributionControl: false,
          fadeDuration: 0,
          pitchWithRotate: false,
          dragRotate: false,
        });
        unfollow = followTheme(m);
        map.current = m;
        m.on("style.load", () => {
          if (disposed) return;
          if (m.getLayer("building_3d")) m.setLayoutProperty("building_3d", "visibility", "none");
          for (const id of ["gg-koni", "gg-diger", "gg-bu", "gg-secili"])
            if (!m.getSource(id)) m.addSource(id, { type: "geojson", data: empty });
          if (m.getLayer("gg-koni")) return draw(false);
          m.addLayer({ id: "gg-koni", type: "fill", source: "gg-koni", paint: { "fill-color": GREEN, "fill-opacity": 0.22 } });
          m.addLayer({
            id: "gg-koni-cizgi",
            type: "line",
            source: "gg-koni",
            paint: { "line-color": GREEN, "line-width": 1.5, "line-opacity": 0.7 },
          });
          m.addLayer({
            id: "gg-diger",
            type: "circle",
            source: "gg-diger",
            paint: { "circle-radius": 4, "circle-color": "#6B7280", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 },
          });
          m.addLayer({
            id: "gg-bu",
            type: "circle",
            source: "gg-bu",
            paint: { "circle-radius": 6, "circle-color": GREEN, "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
          });
          m.addLayer({
            id: "gg-secili",
            type: "circle",
            source: "gg-secili",
            paint: { "circle-radius": 11, "circle-color": GREEN, "circle-stroke-color": "#fff", "circle-stroke-width": 3 },
          });
          m.on("click", "gg-bu", (e) => {
            const index = e.features?.[0]?.properties?.i;
            if (typeof index === "number") pick.current(index);
          });
          m.on("mouseenter", "gg-bu", () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", "gg-bu", () => (m.getCanvas().style.cursor = ""));
          ready.current = true;
          draw(true);
        });
        for (const s of sites) {
          const label = document.createElement("div");
          label.className = s.id === site.id ? "gg-etiket bu" : "gg-etiket";
          label.textContent = text(s.name, s.nameEn);
          new maplibre.Marker({ element: label }).setLngLat(s.coordinates).addTo(m);
        }
      })
      .catch(() => {});
    return () => {
      disposed = true;
      unfollow?.();
      ready.current = false;
      map.current?.remove();
      map.current = null;
    };
    // The map is made once; the selection redraws it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => draw(false), [selected, images]);
  return <div ref={box} className="gg-harita" aria-label={t("site.viewpointMap")} />;
}
