import { colors } from "@akar/design-tokens";
import {
  CITY_MARKER_MAX_ZOOM,
  kindCategory,
  type HeritageSite,
  type SiteCategory,
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

/** The map's fallback pins (`public/figma`) by site kind; the canvas pins are drawn from `kindIcons`. */
export const pinFiles: Record<Exclude<SiteKind, "egitim">, string> = {
  cami: "e269f.svg",
  turbe: "e269f.svg",
  cesme: "d42c6.svg",
  hamam: "29586.svg",
  han: "c4a6c.svg",
  bedesten: "c4a6c.svg",
};
/** The symbol on a pin (`public/ikonlar/akar-<icon>.svg`): the body takes the role's colour, the symbol the kind. */
export const kindIcons: Record<SiteKind, string> = {
  cami: "cami",
  turbe: "turbe",
  cesme: "cesme",
  hamam: "hamam",
  han: "han",
  bedesten: "han",
  egitim: "medrese",
};
const ROLE_COLOURS: Record<SiteCategory, string> = {
  dini: "#2E7D32",
  su: "#2A6FB0",
  egitim: "#25477B",
  akar: "#9A5B2E",
};
/** Sort key of a site without a rank: after every ranked one. */
const UNRANKED = 999;
/** Pin images are drawn at twice the size they are shown at. */
const PIXEL_RATIO = 2;
const PIN_WIDTH = 32;
const PIN_HEIGHT = 38.4;
const STAR_SIZE = 36;
/** A tap lands this many pixels around a pin, as the old marker's hit area did. */
const HIT_PADDING = 4;

export interface PinProperties {
  id: string;
  name: string;
  kind: SiteKind;
  /** Position in the visitor's route, from 1; 0 = not a stop. */
  stop: number;
  /** Image id of the pin, see `pinImageId`. */
  icon: string;
  /** The story of this site was finished: its pin carries a tick. */
  finished: boolean;
  /** `symbol-sort-key`: the site's `displayOrder`. */
  order: number;
  selected: boolean;
}
export type PinCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PinProperties
>;

/** Image id: a route stop is the numbered star in the route's colour; any other pin is its kind, ticked once finished. */
export const pinImageId = (
  kind: SiteKind,
  stop = 0,
  finished = false,
  accent: string = colors.cityBursa,
) =>
  stop
    ? `stop-${stop}-${accent}`
    : finished
      ? `pin-${kind}-done`
      : `pin-${kind}`;

export function pinFeatures(
  sites: HeritageSite[],
  routeIds: string[],
  selectedId?: string,
  look: { finishedIds?: string[]; accent?: string } = {},
): PinCollection {
  return {
    type: "FeatureCollection",
    // A kind the server added that has no pin art cannot be drawn, so its site gets no pin.
    features: sites
      .filter((site) => site.kind in kindIcons)
      .map((site) => {
        const stop = routeIds.indexOf(site.id) + 1;
        const finished = look.finishedIds?.includes(site.id) ?? false;
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: site.coordinates },
          properties: {
            id: site.id,
            name: site.name,
            kind: site.kind,
            stop,
            icon: pinImageId(site.kind, stop, finished, look.accent),
            finished,
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

const symbols = new Map<string, Promise<HTMLImageElement>>();
async function decodeSymbol(icon: string) {
  const response = await fetch(`/ikonlar/akar-${icon}.svg`);
  if (!response.ok) throw new Error(icon);
  const svg = (await response.text()).replaceAll("currentColor", "#FFFFFF");
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  return image;
}
function loadSymbol(icon: string): Promise<HTMLImageElement> {
  let symbol = symbols.get(icon);
  if (!symbol) {
    symbol = decodeSymbol(icon);
    // A failed load is tried again on the next update.
    symbol.catch(() => symbols.delete(icon));
    symbols.set(icon, symbol);
  }
  return symbol;
}

/** The arch of the design, in its 44 × 50 box that starts at (-2, -2). */
const ARCH_PATH = "M20 1.5C26 5 33 11 33.5 20V33C33.5 34.6667 32.8333 36 31.5 37L22 45.5C20.6667 46.6333 19.3333 46.6333 18 45.5L8.5 37C7.16667 36 6.5 34.6667 6.5 33V20C7 11 14 5 20 1.5Z";
const ARCH_SCALE = PIN_WIDTH / 44;

function drawArch(ctx: CanvasRenderingContext2D, colour: string) {
  ctx.save();
  ctx.scale(ARCH_SCALE, ARCH_SCALE);
  ctx.translate(2, 2);
  const arch = new Path2D(ARCH_PATH);
  ctx.fillStyle = colour;
  ctx.fill(arch);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke(arch);
  ctx.restore();
}

function drawTick(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(PIN_WIDTH - 7, 8, 6.5, 0, 2 * Math.PI);
  ctx.fillStyle = colors.gold;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = colors.surface;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PIN_WIDTH - 10, 8);
  ctx.lineTo(PIN_WIDTH - 7.8, 10.2);
  ctx.lineTo(PIN_WIDTH - 3.8, 5.8);
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

/** Points of the eight-pointed star, as the design's stop numbers have it, in a box of `size`. */
export function starPoints(size: number) {
  const r = size / 2;
  return Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8 - Math.PI / 2,
      radius = i % 2 ? r * 0.765 : r;
    return [r + Math.cos(a) * radius, r + Math.sin(a) * radius] as const;
  });
}

function stopImage(stop: number, accent: string) {
  const size = Math.ceil(STAR_SIZE * PIXEL_RATIO);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  ctx.beginPath();
  starPoints(STAR_SIZE).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(stop), STAR_SIZE / 2, STAR_SIZE / 2 + 0.5);
  return ctx.getImageData(0, 0, size, size);
}

async function pinImage(kind: SiteKind, finished: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(PIN_WIDTH * PIXEL_RATIO);
  canvas.height = Math.ceil(PIN_HEIGHT * PIXEL_RATIO);
  // The pixels are read back at once, so the canvas stays on the CPU.
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  drawArch(ctx, ROLE_COLOURS[kindCategory[kind]]);
  ctx.drawImage(await loadSymbol(kindIcons[kind]), 8.7, 10.9, 14.5, 14.5);
  if (finished) drawTick(ctx);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Registers the images the pins need and the map does not have yet. */
async function addPinImages(
  map: MapLibreMap,
  pins: PinCollection,
  accent: string,
) {
  const missing = new Map<string, PinProperties>();
  for (const { properties } of pins.features)
    if (!map.hasImage(properties.icon)) missing.set(properties.icon, properties);
  const images = await Promise.all(
    [...missing].map(
      async ([id, p]) =>
        [
          id,
          p.stop ? stopImage(p.stop, accent) : await pinImage(p.kind, p.finished),
        ] as const,
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
  accent: string = colors.cityBursa,
) {
  await addPinImages(map, pins, accent);
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
