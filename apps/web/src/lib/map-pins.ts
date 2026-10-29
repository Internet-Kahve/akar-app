import { colors } from "@akar/design-tokens";
import {
  CITY_MARKER_MAX_ZOOM,
  type HeritageSite,
  type SiteKind,
} from "@akar/domain";
import type {
  AddLayerObject,
  GeoJSONSource,
  Map as MapLibreMap,
} from "maplibre-gl";

/**
 * The map's site pins (§11.48): one GeoJSON source with an icon layer and a label layer, so the map itself
 * places the labels. The icons are placed first, so no label covers a pin; a label that finds no room on
 * one side moves to the other (`text-variable-anchor-offset`). The sites ranked first are placed first
 * (`symbol-sort-key`, `eser.json` `sira`) and the pin shrinks as the visitor comes closer.
 */
export const PIN_SOURCE = "pins";
/** The pin icons; placed first because it is the upper layer. */
export const PIN_LAYER = "pin";
/** The site names, under the icons. */
export const PIN_LABEL_LAYER = "pin-label";

/** Figma map pins (`public/figma`) by site kind; an education pin is drawn in code. */
export const pinFiles: Record<Exclude<SiteKind, "egitim">, string> = {
  cami: "e269f.svg",
  turbe: "e269f.svg",
  cesme: "d42c6.svg",
  hamam: "29586.svg",
  han: "c4a6c.svg",
  bedesten: "c4a6c.svg",
};
/** Sort key of a site without a rank: after every ranked one. */
const UNRANKED = 999;
/** Pin images are drawn at twice the size they are shown at. */
const PIXEL_RATIO = 2;
const PIN_WIDTH = 32;
const PIN_HEIGHT = 38.4;
/** A tap lands this many pixels around a pin, as the old marker's hit area did. */
const HIT_PADDING = 4;

export interface PinProperties {
  id: string;
  name: string;
  kind: SiteKind;
  /** Position in the visitor's route, from 1; 0 = not a stop. */
  stop: number;
  /** Image id of the pin: its kind, with the stop number when it has one. */
  icon: string;
  /** `symbol-sort-key`: the site's `displayOrder`. */
  order: number;
  selected: boolean;
}
export type PinCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PinProperties
>;

export const pinImageId = (kind: SiteKind, stop = 0) =>
  stop ? `pin-${kind}-${stop}` : `pin-${kind}`;

export function pinFeatures(
  sites: HeritageSite[],
  routeIds: string[],
  selectedId?: string,
): PinCollection {
  return {
    type: "FeatureCollection",
    // A kind the server added that has no pin art cannot be drawn, so its site gets no pin.
    features: sites
      .filter((site) => site.kind === "egitim" || site.kind in pinFiles)
      .map((site) => {
        const stop = routeIds.indexOf(site.id) + 1;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: site.coordinates },
          properties: {
            id: site.id,
            name: site.name,
            kind: site.kind,
            stop,
            icon: pinImageId(site.kind, stop),
            order: site.displayOrder ?? UNRANKED,
            selected: site.id === selectedId,
          },
        };
      }),
  };
}

/**
 * The pin layers in the order they are added: the labels, then the icons above them. Labels need the style's
 * glyph server; a style without one (an offline stub) gets the icons alone. The label offsets are in ems of
 * the 12 px text and keep clear of the icon's own box: beside the pin on its left, else its right, at half
 * its height, else under the point, else above the pin.
 */
export function pinLayers(labels: boolean): AddLayerObject[] {
  const icons: AddLayerObject = {
    id: PIN_LAYER,
    type: "symbol",
    source: PIN_SOURCE,
    minzoom: CITY_MARKER_MAX_ZOOM,
    layout: {
      "icon-image": ["get", "icon"],
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      // The Figma size far out, 17.5 % smaller from zoom 18 on (§11.48); the selected pin is a quarter larger.
      "icon-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        16,
        ["case", ["get", "selected"], 1.25, 1],
        18,
        ["case", ["get", "selected"], 1.03, 0.825],
      ],
      "symbol-sort-key": ["get", "order"],
    },
  };
  if (!labels) return [icons];
  const names: AddLayerObject = {
    id: PIN_LABEL_LAYER,
    type: "symbol",
    source: PIN_SOURCE,
    minzoom: CITY_MARKER_MAX_ZOOM,
    layout: {
      // MapLibre lays text out per whole tile zoom, so the names show from zoom 16 however the step is set.
      "text-field": ["step", ["zoom"], "", 16, ["get", "name"]],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-line-height": 1.333,
      "text-variable-anchor-offset": [
        "left",
        [1.7, -1.6],
        "right",
        [-1.7, -1.6],
        "top",
        [0, 0.4],
        "bottom",
        [0, -3.8],
      ],
      "text-justify": "auto",
      "symbol-sort-key": ["get", "order"],
    },
    paint: {
      "text-color": colors.primary,
      "text-halo-color": colors.surface,
      "text-halo-width": 2,
    },
  };
  return [names, icons];
}

const arts = new Map<string, Promise<HTMLImageElement>>();
async function decodeArt(file: string) {
  const image = new Image();
  image.src = `/figma/${file}`;
  await image.decode();
  return image;
}
function loadArt(file: string): Promise<HTMLImageElement> {
  let art = arts.get(file);
  if (!art) {
    art = decodeArt(file);
    // A failed load is tried again on the next update.
    art.catch(() => arts.delete(file));
    arts.set(file, art);
  }
  return art;
}

/** Education has no Figma pin: the navy rounded pin with the letter, as the DOM marker drew it. */
function drawEducation(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.roundRect(1.2, 2.4, 30, 36, [16, 16, 16, 3]);
  ctx.fillStyle = "#25477b"; // --pin-egitim
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.surface;
  ctx.stroke();
  ctx.fillStyle = colors.surface;
  ctx.font = "600 12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("E", 16.2, 21);
}

/** The route stop number: a round badge on the pin's upper right, as the DOM marker drew it. */
function drawStop(ctx: CanvasRenderingContext2D, stop: number) {
  ctx.beginPath();
  ctx.arc(PIN_WIDTH - 9.5, 9.5, 8.5, 0, 2 * Math.PI);
  ctx.fillStyle = colors.primary;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.surface;
  ctx.stroke();
  ctx.fillStyle = colors.surface;
  ctx.font = "600 10px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(stop), PIN_WIDTH - 9.5, 9.8);
}

async function drawPin(kind: SiteKind, stop: number): Promise<ImageData> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(PIN_WIDTH * PIXEL_RATIO);
  canvas.height = Math.ceil(PIN_HEIGHT * PIXEL_RATIO);
  // The pixels are read back at once, so the canvas stays on the CPU.
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  if (kind === "egitim") drawEducation(ctx);
  else
    ctx.drawImage(
      await loadArt(pinFiles[kind]),
      0,
      0,
      PIN_WIDTH,
      PIN_HEIGHT,
    );
  if (stop) drawStop(ctx, stop);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Registers the images the pins need and the map does not have yet. */
async function addPinImages(map: MapLibreMap, pins: PinCollection) {
  const missing = new Map<string, PinProperties>();
  for (const { properties } of pins.features)
    if (!map.hasImage(properties.icon)) missing.set(properties.icon, properties);
  const images = await Promise.all(
    [...missing].map(
      async ([id, p]) => [id, await drawPin(p.kind, p.stop)] as const,
    ),
  );
  for (const [id, image] of images)
    if (!map.hasImage(id)) map.addImage(id, image, { pixelRatio: PIXEL_RATIO });
}

/**
 * Brings the map's pins to this state: the images first, then the source and layers on the first call,
 * only the data afterwards. `cancelled` is asked after the images arrived, so a newer call wins.
 */
export async function syncPins(
  map: MapLibreMap,
  pins: PinCollection,
  cancelled: () => boolean,
) {
  await addPinImages(map, pins);
  if (cancelled()) return;
  const source = map.getSource<GeoJSONSource>(PIN_SOURCE);
  if (source) {
    source.setData(pins);
    return;
  }
  map.addSource(PIN_SOURCE, { type: "geojson", data: pins });
  for (const layer of pinLayers(Boolean(map.getStyle().glyphs)))
    map.addLayer(layer);
}

/** The pin layers the map has: the icons, and the labels when the style can draw text. */
export const pinLayersOn = (map: MapLibreMap) =>
  [PIN_LAYER, PIN_LABEL_LAYER].filter((id) => map.getLayer(id));

/** The site whose pin or label is at a screen point (pixels from the map's top left), or `null`. */
export function pinAt(map: MapLibreMap, x: number, y: number): string | null {
  const layers = pinLayersOn(map);
  if (!layers.length) return null;
  const hit = map.queryRenderedFeatures(
    [
      [x - HIT_PADDING, y - HIT_PADDING],
      [x + HIT_PADDING, y + HIT_PADDING],
    ],
    { layers },
  )[0];
  const id: unknown = hit?.properties?.id;
  return typeof id === "string" ? id : null;
}
