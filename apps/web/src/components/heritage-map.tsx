"use client";
import { useEffect, useRef, useState } from "react";
import { demoRegion } from "@akar/api-client";
import { colors } from "@akar/design-tokens";
import {
  CITY_MARKER_MAX_ZOOM,
  type CityRecord,
  type HeritageSite,
  type MapSettings,
} from "@akar/domain";
import type { Map as MapType, Marker as MarkerType } from "maplibre-gl";
import type { MapModels } from "../lib/map-models";
import { useCities, useCityScenes } from "./city-scenes";
import {
  LocateFixed,
  Plus,
  Minus,
  Layers,
  Compass,
  MapPin,
  RotateCcw,
} from "lucide-react";
const pins = {
  cami: "e269f.svg",
  turbe: "e269f.svg",
  cesme: "d42c6.svg",
  hamam: "29586.svg",
  han: "c4a6c.svg",
  bedesten: "c4a6c.svg",
  egitim: "65acc.svg",
};
const WIDE = "(min-width: 1000px)";
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
function comingSoon(city: CityRecord) {
  const inv = city.inventory;
  return `${city.name}: ${inv?.siteCount ? `${inv.siteCount} vakıf eseri ` : ""}envanterde belgelendi${inv?.year ? ` (${inv.year})` : ""}. Uygulamaya ekleniyor.`;
}
export function HeritageMap({
  sites,
  selectedId,
  onSelect,
  routeIds,
  collapsed,
  mapSettings,
}: {
  sites: HeritageSite[];
  selectedId?: string;
  onSelect: (id: string) => void;
  routeIds: string[];
  collapsed: boolean;
  /** Without settings the map draws no models (the route preview in the panel). */
  mapSettings?: MapSettings;
}) {
  const scenes = useCityScenes();
  const cities = useCities();
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    markers = useRef<MarkerType[]>([]),
    cityMarkers = useRef<MarkerType[]>([]),
    models = useRef<MapModels | null>(null),
    selectRef = useRef(onSelect),
    // Set once the visitor moves the map: a late city record must not pull the map back.
    moved = useRef(false),
    latest = useRef({ sites, mapSettings, scenes, cities });
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [tilt, setTilt] = useState(false),
    [cityMode, setCityMode] = useState<
      "" | " city-mode" | " city-mode city-far"
    >(""),
    [notice, setNotice] = useState("");
  selectRef.current = onSelect;
  latest.current = { sites, mapSettings, scenes, cities };
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
            pitch: 0,
            minZoom: 1.2,
            attributionControl: { compact: true },
            style: "/harita/akar-style.json",
          });
          map.current = m;
          // Only a visitor's gesture carries an original DOM event; jumpTo and flyTo from code do not.
          m.on("movestart", (e) => {
            if (e.originalEvent) moved.current = true;
          });
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
            // A load event can follow a tile error; keep discovery available
            // through the schematic view for the lifetime of this map.
            // Models and the OSM building layer are an addition: whatever
            // goes wrong there leaves markers and the base map as they are.
            if (!latest.current.mapSettings) return;
            import("../lib/map-models")
              .then(({ createMapModels }) => {
                if (disposed) return;
                models.current = createMapModels(
                  m,
                  lib.MercatorCoordinate,
                  (id) => selectRef.current(id),
                );
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
      markers.current.forEach((m) => m.remove());
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
              ? `${city.name}: ${city.siteCount} eser, haritada aç`
              : `${city.name}: yakında`,
          );
          const dot = document.createElement("i");
          const name = document.createElement("b");
          name.textContent = city.name;
          const count = document.createElement("small");
          count.textContent = city.siteCount
            ? `${city.siteCount} eser`
            : "Yakında";
          el.append(dot, name, count);
          el.onclick = () => {
            if (!city.siteCount) return setNotice(comingSoon(city));
            setNotice("");
            m.flyTo({
              ...cityView(city),
              pitch: 0,
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
  }, [cities, loaded]);
  useEffect(() => {
    const m = map.current;
    if (!loaded || !m) return;
    let cancelled = false;
    import("maplibre-gl").then((lib) => {
      if (cancelled) return;
      markers.current.forEach((marker) => marker.remove());
      markers.current = sites.map((site) => {
        // MapLibre owns the outer transform; button interaction styles must not animate it.
        const anchor = document.createElement("div");
        anchor.className = "map-marker";
        anchor.setAttribute("role", "presentation");
        anchor.dataset.siteId = site.id;
        const el = document.createElement("button");
        el.type = "button";
        el.className = `map-pin ${site.id === selectedId ? "selected" : ""}`;
        el.setAttribute("aria-label", `${site.name} haritada aç`);
        const img = document.createElement("img");
        img.src = `/figma/${pins[site.kind]}`;
        img.alt = "";
        if (site.kind === "egitim") {
          const label = document.createElement("span");
          label.className = "education-pin";
          label.textContent = "E";
          el.append(label);
        } else el.append(img);
        if (routeIds.includes(site.id)) {
          const number = document.createElement("span");
          number.textContent = String(routeIds.indexOf(site.id) + 1);
          el.append(number);
        }
        el.onclick = () => selectRef.current(site.id);
        anchor.append(el);
        return new lib.Marker({ element: anchor, anchor: "bottom" })
          .setLngLat(site.coordinates)
          .addTo(m);
      });
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
      const source = m.getSource("route") as
        import("maplibre-gl").GeoJSONSource | undefined;
      if (source) source.setData(data);
      else {
        m.addSource("route", { type: "geojson", data });
        m.addLayer({
          id: "route",
          type: "line",
          source: "route",
          minzoom: CITY_MARKER_MAX_ZOOM,
          paint: {
            "line-color": colors.cityBursa,
            "line-width": 3,
            "line-dasharray": [2, 2],
          },
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sites, selectedId, routeIds, loaded]);
  useEffect(() => {
    if (mapSettings) models.current?.update(sites, mapSettings, scenes);
  }, [sites, mapSettings, scenes, loaded]);
  useEffect(() => {
    const site = sites.find((s) => s.id === selectedId);
    if (site && loaded)
      map.current?.easeTo({
        center: site.coordinates,
        zoom: 16,
        duration: 600,
      });
  }, [selectedId, loaded, sites]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(() => map.current?.resize());
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [collapsed]);
  function locate() {
    if (!navigator.geolocation) {
      setNotice("Tarayıcın konumu desteklemiyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        map.current?.flyTo({
          center: [p.coords.longitude, p.coords.latitude],
          zoom: 15,
        });
        setNotice("Konumuna gidildi. Eserler Bursa keşif bölgesinde.");
      },
      () =>
        setNotice(
          "Konum alınamadı. Bursa keşif bölgesinde keşfe devam edebilirsin.",
        ),
      { timeout: 8000 },
    );
  }
  return (
    <div className={`map-wrap${cityMode}`}>
      <div
        ref={container}
        className="map-canvas"
        aria-label="Bursa eser haritası"
      />
      {(!loaded || failed) && (
        <div className="map-fallback">
          <div className="fallback-grid" />
          <span className="water-label">HANLAR BÖLGESİ</span>
          <div className="fallback-note">
            <MapPin size={16} />
            {failed
              ? "Harita yüklenemedi · Şematik konum görünümü"
              : "Harita hazırlanıyor · Şematik konum görünümü"}
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
                <img src={`/figma/${pins[site.kind]}`} alt="" />
              )}
              <span>{site.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="map-location">
        <span className="live-dot" />
        Bursa <span>/</span> Hanlar Bölgesi <TagText />
      </div>
      <div className="map-tools">
        <button
          className="icon-btn"
          title="Konumuma git"
          aria-label="Konumuma git"
          onClick={locate}
        >
          <LocateFixed size={20} />
        </button>
        <button
          className="icon-btn"
          aria-label="Yakınlaştır"
          onClick={() => map.current?.zoomIn()}
          disabled={!loaded}
        >
          <Plus size={20} />
        </button>
        <button
          className="icon-btn"
          aria-label="Uzaklaştır"
          onClick={() => map.current?.zoomOut()}
          disabled={!loaded}
        >
          <Minus size={20} />
        </button>
        <button
          className={`icon-btn ${tilt ? "active" : ""}`}
          aria-label="Harita eğimini değiştir"
          disabled={!loaded}
          onClick={() => {
            setTilt(!tilt);
            map.current?.easeTo({ pitch: tilt ? 0 : 50, duration: 500 });
          }}
        >
          <Layers size={20} />
        </button>
      </div>
      <button
        className="compass icon-btn"
        aria-label="Keşif bölgesine dön"
        onClick={() => {
          map.current?.easeTo({
            ...openingView(cities),
            bearing: 0,
            pitch: 0,
          });
          setTilt(false);
        }}
      >
        <Compass size={28} />
      </button>
      {notice && (
        <button className="location-notice" onClick={() => setNotice("")}>
          {notice} ×
        </button>
      )}
      <div className="map-caption">
        <span>
          <i className="dot dini" />
          Dinî
        </span>
        <span>
          <i className="dot su" />
          Su
        </span>
        <span>
          <i className="dot egitim" />
          Eğitim
        </span>
        <span>
          <i className="dot akar" />
          Akar
        </span>
      </div>
      {failed && (
        <button className="map-retry" onClick={() => window.location.reload()}>
          <RotateCcw size={14} />
          Yeniden dene
        </button>
      )}
    </div>
  );
}
function TagText() {
  return <small>HANLAR BÖLGESİ</small>;
}
