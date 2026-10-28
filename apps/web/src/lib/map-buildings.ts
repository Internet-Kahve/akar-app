import type {
  AllPaintProperties,
  GeoJSONSource,
  Map as MapLibreMap,
  MapSourceDataEvent,
  PointLike,
} from "maplibre-gl";
import {
  hiddenBuildings,
  splitBuildings,
  visibleBuildings,
  type Building,
  type HideRule,
} from "./osm-buildings";

/** Vector source and layer of the style the buildings come from (`public/harita/akar-style.json`). */
const TILE_SOURCE = "openmaptiles";
const TILE_LAYER = "building";
const STYLE_LAYER = "building_3d";
const SOURCE_ID = "akar-bina";
const LAYER_ID = "akar-bina-3d";
/** Panel preview: the buildings the rules leave out, drawn red and half see-through. */
const HIDDEN_SOURCE_ID = "akar-bina-gizli";
const HIDDEN_LAYER_ID = "akar-bina-gizli-3d";
const HIDDEN_COLOR = "#d93025";
/** Tiles arrive in bursts; the buildings are rebuilt once things settle. */
const DEBOUNCE_MS = 350;

/**
 * The map's own OSM building layer. The style's `building_3d` cannot hide a single building (tiles merge
 * them into groups), so it is switched off and the buildings are drawn from a GeoJSON source of our own:
 * split one by one, minus the ones a placed model stands on or the editor hid (`osm-buildings.ts`).
 */
export class OsmBuildingLayer {
  private timer: number | undefined;
  /** Every building of the last rebuild, hidden ones included. */
  private buildings: Building[] = [];

  private constructor(
    private readonly map: MapLibreMap,
    private readonly rules: () => readonly HideRule[],
    private readonly showHidden: boolean,
  ) {
    map.on("sourcedata", this.onSourceData);
    this.schedule();
  }

  /** `null` when the style has no building tiles (an offline or reduced style): nothing to replace. */
  static install(
    map: MapLibreMap,
    rules: () => readonly HideRule[],
    options: { showHidden?: boolean } = {},
  ): OsmBuildingLayer | null {
    if (!map.getSource(TILE_SOURCE)) return null;
    const style = map.getLayer(STYLE_LAYER);
    // Same look as the style's own layer; only the height and base now come from our features.
    const paint = <K extends keyof AllPaintProperties>(
      name: K,
      fallback: AllPaintProperties[K],
    ) =>
      (style ? map.getPaintProperty(STYLE_LAYER, name) : undefined) ?? fallback;
    const layers = map.getStyle().layers;
    const at = layers.findIndex((l) => l.id === STYLE_LAYER);
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer(
      {
        id: LAYER_ID,
        type: "fill-extrusion",
        source: SOURCE_ID,
        minzoom: style?.minzoom ?? 15,
        paint: {
          "fill-extrusion-color": paint(
            "fill-extrusion-color",
            "#d0c6b4",
          ) as string,
          "fill-extrusion-opacity": paint(
            "fill-extrusion-opacity",
            0.35,
          ) as number,
          "fill-extrusion-vertical-gradient": paint(
            "fill-extrusion-vertical-gradient",
            true,
          ) as boolean,
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.6,
            ["get", "h"],
          ],
          "fill-extrusion-base": ["get", "b"],
        },
      },
      // Where the style drew its own buildings: under the roads and labels.
      at >= 0 ? layers[at + 1]?.id : undefined,
    );
    if (options.showHidden) {
      map.addSource(HIDDEN_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer(
        {
          id: HIDDEN_LAYER_ID,
          type: "fill-extrusion",
          source: HIDDEN_SOURCE_ID,
          minzoom: style?.minzoom ?? 15,
          paint: {
            "fill-extrusion-color": HIDDEN_COLOR,
            "fill-extrusion-opacity": 0.55,
            "fill-extrusion-height": ["get", "h"],
            "fill-extrusion-base": ["get", "b"],
          },
        },
        at >= 0 ? layers[at + 1]?.id : undefined,
      );
    }
    if (style) map.setLayoutProperty(STYLE_LAYER, "visibility", "none");
    return new OsmBuildingLayer(map, rules, options.showHidden ?? false);
  }

  /** The building drawn at a screen point (pixels from the map's top left), hidden ones included; `null` over open ground. */
  pick(point: PointLike): Building | null {
    const layers = [LAYER_ID, HIDDEN_LAYER_ID].filter((id) =>
      this.map.getLayer(id),
    );
    const hit = this.map.queryRenderedFeatures(point, { layers })[0];
    const index = Number(hit?.properties?.i);
    return (hit && this.buildings[index]) || null;
  }

  /** Rebuilds the layer shortly: after tiles loaded, or a model appeared, left or moved. */
  schedule() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(this.update, DEBOUNCE_MS);
  }

  dispose() {
    window.clearTimeout(this.timer);
    this.map.off("sourcedata", this.onSourceData);
    if (this.map.getLayer(LAYER_ID)) this.map.removeLayer(LAYER_ID);
    if (this.map.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID);
    if (this.map.getLayer(HIDDEN_LAYER_ID))
      this.map.removeLayer(HIDDEN_LAYER_ID);
    if (this.map.getSource(HIDDEN_SOURCE_ID))
      this.map.removeSource(HIDDEN_SOURCE_ID);
    if (this.map.getLayer(STYLE_LAYER))
      this.map.setLayoutProperty(STYLE_LAYER, "visibility", "visible");
  }

  private readonly onSourceData = (e: MapSourceDataEvent) => {
    if (e.sourceId === TILE_SOURCE && e.isSourceLoaded) this.schedule();
  };

  private readonly update = () => {
    const source = this.map.getSource<GeoJSONSource>(SOURCE_ID);
    if (!source) return;
    const features = this.map.querySourceFeatures(TILE_SOURCE, {
      sourceLayer: TILE_LAYER,
    });
    this.buildings = splitBuildings(features);
    const rules = this.rules();
    source.setData({
      type: "FeatureCollection",
      features: visibleBuildings(this.buildings, rules),
    });
    if (this.showHidden)
      this.map.getSource<GeoJSONSource>(HIDDEN_SOURCE_ID)?.setData({
        type: "FeatureCollection",
        features: hiddenBuildings(this.buildings, rules),
      });
  };
}
