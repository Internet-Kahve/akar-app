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
import { localize, type Lang } from "./i18n";
import { sized } from "./image-size";
import { currentTheme, type Theme } from "./theme";

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
/** The photograph pin (`photoPinImage`): a 40 px round photograph on a point. */
const PHOTO_PIN_WIDTH = 40;
const PHOTO_PIN_HEIGHT = 48;
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
  /** Image id of the name drawn in the display serif (`labelImageId`); empty until it is drawn, the glyph text stands in. */
  label: string;
  /** The site's cover photograph, small (`look.photos`); the pin shows it inside the arch. Empty: the kind's symbol. */
  photo: string;
}
export type PinCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PinProperties
>;

/**
 * Image id: a route stop is the numbered star in the route's colour; any other pin is its kind, ticked once finished,
 * ringed in gold while selected.
 */
export const pinImageId = (
  kind: SiteKind,
  stop = 0,
  finished = false,
  accent: string = colors.cityBursa,
  selected = false,
) =>
  stop
    ? `stop-${stop}-${accent}`
    : selected
      ? `pin-${kind}-selected`
      : finished
        ? `pin-${kind}-done`
        : `pin-${kind}`;

export function pinFeatures(
  sites: HeritageSite[],
  routeIds: string[],
  selectedId?: string,
  look: { finishedIds?: string[]; accent?: string; lang?: Lang; buildingRoute?: boolean; photos?: boolean } = {},
): PinCollection {
  return {
    type: "FeatureCollection",
    // A kind the server added that has no pin art cannot be drawn, so its site gets no pin.
    features: sites
      .filter((site) => site.kind in kindIcons)
      .map((site) => {
        const stop = routeIds.indexOf(site.id) + 1;
        // Building a route the «+» badge takes the pin's corner: the «story heard» tick waits (6 Nov 2026, the two drew
        // one over the other).
        const finished = !look.buildingRoute && (look.finishedIds?.includes(site.id) ?? false);
        const selected = site.id === selectedId;
        // A pin with the site's own photograph says which site it is (Muhammed, 3 Nov 2026: «pinler anlaşılmıyor»).
        const cover = look.photos
          ? (site.photos?.find((p) => p.id === site.coverPhotoId) ?? site.photos?.[0])?.src
          : undefined;
        const photo = (cover && sized(cover, 40)) || "";
        const plain = pinImageId(site.kind, stop, finished, look.accent, selected);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates: site.coordinates },
          properties: {
            id: site.id,
            name: localize(look.lang ?? "tr", site.name, site.nameEn).text,
            // Building a route: a pin not on it yet carries a «+» badge (pinLayers).
            building: !!look.buildingRoute,
            kind: site.kind,
            stop,
            icon: photo && !stop ? `photo-${site.id}${plain.slice(`pin-${site.kind}`.length)}` : plain,
            finished,
            order: site.displayOrder ?? UNRANKED,
            selected,
            label: "",
            photo: stop ? "" : photo,
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
/** The «+» badge of a pin while a route is being built, and its image (drawn in `addPinImages`). */
export const PIN_PLUS_LAYER = "pin-plus";
const PIN_PLUS_IMAGE = "pin-plus";

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
      // The prototype's size: its 44 px arch at 0.8 by zoom 16 and 0.66 by zoom 18 (here a 32 px canvas), so
      // 1.1 and 0.9075; the selected pin keeps the arch's full 44 px at every zoom, 2 px lower, drawn above the rest.
      "icon-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        16,
        ["case", ["get", "selected"], 1.375, 1.1],
        18,
        ["case", ["get", "selected"], 1.375, 0.9075],
      ],
      "icon-offset": [
        "case",
        ["get", "selected"],
        ["literal", [0, 2 / 1.375]],
        ["literal", [0, 0]],
      ],
      "symbol-sort-key": [
        "case",
        ["get", "selected"],
        UNRANKED + 1,
        ["get", "order"],
      ],
    },
  };
  // Building a route: a gold «+» on the top right of each pin not on the route yet (a stop is its numbered star).
  const adding = ["all", ["==", ["get", "building"], true], ["==", ["get", "stop"], 0]] as const;
  const plusBadge: AddLayerObject = {
    id: PIN_PLUS_LAYER,
    type: "symbol",
    source: PIN_SOURCE,
    minzoom: CITY_MARKER_MAX_ZOOM,
    filter: adding as never,
    layout: {
      "icon-image": PIN_PLUS_IMAGE,
      "icon-anchor": "center",
      // Placed as the pin is (upright, from its point): the badge sits on the arch's top right corner.
      "icon-offset": [12, -34],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  };
  if (!labels) return [icons];
  const names: AddLayerObject = {
    id: PIN_LABEL_LAYER,
    type: "symbol",
    source: PIN_SOURCE,
    minzoom: CITY_MARKER_MAX_ZOOM,
    layout: {
      // MapLibre lays text out per whole tile zoom, so the names show from zoom 15 (the prototype's 15.2).
      // The name is the serif image once it is drawn (`label`), the glyph text until then.
      "text-field": [
        "step",
        ["zoom"],
        "",
        15.2,
        [
          "case",
          ["!=", ["get", "label"], ""],
          ["format", ["image", ["get", "label"]]],
          ["get", "name"],
        ],
      ],
      "text-font": ["Noto Sans Bold"],
      "text-size": 12,
      "text-line-height": 1.333,
      "text-variable-anchor-offset": [
        // Clear of the photograph pin's 44 × 53 px box (photoPinImage), at its round's middle.
        "left",
        [2.2, -2.3],
        "right",
        [-2.2, -2.3],
        "top",
        [0, 0.4],
        "bottom",
        [0, -4.8],
      ],
      "text-justify": "auto",
      "text-optional": true,
      "symbol-sort-key": ["get", "order"],
    },
    paint: {
      "text-color": LABEL_INK[currentTheme()].glyphInk,
      "text-halo-color": LABEL_INK[currentTheme()].glyphHalo,
      "text-halo-width": 2,
    },
  };
  return [names, icons, plusBadge];
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

function drawArch(ctx: CanvasRenderingContext2D, colour: string, selected = false) {
  ctx.save();
  ctx.scale(ARCH_SCALE, ARCH_SCALE);
  ctx.translate(2, 2);
  const arch = new Path2D(ARCH_PATH);
  if (selected) {
    // The prototype's selected pin: a gold ring around the white edge.
    ctx.lineWidth = 6;
    ctx.strokeStyle = colors.gold;
    ctx.stroke(arch);
  }
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

async function pinImage(kind: SiteKind, finished: boolean, selected = false) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(PIN_WIDTH * PIXEL_RATIO);
  canvas.height = Math.ceil(PIN_HEIGHT * PIXEL_RATIO);
  // The pixels are read back at once, so the canvas stays on the CPU.
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  drawArch(ctx, ROLE_COLOURS[kindCategory[kind]], selected);
  ctx.drawImage(await loadSymbol(kindIcons[kind]), 8.7, 10.9, 14.5, 14.5);
  if (finished) drawTick(ctx);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * The pin with the site's photograph inside the arch, framed in its kind's colour. A photograph that does not load
 * leaves the kind's symbol pin.
 */
async function photoPinImage(kind: SiteKind, src: string, finished: boolean, selected: boolean) {
  const photo = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  if (!photo) return pinImage(kind, finished, selected);
  // A round photograph in a ring of the kind's colour, on a short point: larger than the symbol pin, so the
  // photograph can be told apart on a phone.
  const W = PHOTO_PIN_WIDTH;
  const H = PHOTO_PIN_HEIGHT;
  const r = W / 2 - 2;
  const cx = W / 2;
  const cy = r + 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(W * PIXEL_RATIO);
  canvas.height = Math.ceil(H * PIXEL_RATIO);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  const shape = new Path2D();
  shape.arc(cx, cy, r, Math.PI * 0.62, Math.PI * 2.38);
  shape.lineTo(cx, H - 1.5);
  shape.closePath();
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = ROLE_COLOURS[kindCategory[kind]];
  ctx.fill(shape);
  ctx.shadowColor = "transparent";
  ctx.lineWidth = selected ? 3 : 1.5;
  ctx.strokeStyle = selected ? colors.gold : "#FFFFFF";
  ctx.stroke(shape);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.clip();
  const side = (r - 3) * 2;
  const k = Math.max(side / photo.naturalWidth, side / photo.naturalHeight);
  const w = photo.naturalWidth * k;
  const h = photo.naturalHeight * k;
  ctx.drawImage(photo, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
  if (finished) {
    ctx.translate(W - PIN_WIDTH + 1, -1);
    drawTick(ctx);
  }
  try {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return pinImage(kind, finished, selected);
  }
}

/**
 * Site names in the app's display serif (Cormorant Garamond, as the prototype draws them): the glyph server
 * has no serif, so each name is drawn once on a canvas, ink with a white halo, and shown as an image inside the
 * label, which keeps the map's own label placement and collision.
 */
const LABEL_FONT = '600 34px "Cormorant Garamond"';
const LABEL_HEIGHT = 46;
const LABEL_PREFIX = "name:";
export const labelImageId = (name: string) => `${LABEL_PREFIX}${name}`;
async function labelFontReady(names: string[]) {
  try {
    await document.fonts.load(LABEL_FONT, names.join(""));
    return document.fonts.check(LABEL_FONT);
  } catch {
    return false;
  }
}
function labelImage(name: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.font = LABEL_FONT;
  canvas.width = Math.ceil(ctx.measureText(name).width) + 16;
  canvas.height = LABEL_HEIGHT;
  ctx.font = LABEL_FONT;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = LABEL_INK[currentTheme()].halo;
  ctx.strokeText(name, 8, LABEL_HEIGHT / 2 + 1);
  ctx.fillStyle = LABEL_INK[currentTheme()].ink;
  ctx.fillText(name, 8, LABEL_HEIGHT / 2 + 1);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
/** Ink and halo of the site names: dark on a white halo by day, light on a dark halo by night. */
const LABEL_INK: Record<Theme, { ink: string; halo: string; glyphInk: string; glyphHalo: string }> = {
  day: { ink: colors.text, halo: "rgba(255,255,255,.95)", glyphInk: colors.primary, glyphHalo: colors.surface },
  night: { ink: "#EEF1F4", halo: "rgba(22,29,39,.92)", glyphInk: "#EEF1F4", glyphHalo: "#161D27" },
};
/** Redraws the site names already on `m` in the page theme (same image ids), and the glyph text that stands in. */
export function themePinLabels(m: MapLibreMap) {
  const theme = currentTheme();
  if (m.getLayer(PIN_LABEL_LAYER)) {
    m.setPaintProperty(PIN_LABEL_LAYER, "text-color", LABEL_INK[theme].glyphInk);
    m.setPaintProperty(PIN_LABEL_LAYER, "text-halo-color", LABEL_INK[theme].glyphHalo);
  }
  for (const id of m.listImages())
    if (id.startsWith(LABEL_PREFIX)) m.updateImage(id, labelImage(id.slice(LABEL_PREFIX.length)));
}
/** Draws the names the map does not have yet and points each pin at its image; without the font the text stays. */
async function addLabelImages(map: MapLibreMap, pins: PinCollection) {
  const names = [...new Set(pins.features.map((f) => f.properties.name))];
  if (!names.length || !(await labelFontReady(names))) return;
  for (const name of names) {
    const id = labelImageId(name);
    if (!map.hasImage(id))
      map.addImage(id, labelImage(name), { pixelRatio: PIXEL_RATIO });
  }
  for (const f of pins.features)
    f.properties.label = labelImageId(f.properties.name);
}

/** Registers the images the pins need and the map does not have yet. */
async function addPinImages(
  map: MapLibreMap,
  pins: PinCollection,
  accent: string,
) {
  if (!map.hasImage(PIN_PLUS_IMAGE)) {
    // A gold disc with a white rim and a white «+», 20 px.
    const size = 20 * PIXEL_RATIO,
      canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const c = canvas.getContext("2d")!;
    c.scale(PIXEL_RATIO, PIXEL_RATIO);
    c.beginPath();
    c.arc(10, 10, 9, 0, Math.PI * 2);
    c.fillStyle = "#C9A13B";
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = "#FFFFFF";
    c.stroke();
    c.beginPath();
    c.moveTo(10, 5.5);
    c.lineTo(10, 14.5);
    c.moveTo(5.5, 10);
    c.lineTo(14.5, 10);
    c.lineWidth = 2.2;
    c.lineCap = "round";
    c.stroke();
    map.addImage(PIN_PLUS_IMAGE, c.getImageData(0, 0, size, size), { pixelRatio: PIXEL_RATIO });
  }
  const missing = new Map<string, PinProperties>();
  for (const { properties } of pins.features)
    if (!map.hasImage(properties.icon)) missing.set(properties.icon, properties);
  const images = await Promise.all(
    [...missing].map(
      async ([id, p]) =>
        [
          id,
          p.stop
            ? stopImage(p.stop, accent)
            : p.photo
              ? await photoPinImage(p.kind, p.photo, p.finished, p.selected)
              : await pinImage(p.kind, p.finished, p.selected),
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
  if (map.getStyle().glyphs) await addLabelImages(map, pins);
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
  // A tap on a pin's «+» badge (building a route) is a tap on the pin.
  const layers = [...pinLayersOn(map), ...[PIN_PLUS_LAYER].filter((id) => map.getLayer(id))];
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
