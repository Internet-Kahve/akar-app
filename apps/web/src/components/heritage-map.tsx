"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { demoRegion } from "@akar/api-client";
import { colors } from "@akar/design-tokens";
import {
  CITY_MARKER_MAX_ZOOM,
  type CityRecord,
  type HeritageSite,
  type MapSettings,
} from "@akar/domain";
import type {
  GeoJSONSource,
  Map as MapType,
  Marker as MarkerType,
} from "maplibre-gl";
import type { MapModels } from "../lib/map-models";
import {
  PIN_LABEL_LAYER,
  PIN_LAYER,
  pinAt,
  pinFeatures,
  pinFiles,
  syncPins,
} from "../lib/map-pins";
import { nearestCity, type LngLat } from "../lib/nearby";
import { useCities, useCityScenes } from "./city-scenes";
import { MapControls } from "./map-controls";
import { useI18n, type I18n } from "./i18n";
import { MapPin, RotateCcw } from "lucide-react";
declare global {
  interface Window {
    /** The discovery map; browser tests read pins and project coordinates through it. Development builds only. */
    akarMap?: MapType;
  }
}
const WIDE = "(min-width: 900px)";
/** Keeps the short card clear of the top of the map and of the right edge. */
const PEEK_WIDTH = 360;
const PEEK_TOP = 80;
/** A site's pin keeps at least this zoom when it is picked. */
const SITE_ZOOM = 17;
/** Angled view the map opens with; the tilt button toggles between this and 0 (top view). */
const TILT_PITCH = 50;
/** Where the globe flies out to: Türkiye whole on the screen. */
const COUNTRY = {
  center: [34.5, 39.2] as [number, number],
  zoom: 3.6,
  zoomWide: 4.6,
};
/** The city's opening view (desktop zoom on a wide screen). */
function cityView(city: CityRecord) {
  const map = city.map!;
  const wide = matchMedia(WIDE).matches;
  return {
    center: map.center,
    zoom: wide ? (map.zoomDesktop ?? map.zoom) : map.zoom,
  };
}
/** The default city's view; the demo region until the city records are read (or when none is the default). */
function openingView(cities: CityRecord[]) {
  const city = cities.find((c) => c.isDefault && c.map);
  return city ? cityView(city) : { center: demoRegion.center, zoom: 16 };
}
/** The text a city marker says, and what tapping a city without sites tells (§11.45). */
function comingSoon(city: CityRecord, t: I18n["t"]) {
  const inv = city.inventory;
  return t("map.comingSoon", {
    name: city.name,
    sites: inv?.siteCount ? `${t("map.inventorySites", { count: inv.siteCount })} ` : "",
    year: inv?.year ? ` (${inv.year})` : "",
  });
}
/** A camera move the page asks for; a new `key` asks again. */
export type MapFlight =
  | { key: number; to: "globe" | "home" }
  | { key: number; to: "point"; point: LngLat }
  | { key: number; to: "route"; points: LngLat[] };
export function HeritageMap({
  sites,
  selectedId,
  onSelect,
  onClear,
  routeIds,
  collapsed,
  mapSettings,
  focusCity,
  onFirstDraw,
  onCityInView,
  onLocate,
  flight,
  bottomInset = 0,
  peek,
  finishedIds,
  routeColour = colors.cityBursa,
}: {
  sites: HeritageSite[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
  /** A tap on the map itself, away from any site. */
  onClear?: () => void;
  routeIds: string[];
  collapsed: boolean;
  /** Without settings the map draws no models (the route preview in the panel). */
  mapSettings?: MapSettings;
  /** The city the visitor picked by name; the map goes there. */
  focusCity?: string;
  /** Called once the map has been drawn for the first time, or has given up (then the schematic view takes over). */
  onFirstDraw?: () => void;
  /** The city nearest to the map's centre whenever the map comes to rest. */
  onCityInView?: (city: CityRecord) => void;
  /** The position button; the page decides what «near me» means. */
  onLocate?: () => void;
  flight?: MapFlight | undefined;
  /** Height of the sheet over the map on a phone: pins stay above it. */
  bottomInset?: number;
  /** The short card of the picked site; it follows the pin on a wide screen. */
  peek?: ReactNode;
  /** Sites whose story is finished: their pins carry a tick. */
  finishedIds?: string[];
  /** The route's city colour, for its line and stop stars. */
  routeColour?: string;
}) {
  const { lang, t, text } = useI18n();
  const scenes = useCityScenes();
  const cities = useCities();
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    cityMarkers = useRef<MarkerType[]>([]),
    models = useRef<MapModels | null>(null),
    selectRef = useRef(onSelect),
    clearRef = useRef(onClear),
    cityRef = useRef(onCityInView),
    selectedRef = useRef(selectedId),
    peekRef = useRef<HTMLDivElement>(null),
    // Set once the visitor moves the map: a late city record must not pull the map back.
    moved = useRef(false),
    latest = useRef({ sites, mapSettings, scenes, cities });
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [cityMode, setCityMode] = useState<
      "" | " city-mode" | " city-mode city-far"
    >(""),
    [notice, setNotice] = useState("");
  selectRef.current = onSelect;
  clearRef.current = onClear;
  cityRef.current = onCityInView;
  selectedRef.current = selectedId;
  latest.current = { sites, mapSettings, scenes, cities };
  /** Puts the short card beside its pin; on a phone the stylesheet docks it and ignores these. */
  const placePeek = () => {
    const card = peekRef.current,
      m = map.current,
      site = latest.current.sites.find((s) => s.id === selectedRef.current);
    if (!card || !m || !site) return;
    const point = m.project(site.coordinates),
      width = container.current?.clientWidth ?? 0;
    card.style.left = `${Math.min(width - PEEK_WIDTH - 20, Math.max(16, point.x + 28))}px`;
    card.style.top = `${Math.max(PEEK_TOP, point.y - 120)}px`;
  };
  const drawnRef = useRef(onFirstDraw);
  drawnRef.current = onFirstDraw;
  useEffect(() => {
    if (loaded || failed) drawnRef.current?.();
  }, [loaded, failed]);
  useEffect(() => {
    let disposed = false;
    import("maplibre-gl")
      .then((lib) => {
        if (disposed || !container.current) return;
        try {
          lib.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
          const m = new lib.Map({
            container: container.current,
            ...openingView(latest.current.cities),
            pitch: TILT_PITCH,
            minZoom: 1.2,
            attributionControl: { compact: true },
            style: "/harita/akar-style.json",
          });
          map.current = m;
          // Only a visitor's gesture carries an original DOM event; jumpTo and flyTo from code do not.
          m.on("movestart", (e) => {
            if (e.originalEvent) moved.current = true;
          });
          // A site opens from its pin; where none is, from the model under the pointer.
          m.on("click", (e) => {
            const id =
              pinAt(m, e.point.x, e.point.y) ??
              models.current?.pick(e.point.x, e.point.y);
            if (id) selectRef.current(id);
            else clearRef.current?.();
          });
          m.on("move", placePeek);
          const reportCity = () => {
            const { lng, lat } = m.getCenter();
            const city = nearestCity(latest.current.cities, [lng, lat]);
            if (city) cityRef.current?.(city);
          };
          m.on("moveend", reportCity);
          m.on("mouseenter", [PIN_LAYER, PIN_LABEL_LAYER], () => {
            m.getCanvas().style.cursor = "pointer";
          });
          m.on("mouseleave", [PIN_LAYER, PIN_LABEL_LAYER], () => {
            m.getCanvas().style.cursor = "";
          });
          if (process.env.NODE_ENV !== "production") window.akarMap = m;
          // Far out only dots stay for the cities without sites, so the labels do not pile up.
          const mode = () => {
            const z = m.getZoom();
            setCityMode(
              z >= CITY_MARKER_MAX_ZOOM
                ? ""
                : z < 3.2
                  ? " city-mode city-far"
                  : " city-mode",
            );
          };
          m.on("zoom", mode);
          m.on("load", () => {
            if (disposed) return;
            // Globe view (§11.45): far out the earth is round, near a city MapLibre turns flat by itself.
            m.setProjection({ type: "globe" });
            m.setSky({
              "sky-color": "#C9DCEB",
              "horizon-color": "#F3F5F5",
              "sky-horizon-blend": 0.6,
              "fog-color": "#F3F5F5",
              "horizon-fog-blend": 0.4,
              "fog-ground-blend": 1,
              "atmosphere-blend": [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                1,
                5,
                1,
                8,
                0,
              ],
            });
            mode();
            setLoaded(true);
            reportCity();
            // A load event can follow a tile error; keep discovery available
            // through the schematic view for the lifetime of this map.
            // Models and the OSM building layer are an addition: whatever
            // goes wrong there leaves the pins and the base map as they are.
            if (!latest.current.mapSettings) return;
            import("../lib/map-models")
              .then(({ createMapModels }) => {
                if (disposed) return;
                models.current = createMapModels(m, lib.MercatorCoordinate);
                if (latest.current.mapSettings)
                  models.current.update(
                    latest.current.sites,
                    latest.current.mapSettings,
                    latest.current.scenes,
                  );
              })
              .catch(() => {});
          });
          m.on("error", () => {
            if (!disposed) setFailed(true);
          });
        } catch {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      disposed = true;
      delete window.akarMap;
      models.current?.dispose();
      models.current = null;
      cityMarkers.current.forEach((m) => m.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);
  // The city records arrive after the map: open at the default city unless the visitor has moved already.
  useEffect(() => {
    if (loaded && !moved.current) map.current?.jumpTo(openingView(cities));
  }, [cities, loaded]);
  // Only a new pick moves the map: the cities come from a ref so a background refresh cannot pull the camera back.
  useEffect(() => {
    const m = map.current;
    const city = latest.current.cities.find(
      (c) => c.name === focusCity && c.map,
    );
    if (!loaded || !m || !city) return;
    moved.current = true;
    m.flyTo({
      ...cityView(city),
      pitch: m.getPitch() > 5 ? TILT_PITCH : 0,
      bearing: 0,
      duration: 2600,
      essential: true,
    });
  }, [focusCity, loaded]);
  // One marker per city on the map; shown below CITY_MARKER_MAX_ZOOM instead of the site pins (CSS `city-mode`).
  useEffect(() => {
    const m = map.current;
    if (!loaded || !m) return;
    let cancelled = false;
    import("maplibre-gl").then((lib) => {
      if (cancelled) return;
      cityMarkers.current.forEach((marker) => marker.remove());
      cityMarkers.current = cities
        .filter((c) => c.map)
        .map((city) => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = `city-marker${city.siteCount ? " ready" : ""}`;
          el.setAttribute(
            "aria-label",
            city.siteCount
              ? t("map.cityAria", { name: city.name, count: city.siteCount })
              : t("map.cityAriaSoon", { name: city.name }),
          );
          const dot = document.createElement("i");
          const name = document.createElement("b");
          name.textContent = city.name;
          const count = document.createElement("small");
          count.textContent = city.siteCount
            ? t("map.cityCount", { count: city.siteCount })
            : t("map.soon");
          el.append(dot, name, count);
          el.onclick = () => {
            if (!city.siteCount) return setNotice(comingSoon(city, t));
            moved.current = true;
            setNotice("");
            m.flyTo({
              ...cityView(city),
              pitch: m.getPitch() > 5 ? TILT_PITCH : 0,
              bearing: 0,
              duration: 2600,
              essential: true,
            });
          };
          return new lib.Marker({
            element: el,
            anchor: "left",
            offset: [-7, 0],
          })
            .setLngLat(city.map!.center)
            .addTo(m);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [cities, loaded, t]);
  // The route line and the site pins follow the sites, the route and the selection (§11.48).
  useEffect(() => {
    const m = map.current;
    if (!loaded || !m) return;
    let cancelled = false;
    const coordinates = routeIds
      .map((id) => sites.find((s) => s.id === id)?.coordinates)
      .filter((x): x is [number, number] => !!x);
    const data: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates.length > 1 ? coordinates : [],
      },
    };
    const route = m.getSource<GeoJSONSource>("route");
    if (route) route.setData(data);
    else {
      m.addSource("route", { type: "geojson", data });
      m.addLayer({
        id: "route",
        type: "line",
        source: "route",
        minzoom: CITY_MARKER_MAX_ZOOM,
        paint: {
          "line-color": routeColour,
          "line-width": 4,
          "line-dasharray": [1.2, 1.2],
        },
      });
    }
    m.setPaintProperty("route", "line-color", routeColour);
    // The pins draw over the route line; without them the schematic view keeps discovery usable.
    syncPins(
      m,
      pinFeatures(sites, routeIds, selectedId, {
        ...(finishedIds && { finishedIds }),
        accent: routeColour,
        lang,
      }),
      () => cancelled,
      routeColour,
    ).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [sites, selectedId, routeIds, loaded, finishedIds, routeColour, lang]);
  useEffect(() => {
    if (mapSettings) models.current?.update(sites, mapSettings, scenes);
  }, [sites, mapSettings, scenes, loaded]);
  // A new pick goes to the site; a background refresh of `sites` must not pull the camera back.
  useEffect(() => {
    const m = map.current,
      site = latest.current.sites.find((s) => s.id === selectedId);
    if (!site || !loaded || !m) return;
    m.easeTo({
      center: site.coordinates,
      zoom: Math.max(m.getZoom(), SITE_ZOOM),
      duration: 700,
      padding: matchMedia(WIDE).matches
        ? { right: PEEK_WIDTH + 20, top: 0, bottom: 0, left: 0 }
        : { bottom: 240, top: 0, left: 0, right: 0 },
    });
  }, [selectedId, loaded]);
  useEffect(() => {
    placePeek();
  });
  // On a phone the sheet covers the bottom of the map: the map's centre moves up with it.
  useEffect(() => {
    if (!loaded || matchMedia(WIDE).matches) return;
    map.current?.setPadding({
      top: 110,
      bottom: Math.min(bottomInset, innerHeight * 0.6),
      left: 0,
      right: 0,
    });
  }, [bottomInset, loaded]);
  useEffect(() => {
    const m = map.current;
    if (!flight || !loaded || !m) return;
    moved.current = true;
    const flat = { left: 0, right: 0, top: 0, bottom: 0 };
    if (flight.to === "point")
      m.easeTo({ center: flight.point, zoom: 16.5, duration: 900 });
    else if (flight.to === "route") {
      const [first, ...rest] = flight.points;
      if (!first) return;
      const bounds = rest.reduce(
        (box, point) => {
          box[0] = Math.min(box[0], point[0]);
          box[1] = Math.min(box[1], point[1]);
          box[2] = Math.max(box[2], point[0]);
          box[3] = Math.max(box[3], point[1]);
          return box;
        },
        [first[0], first[1], first[0], first[1]] as [
          number,
          number,
          number,
          number,
        ],
      );
      m.fitBounds(bounds, {
        padding: { top: 110, left: 70, right: 150, bottom: 110 + bottomInset },
        maxZoom: 17,
        duration: 900,
      });
    }
    else if (flight.to === "home")
      m.easeTo({
        ...openingView(latest.current.cities),
        pitch: TILT_PITCH,
        bearing: 0,
        padding: flat,
        duration: 900,
      });
    else
      // `padding` lasts until it is changed: a card's padding would push the globe off centre.
      m.flyTo({
        center: COUNTRY.center,
        zoom: matchMedia(WIDE).matches ? COUNTRY.zoomWide : COUNTRY.zoom,
        pitch: 0,
        bearing: 0,
        padding: flat,
        duration: 2600,
        essential: true,
      });
  }, [flight, loaded]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(() => map.current?.resize());
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [collapsed]);
  return (
    <div className={`map-wrap${cityMode}`}>
      <div
        ref={container}
        className="map-canvas"
        aria-label={t("map.aria")}
      />
      {(!loaded || failed) && (
        <div className="map-fallback">
          <div className="fallback-grid" />
          <span className="water-label">{t("map.district")}</span>
          <div className="fallback-note">
            <MapPin size={16} />
            {failed
              ? t("map.failed")
              : t("map.preparing")}
          </div>
          {sites.map((site, i) => (
            <button
              key={site.id}
              className="fallback-pin"
              style={{
                left: `${15 + (i % 3) * 27}%`,
                top: `${24 + Math.floor(i / 3) * 32}%`,
              }}
              onClick={() => onSelect(site.id)}
            >
              {site.kind === "egitim" ? (
                <span className="education-pin">E</span>
              ) : (
                <img src={`/figma/${pinFiles[site.kind]}`} alt="" />
              )}
              <span>{text(site.name, site.nameEn)}</span>
            </button>
          ))}
        </div>
      )}
      <MapControls
        map={loaded ? map.current : null}
        ready={loaded}
        tiltPitch={TILT_PITCH}
        onMove={() => {
          moved.current = true;
        }}
        onLocate={() => onLocate?.()}
      />
      {selectedId && peek && (
        <div ref={peekRef} className="peek-anchor">
          {peek}
        </div>
      )}
      {notice && (
        <button className="location-notice" onClick={() => setNotice("")}>
          {notice} ×
        </button>
      )}
      {failed && (
        <button className="map-retry" onClick={() => window.location.reload()}>
          <RotateCcw size={14} />
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
