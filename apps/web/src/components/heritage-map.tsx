"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { mapPixelRatio } from "../lib/device";
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

// The map's library (~800 KB) starts downloading as soon as this module is read, alongside the rest of the app,
// instead of when the map first mounts.
if (typeof window !== "undefined") void import("maplibre-gl");
import { followTheme, MAP_SKY, mapStyle } from "../lib/map-theme";
import { currentTheme, type Theme } from "../lib/theme";
import {
  PIN_LABEL_LAYER,
  PIN_LAYER,
  pinAt,
  pinFeatures,
  pinFiles,
  syncPins,
  themePinLabels,
} from "../lib/map-pins";
import { cityIdentityStyle } from "../lib/city-identity";
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
/** The globe view's sky in `theme` (colours in map-theme.ts); the atmosphere fades out as a city comes near. */
const sky = (theme: Theme) => ({
  ...MAP_SKY[theme],
  "sky-horizon-blend": 0.6,
  "horizon-fog-blend": 0.4,
  "fog-ground-blend": 1,
  "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 8, 0] as ["interpolate", ["linear"], ["zoom"], ...number[]],
});
/** Keeps the short card clear of the top of the map and of the right edge. */
const PEEK_WIDTH = 360;
/** On a phone the short card covers the bottom of the map: the picked site stands this far above the bottom edge. */
export const PEEK_INSET = 240;
const PEEK_TOP = 80;
/** Room kept between a pin and its short card, so the card never covers the site's model (about half a site wide). */
const PEEK_CLEAR = 120;
/** How long the short card glides to a new side. */
const PEEK_GLIDE_MS = 400;
/** Ease in and out: the glide starts and ends at rest, so it neither jolts off nor clicks into place. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
/** The camera's move to a newly picked site; the card follows it gliding, on the pin's right where the move ends. */
const SITE_EASE_MS = 700;
/** A site's pin keeps at least this zoom when it is picked. */
const SITE_ZOOM = 17;
/** Angled view the map opens with; the tilt button toggles between this and 0 (top view). Same as the prototype. */
const TILT_PITCH = 55;
/**
 * A phone (Muhammed, 3 Nov 2026: «yakınlaşınca 3D, uzaklaşınca 2D»): near enough for the models the map tilts into
 * 3D, out of that it lies flat with its photograph pins; a lower tilt there, as a tilted view loads tiles to the
 * horizon. The flat earth only: no globe, which a phone draws slowly.
 */
const PHONE_TILT_PITCH = 45;
const phoneMap = () => typeof window !== "undefined" && matchMedia("(max-width: 899.98px)").matches;
const tiltPitch = () => (phoneMap() ? PHONE_TILT_PITCH : TILT_PITCH);
/** The opening view turns a little west of north, as the prototype opens (models and labels read better). */
const OPENING_BEARING = -12;
/** Where the globe flies out to: Türkiye whole on the screen. */
const COUNTRY = {
  center: [34.5, 39.2] as [number, number],
  zoom: 4.4,
  zoomWide: 6,
};
/**
 * Only Türkiye (Muhammed, 3 Nov 2026: «tüm dünya gözüküyor, gerek yok»): the map does not leave the country and its
 * neighbours' edges, and does not zoom out past the whole country. Fewer far-away tiles, nothing to get lost in.
 */
const TURKEY_BOUNDS: [[number, number], [number, number]] = [[20, 32], [50, 46]];
const MIN_ZOOM = 4;
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
  /** Back from a site's page: the map stays as it was when the site is in view, and goes there when it is not. */
  | { key: number; to: "site"; point: LngLat }
  | { key: number; to: "route"; points: LngLat[] }
  /** A city picked from the city button's menu (3 Nov 2026): straight there, «ışınlanır». */
  | { key: number; to: "city"; name: string };
export function HeritageMap({
  resting = false,
  sites,
  selectedId,
  highlightId,
  onSelect,
  onOpen,
  onClear,
  routeIds,
  buildingRoute = false,
  collapsed,
  mapSettings,
  focusCity,
  onFirstDraw,
  onSettled,
  onCityInView,
  onWholeCountry,
  onLocate,
  flight,
  bottomInset = 0,
  insetDragging = false,
  peek,
  finishedIds,
  routeColour = colors.cityBursa,
}: {
  /** Hidden behind a site's page, kept for the way back: no model downloads meanwhile. */
  resting?: boolean;
  sites: HeritageSite[];
  selectedId?: string | undefined;
  /** A site the list points at (a row under the pointer): its pin shows as selected, the camera stays. */
  highlightId?: string | undefined;
  onSelect: (id: string) => void;
  /** A double click on a site: its page. */
  onOpen?: (id: string) => void;
  /** A tap on the map itself, away from any site. */
  onClear?: () => void;
  routeIds: string[];
  buildingRoute?: boolean;
  collapsed: boolean;
  /** Without settings the map draws no models (the route preview in the panel). */
  mapSettings?: MapSettings;
  /** The city the visitor picked by name; the map goes there. */
  focusCity?: string;
  /** Called once the map has been drawn for the first time, or has given up (then the schematic view takes over). */
  onFirstDraw?: () => void;
  /** Called once the first view has fully come in (tiles, buildings and paint settled): a return to the map waits for it. */
  onSettled?: () => void;
  /** The city nearest to the map's centre whenever the map comes to rest. */
  onCityInView?: (city: CityRecord) => void;
  /** Zoomed out past the cities (true), or back at one (false). */
  onWholeCountry?: (whole: boolean) => void;
  /** The position button; the page decides what «near me» means. */
  onLocate?: () => void;
  flight?: MapFlight | undefined;
  /** Height of the sheet over the map on a phone: pins stay above it. */
  bottomInset?: number;
  /** The sheet is under the visitor's finger: the map follows it at once instead of gliding. */
  insetDragging?: boolean;
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
    countryRef = useRef(onWholeCountry),
    selectedRef = useRef(selectedId),
    peekRef = useRef<HTMLDivElement>(null),
    // The padding the map is moving to: a pick's glide and the sheet's inset must not undo each other.
    padTarget = useRef(""),
    leaderRef = useRef<SVGPathElement>(null),
    // The card's last side and site: a change of either glides the card there instead of jumping.
    peekPlace = useRef<{ site: string; onLeft: boolean } | null>(null),
    siteGlideUntil = useRef(0),
    // A glide in progress: where the card set out from, when, and for how long; each frame blends that start into
    // where the card belongs now, so a moving target is reached exactly when the glide ends.
    glide = useRef<{ left: number; top: number; start: number; ms: number } | null>(null),
    glideFrame = useRef(0),
    openRef = useRef(onOpen),
    // Set once the visitor moves the map: a late city record must not pull the map back.
    moved = useRef(false),
    latest = useRef({ sites, mapSettings, scenes, cities }),
    restingRef = useRef(resting);
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [cityMode, setCityMode] = useState<
      "" | " city-mode" | " city-mode city-far"
    >(""),
    [notice, setNotice] = useState("");
  selectRef.current = onSelect;
  openRef.current = onOpen;
  clearRef.current = onClear;
  cityRef.current = onCityInView;
  countryRef.current = onWholeCountry;
  selectedRef.current = selectedId;
  latest.current = { sites, mapSettings, scenes, cities };
  restingRef.current = resting;
  useEffect(() => {
    models.current?.setResting(resting);
  }, [resting]);
  /**
   * Puts the short card `PEEK_CLEAR` to the right of its pin, level with it, and draws the thin line from the card to the
   * pin. Where the right side has no room the card goes as far to the pin's left, so the site stays in view.
   * On a phone the stylesheet docks the card and hides the line; these values are then ignored.
   */
  const placePeek = () => {
    const card = peekRef.current,
      m = map.current,
      site = latest.current.sites.find((s) => s.id === selectedRef.current);
    // A card that opens again starts where it belongs, it does not glide in from the last one's place.
    if (!card) {
      peekPlace.current = null;
      glide.current = null;
    }
    if (!card || !m || !site) return;
    const point = m.project(site.coordinates),
      width = container.current?.clientWidth ?? 0,
      height = container.current?.clientHeight ?? 0,
      cardHeight = card.offsetHeight;
    const last = peekPlace.current,
      now = performance.now();
    if (last && last.site !== site.id) siteGlideUntil.current = now + SITE_EASE_MS;
    // While the camera moves to a new site the pin crosses the map: the card stays on the right, where the move ends.
    const easing = now < siteGlideUntil.current,
      onLeft = !easing && point.x + PEEK_CLEAR + PEEK_WIDTH > width - 20;
    const left = Math.max(
      16,
      Math.min(width - PEEK_WIDTH - 20, onLeft ? point.x - PEEK_CLEAR - PEEK_WIDTH : point.x + PEEK_CLEAR),
    );
    const top = Math.max(PEEK_TOP, Math.min(height - cardHeight - 16, point.y - cardHeight / 2));
    // Following the pin while the map moves stays immediate; only a new side or a new site glides, frame by frame
    // until it is done (with or without the map moving). Reduced motion goes straight there.
    if (last && (last.site !== site.id || last.onLeft !== onLeft) && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      glide.current = {
        left: parseFloat(card.style.left) || left,
        top: parseFloat(card.style.top) || top,
        start: now,
        ms: easing ? siteGlideUntil.current - now : PEEK_GLIDE_MS,
      };
      cancelAnimationFrame(glideFrame.current);
      const frame = () => {
        placePeek();
        if (glide.current) glideFrame.current = requestAnimationFrame(frame);
      };
      glideFrame.current = requestAnimationFrame(frame);
    }
    peekPlace.current = { site: site.id, onLeft };
    let shownLeft = left,
      shownTop = top;
    const g = glide.current;
    if (g) {
      const t = Math.min(1, (now - g.start) / g.ms),
        k = easeInOut(t);
      shownLeft = g.left + (left - g.left) * k;
      shownTop = g.top + (top - g.top) * k;
      if (t === 1) glide.current = null;
    }
    card.style.left = `${shownLeft}px`;
    card.style.top = `${shownTop}px`;
    const line = leaderRef.current;
    if (!line) return;
    // From the card's near edge where it is now, level with the pin as far as the card reaches, to the pin.
    const fromX = onLeft ? shownLeft + PEEK_WIDTH : shownLeft,
      fromY = Math.max(shownTop + 28, Math.min(shownTop + cardHeight - 28, point.y));
    line.setAttribute("d", `M${fromX} ${fromY}L${point.x} ${point.y}`);
    line.nextElementSibling?.setAttribute("cx", String(point.x));
    line.nextElementSibling?.setAttribute("cy", String(point.y));
  };
  const drawnRef = useRef(onFirstDraw);
  drawnRef.current = onFirstDraw;
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  useEffect(() => {
    if (loaded || failed) drawnRef.current?.();
  }, [loaded, failed]);
  useEffect(() => {
    let disposed = false,
      unfollow: (() => void) | undefined;
    import("maplibre-gl")
      .then((lib) => {
        if (disposed || !container.current) return;
        try {
          lib.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
          const m = new lib.Map({
            container: container.current,
            ...openingView(latest.current.cities),
            pitch: tiltPitch(),
            bearing: OPENING_BEARING,
            minZoom: MIN_ZOOM,
            maxBounds: TURKEY_BOUNDS,
            renderWorldCopies: false,
            maxZoom: 19.5,
            maxPitch: 65,
            // Phones report up to 3.5 pixels per CSS pixel; the map with its buildings and models draws at most 2
            // (1.5 on a modest phone): the difference is hard to see and the GPU's work drops by half or more.
            pixelRatio: mapPixelRatio(),
            attributionControl: { compact: true },
            style: mapStyle(),
          });
          map.current = m;
          // The credit stays one small «i» until it is tapped: MapLibre opens it on the first draw and on resizes.
          const closeCredit = () =>
            container.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
          m.on("load", closeCredit);
          m.on("resize", closeCredit);
          unfollow = followTheme(m, (theme) => {
            m.setSky(sky(theme));
            themePinLabels(m);
            models.current?.setTheme(theme);
          });
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
          // A double click on a site opens its page instead of zooming in.
          m.on("dblclick", (e) => {
            const id =
              pinAt(m, e.point.x, e.point.y) ??
              models.current?.pick(e.point.x, e.point.y);
            if (!id || !openRef.current) return;
            e.preventDefault();
            openRef.current(id);
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
            countryRef.current?.(z < CITY_MARKER_MAX_ZOOM);
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
            if (!phoneMap()) m.setProjection({ type: "globe" });
            // A phone tilts into 3D where the models show and lies flat out of it, when the zoom crosses that line
            // (a press on 2D / 3D in between is kept).
            if (phoneMap()) {
              const near = () => m.getZoom() >= (latest.current.mapSettings?.modelMinZoom ?? 16) - 0.25;
              let wasNear = near();
              m.on("zoomend", () => {
                const now = near();
                if (now === wasNear) return;
                wasNear = now;
                const tilted = m.getPitch() > 5;
                if (now && !tilted) m.easeTo({ pitch: PHONE_TILT_PITCH, duration: 450 });
                else if (!now && tilted) m.easeTo({ pitch: 0, bearing: 0, duration: 450 });
              });
            }
            m.setSky(sky(currentTheme()));
            mode();
            setLoaded(true);
            // The models' layer repaints all the time, so the map is never «idle»: settled is when its tiles
            // (buildings among them) have all come in, twice in a row a moment apart.
            let calm = 0;
            const watch = setInterval(() => {
              if (disposed) return clearInterval(watch);
              calm = m.areTilesLoaded() ? calm + 1 : 0;
              if (calm < 2) return;
              clearInterval(watch);
              settledRef.current?.();
              addModels();
            }, 200);
            // The models (several MB) wait for the base map: it shows first, then they come. At most 4 s.
            setTimeout(() => addModels(), 4000);
            reportCity();
            // A load event can follow a tile error; keep discovery available
            // through the schematic view for the lifetime of this map.
            // Models and the OSM building layer are an addition: whatever
            // goes wrong there leaves the pins and the base map as they are.
            let modelsAdded = false;
            function addModels() {
              if (modelsAdded || disposed || !latest.current.mapSettings) return;
              modelsAdded = true;
            import("../lib/map-models")
              .then(({ createMapModels }) => {
                if (disposed) return;
                models.current = createMapModels(m, lib.MercatorCoordinate);
                models.current.setResting(restingRef.current);
                if (latest.current.mapSettings)
                  models.current.update(
                    latest.current.sites,
                    latest.current.mapSettings,
                    latest.current.scenes,
                  );
              })
              .catch(() => {});
            }
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
      unfollow?.();
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
      pitch: m.getPitch() > 5 ? tiltPitch() : 0,
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
          // A city with an emblem shows it in place of the dot, in the city's colours.
          const look = cityIdentityStyle(city.identity) as Record<string, string>;
          if ("--sehir-amblem" in look) {
            for (const [key, value] of Object.entries(look)) el.style.setProperty(key, value);
            dot.className = "city-emblem";
          }
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
              pitch: m.getPitch() > 5 ? tiltPitch() : 0,
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
      pinFeatures(sites, routeIds, highlightId ?? selectedId, {
        ...(finishedIds && { finishedIds }),
        accent: routeColour,
        buildingRoute,
        lang,
        photos: true,
      }),
      () => cancelled,
      routeColour,
    ).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [sites, selectedId, highlightId, routeIds, loaded, finishedIds, routeColour, lang, buildingRoute]);
  useEffect(() => {
    if (mapSettings) models.current?.update(sites, mapSettings, scenes);
  }, [sites, mapSettings, scenes, loaded]);
  // A new pick goes to the site; a background refresh of `sites` must not pull the camera back.
  useEffect(() => {
    const m = map.current,
      site = latest.current.sites.find((s) => s.id === selectedId);
    if (!site || !loaded || !m) return;
    // A site of another city (picked from a search) is a jump: a glide at street level across the country only
    // shows blurred tiles.
    const here = m.getCenter();
    const far = Math.hypot(here.lng - site.coordinates[0], here.lat - site.coordinates[1]) > 0.5;
    const padding = matchMedia(WIDE).matches
      ? { right: PEEK_WIDTH + 20, top: 0, bottom: 0, left: 0 }
      : { top: 110, bottom: PEEK_INSET, left: 0, right: 0 };
    padTarget.current = JSON.stringify(padding);
    m.easeTo({
      center: site.coordinates,
      zoom: Math.max(m.getZoom(), SITE_ZOOM),
      duration: far ? 0 : SITE_EASE_MS,
      padding,
    });
  }, [selectedId, loaded]);
  useEffect(() => {
    placePeek();
  });
  // On a phone the sheet covers the bottom of the map: the map's centre moves up with it. It glides there (a card
  // closing, a tab, a route) and follows the finger at once while the sheet is dragged.
  useEffect(() => {
    const m = map.current;
    if (!loaded || !m || matchMedia(WIDE).matches) return;
    const padding = { top: 110, bottom: Math.round(Math.min(bottomInset, innerHeight * 0.6)), left: 0, right: 0 };
    const key = JSON.stringify(padding);
    if (key === padTarget.current) return;
    padTarget.current = key;
    if (insetDragging || matchMedia("(prefers-reduced-motion: reduce)").matches) m.setPadding(padding);
    else m.easeTo({ padding, duration: 280 });
  }, [bottomInset, insetDragging, loaded]);
  useEffect(() => {
    const m = map.current;
    if (!flight || !loaded || !m) return;
    moved.current = true;
    const flat = { left: 0, right: 0, top: 0, bottom: 0 };
    if (flight.to === "point")
      m.easeTo({ center: flight.point, zoom: 16.5, duration: 900 });
    else if (flight.to === "city") {
      const city = latest.current.cities.find((c) => c.name === flight.name && c.map);
      if (!city) return;
      // A short fly, as a jump: far enough to feel the move, quick enough not to wait.
      m.flyTo({
        ...cityView(city),
        pitch: tiltPitch(),
        bearing: 0,
        padding: flat,
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1400,
        curve: 1.8,
        essential: true,
      });
    }
    else if (flight.to === "site") {
      if (m.getBounds().contains(flight.point)) return;
      const here = m.getCenter();
      // Another city is a jump, not a flight across the country; the city's own street level (or the visitor's).
      const far = Math.hypot(here.lng - flight.point[0], here.lat - flight.point[1]) > 0.5;
      const view = { center: flight.point, zoom: Math.max(m.getZoom(), SITE_ZOOM - 1) };
      if (far) m.jumpTo(view);
      else m.easeTo({ ...view, duration: 900 });
    }
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
        pitch: tiltPitch(),
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
        tiltPitch={tiltPitch()}
        onMove={() => {
          moved.current = true;
        }}
        onLocate={() => onLocate?.()}
      />
      {selectedId && peek && (
        <>
          {/* The thin line from the short card to its pin; placed by `placePeek`. */}
          <svg className="peek-leader" aria-hidden="true">
            <path ref={leaderRef} />
            <circle r="3" />
          </svg>
          <div ref={peekRef} className="peek-anchor">
            {peek}
          </div>
        </>
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
