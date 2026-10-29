"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { demoRegion } from "@akar/api-client";
import type {
  GeoJSONSource,
  Map as MapType,
  Marker as MarkerType,
} from "maplibre-gl";
import type { MapModelLayer } from "../lib/map-models";
import type { OsmBuildingLayer } from "../lib/map-buildings";
import {
  interiorPoint,
  isHidden,
  setBuildingHidden,
  type HideRule,
  type Ring,
} from "../lib/osm-buildings";
import { arrowStep, type PlacementDraft } from "../lib/placement";
import { useCityScene } from "./city-scenes";

/** What a click on the map does. */
export type PlacementMode = "none" | "fit" | "buildings";

export interface PlacementMapStatus {
  map: "loading" | "ready" | "failed";
  model: "loading" | "ready" | "failed";
}

export interface PlacementMapHandle {
  /**
   * Hides or shows the building selected on the map. Returns the hand-picked points as they should be
   * afterwards, or `null` when no building is selected.
   */
  setSelectedHidden(
    hide: boolean,
  ): Pick<HideRule, "hiddenPoints" | "keptPoints"> | null;
}

/** Free raster picture without a key; its attribution is shown with the map. */
const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION =
  "Kaynak: Esri, Maxar, Earthstar Geographics ve GIS User Community";
const SATELLITE_ID = "akar-uydu";
const SELECTED_ID = "akar-secili";
const SITE_ID = "onizleme";
/** Model opacity above the satellite picture: the roof outline beneath still shows through. */
const SATELLITE_OPACITY = 0.55;
const PREVIEW = { modelMinZoom: 0, maxVisibleModels: 1 } as const;

/** Layers of the style the satellite picture replaces. */
const coveredByPicture = (m: MapType) =>
  m
    .getStyle()
    .layers.filter(
      (l) =>
        l.type === "fill" || l.type === "background" || l.id === "kabartma",
    );

function setSatellite(m: MapType, on: boolean) {
  if (on) {
    if (!m.getSource(SATELLITE_ID))
      m.addSource(SATELLITE_ID, {
        type: "raster",
        tiles: [SATELLITE_TILES],
        tileSize: 256,
        maxzoom: 19,
        attribution: SATELLITE_ATTRIBUTION,
      });
    if (!m.getLayer(SATELLITE_ID)) {
      // Under roads, outlines and labels: above everything the picture replaces.
      const first = m
        .getStyle()
        .layers.find(
          (l) =>
            l.type !== "fill" && l.type !== "background" && l.type !== "raster",
        );
      m.addLayer(
        { id: SATELLITE_ID, type: "raster", source: SATELLITE_ID },
        first?.id,
      );
    }
    for (const l of coveredByPicture(m))
      m.setLayoutProperty(l.id, "visibility", "none");
  } else {
    if (m.getLayer(SATELLITE_ID)) m.removeLayer(SATELLITE_ID);
    if (m.getSource(SATELLITE_ID)) m.removeSource(SATELLITE_ID);
    for (const l of coveredByPicture(m))
      m.setLayoutProperty(l.id, "visibility", "visible");
  }
}

/**
 * Live preview of a model's placement: the public map's model and OSM building layers on a tilted map
 * (`lib/map-models.ts`, `lib/map-buildings.ts`) with the unsaved values. The model is moved by its centre
 * handle or the arrow keys; the map click picks an OSM building (`mode`).
 */
export const PlacementMap = forwardRef<
  PlacementMapHandle,
  {
    modelSrc: string;
    /** The site's city: model light as on the public map. */
    city: string;
    placement: PlacementDraft;
    satellite: boolean;
    mode: PlacementMode;
    /** The centre handle was dragged. */
    onMove: (lng: number, lat: number) => void;
    /** `fit` mode: the outer ring of the building that was clicked. */
    onFit: (ring: Ring) => void;
    /** `buildings` mode: the clicked building and whether it is left out now; `null` = none selected. */
    onSelect: (selection: { hidden: boolean } | null) => void;
    /** Arrow key: metres towards the east and the north. */
    onNudge: (east: number, north: number) => void;
    onStatus: (status: PlacementMapStatus) => void;
  }
>(function PlacementMap(props, ref) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    marker = useRef<MarkerType | null>(null),
    layer = useRef<MapModelLayer | null>(null),
    buildings = useRef<OsmBuildingLayer | null>(null),
    selected = useRef<Ring | null>(null),
    dragging = useRef(false),
    latest = useRef(props);
  const [ready, setReady] = useState(false);
  const status = useRef<PlacementMapStatus>({
    map: "loading",
    model: "loading",
  });
  latest.current = props;

  const report = (patch: Partial<PlacementMapStatus>) => {
    const next = { ...status.current, ...patch };
    if (next.map === status.current.map && next.model === status.current.model)
      return;
    status.current = next;
    latest.current.onStatus(next);
  };
  /** The rules of the previewed model; without a loaded model only the hand-picked points count. */
  const rule = (): HideRule =>
    layer.current?.hideRules()[0] ?? {
      footprint: [],
      hiddenPoints: latest.current.placement.hiddenPoints,
      keptPoints: latest.current.placement.keptPoints,
    };
  const highlight = () => {
    const source = map.current?.getSource<GeoJSONSource>(SELECTED_ID);
    const ring = selected.current;
    source?.setData({
      type: "FeatureCollection",
      features: ring
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: ring },
            },
          ]
        : [],
    });
  };
  /** What the parent was last told about the selection: `undefined` nothing yet, `null` no building, else hidden or not. */
  const told = useRef<boolean | null | undefined>(undefined);
  const select = (ring: Ring | null) => {
    selected.current = ring;
    highlight();
    const hidden = ring ? isHidden(ring, [rule()]) : null;
    if (told.current === hidden) return;
    told.current = hidden;
    latest.current.onSelect(hidden === null ? null : { hidden });
  };
  useImperativeHandle(ref, () => ({
    setSelectedHidden(hide) {
      const ring = selected.current;
      if (!ring) return null;
      return setBuildingHidden(ring, rule(), hide, interiorPoint(ring));
    },
  }));

  useEffect(() => {
    let disposed = false;
    Promise.all([
      import("maplibre-gl"),
      import("../lib/map-models"),
      import("../lib/map-buildings"),
    ])
      .then(([lib, models, osm]) => {
        if (disposed || !container.current) return;
        const p = latest.current.placement;
        lib.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        const m = new lib.Map({
          container: container.current,
          center: Number.isFinite(p.lng) ? [p.lng, p.lat] : demoRegion.center,
          zoom: 17.4,
          pitch: 55,
          maxPitch: 70,
          attributionControl: { compact: true },
          style: "/harita/akar-style.json",
        });
        map.current = m;
        // Arrow keys move the model, not the map.
        m.keyboard.disable();
        m.on("error", () => {
          if (!disposed && status.current.map === "loading")
            report({ map: "failed" });
        });
        m.on("load", () => {
          if (disposed) return;
          try {
            const modelLayer = new models.MapModelLayer(
              lib.MercatorCoordinate,
              () => {
                buildings.current?.schedule();
                const state = modelLayer.status(SITE_ID);
                report({ model: state });
                if (selected.current) select(selected.current);
              },
              true,
            );
            layer.current = modelLayer;
            buildings.current = osm.OsmBuildingLayer.install(
              m,
              () => modelLayer.hideRules(),
              { showHidden: true },
            );
            m.addLayer(modelLayer);
            modelLayer.setSettings(PREVIEW);
            m.addSource(SELECTED_ID, {
              type: "geojson",
              data: { type: "FeatureCollection", features: [] },
            });
            m.addLayer({
              id: `${SELECTED_ID}-cizgi`,
              type: "line",
              source: SELECTED_ID,
              paint: { "line-color": "#1a73e8", "line-width": 3 },
            });
          } catch {
            // No usable GL for the models: the map and the form still work.
            report({ model: "failed" });
          }
          const handle = document.createElement("div");
          handle.className = "placement-handle";
          handle.title = "Modeli sürükleyerek taşı";
          const dot = new lib.Marker({ element: handle, draggable: true })
            .setLngLat([p.lng, p.lat])
            .addTo(m);
          dot.on("dragstart", () => (dragging.current = true));
          dot.on("drag", () => {
            const at = dot.getLngLat();
            latest.current.onMove(at.lng, at.lat);
          });
          dot.on("dragend", () => (dragging.current = false));
          marker.current = dot;
          m.on("click", (e) => {
            const { mode, onFit } = latest.current;
            if (mode === "none") return;
            const building = buildings.current?.pick(e.point) ?? null;
            if (mode === "fit") {
              if (building) onFit(building.polygon[0]!);
              return;
            }
            select(building ? building.polygon[0]! : null);
          });
          report({ map: "ready" });
          setReady(true);
        });
      })
      .catch(() => report({ map: "failed" }));
    return () => {
      disposed = true;
      marker.current?.remove();
      buildings.current?.dispose();
      map.current?.remove();
      map.current = marker.current = layer.current = buildings.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one map for the life of the component; props come through `latest`
  }, []);

  const { modelSrc, placement, satellite, mode } = props;
  // Light as on the visitors' map (§11.42).
  const { light } = useCityScene(props.city);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    // A site being filled in may have no location yet.
    if (!Number.isFinite(placement.lng) || !Number.isFinite(placement.lat))
      return;
    layer.current?.setSites([{ id: SITE_ID, src: modelSrc, placement, light }]);
    if (!dragging.current)
      marker.current?.setLngLat([placement.lng, placement.lat]);
    if (!m.getBounds().contains([placement.lng, placement.lat]))
      m.easeTo({ center: [placement.lng, placement.lat], duration: 400 });
  }, [ready, modelSrc, placement, light]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    setSatellite(m, satellite);
    layer.current?.setOpacity(satellite ? SATELLITE_OPACITY : 1);
  }, [ready, satellite]);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    m.getCanvas().style.cursor = mode === "none" ? "" : "crosshair";
    if (mode !== "buildings") select(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `select` only reads refs
  }, [ready, mode]);

  const onKeyDown = (e: KeyboardEvent) => {
    const step = arrowStep(e.key);
    if (!step) return;
    e.preventDefault();
    props.onNudge(step[0], step[1]);
  };

  return (
    <div
      className="placement-map"
      role="group"
      tabIndex={0}
      aria-label="Yerleşim önizlemesi. Modeli ok tuşlarıyla 0,5 metre taşıyabilirsin."
      onKeyDown={onKeyDown}
    >
      <div ref={container} className="placement-map-canvas" />
    </div>
  );
});
