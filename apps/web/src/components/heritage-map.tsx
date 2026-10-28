"use client";
import { useEffect, useRef, useState } from "react";
import { demoRegion } from "@akar/api-client";
import { colors } from "@akar/design-tokens";
import type { HeritageSite, MapSettings } from "@akar/domain";
import type { Map as MapType, Marker as MarkerType } from "maplibre-gl";
import type { MapModels } from "../lib/map-models";
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
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    markers = useRef<MarkerType[]>([]),
    models = useRef<MapModels | null>(null),
    selectRef = useRef(onSelect),
    latest = useRef({ sites, mapSettings });
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [tilt, setTilt] = useState(false),
    [locationError, setLocationError] = useState("");
  selectRef.current = onSelect;
  latest.current = { sites, mapSettings };
  useEffect(() => {
    let disposed = false;
    import("maplibre-gl")
      .then((lib) => {
        if (disposed || !container.current) return;
        try {
          lib.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
          const m = new lib.Map({
            container: container.current,
            center: demoRegion.center,
            zoom: 16,
            pitch: 0,
            attributionControl: { compact: true },
            style: "/harita/akar-style.json",
          });
          map.current = m;
          m.on("load", () => {
            if (disposed) return;
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
      map.current?.remove();
      map.current = null;
    };
  }, []);
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
    if (mapSettings) models.current?.update(sites, mapSettings);
  }, [sites, mapSettings, loaded]);
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
      setLocationError("Tarayıcın konumu desteklemiyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        map.current?.flyTo({
          center: [p.coords.longitude, p.coords.latitude],
          zoom: 15,
        });
        setLocationError("Konumuna gidildi. Eserler Bursa keşif bölgesinde.");
      },
      () =>
        setLocationError(
          "Konum alınamadı. Bursa keşif bölgesinde keşfe devam edebilirsin.",
        ),
      { timeout: 8000 },
    );
  }
  return (
    <div className="map-wrap">
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
            center: demoRegion.center,
            zoom: 16,
            bearing: 0,
            pitch: 0,
          });
          setTilt(false);
        }}
      >
        <Compass size={28} />
      </button>
      {locationError && (
        <button
          className="location-notice"
          onClick={() => setLocationError("")}
        >
          {locationError} ×
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
