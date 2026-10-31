import type { AllPaintProperties, Map as MapLibreMap, SkySpecification, StyleSpecification } from "maplibre-gl";
import { currentTheme, MAP_STYLES, subscribeTheme, type Theme } from "./theme";

/** The globe view's sky of each theme: the frosted day's light blue and warm horizon; night's deep blue. */
export const MAP_SKY: Record<Theme, SkySpecification> = {
  day: { "sky-color": "#9ACBF0", "horizon-color": "#F4F2EA", "fog-color": "#F4F2EA" },
  night: { "sky-color": "#0B1220", "horizon-color": "#24324A", "fog-color": "#1B2330" },
};

const styles = new Map<Theme, Promise<StyleSpecification>>();
const styleOf = (theme: Theme) => {
  let style = styles.get(theme);
  if (!style) {
    style = fetch(MAP_STYLES[theme]).then((r) => r.json() as Promise<StyleSpecification>);
    style.catch(() => styles.delete(theme));
    styles.set(theme, style);
  }
  return style;
};
type Paint = Partial<AllPaintProperties>;
const keysOf = (paint: Paint | undefined) => Object.keys(paint ?? {}) as Array<keyof AllPaintProperties>;
const paintsOf = (style: StyleSpecification) =>
  new Map(style.layers.map((l) => [l.id, ("paint" in l ? l.paint : undefined) as Paint | undefined]));

/**
 * Repaints the base map's layers in `theme`. The two styles share layers, sources and layout, so only paint is set;
 * `setStyle` would also drop the pins, buildings and models added on top. A property only the other style sets goes
 * back to its default (undefined), so nothing of the other theme stays behind.
 */
export async function paintMap(m: MapLibreMap, theme: Theme) {
  const other: Theme = theme === "night" ? "day" : "night";
  const [target, previous] = await Promise.all([styleOf(theme), styleOf(other)]).then(([a, b]) => [paintsOf(a), paintsOf(b)]);
  // A quick second switch may finish first; the later theme wins.
  if (currentTheme() !== theme) return;
  for (const [id, paint] of target) {
    if (!m.getLayer(id)) continue;
    for (const key of new Set([...keysOf(paint), ...keysOf(previous.get(id))]))
      m.setPaintProperty(id, key, paint?.[key]);
  }
  // Layers added in code that copy a style layer's look (the OSM buildings) take the new colours too.
  for (const layer of m.getStyle().layers) {
    const from = (layer.metadata as Record<string, unknown> | undefined)?.[PAINT_FROM];
    const paint = typeof from === "string" ? target.get(from) : undefined;
    if (!paint) continue;
    for (const key of keysOf(paint)) if (key.endsWith("-color") || key.endsWith("-opacity")) m.setPaintProperty(layer.id, key, paint[key]);
  }
}
/** `metadata` key of a layer added in code: the style layer whose colours it follows on a theme switch. */
export const PAINT_FROM = "akar:paint-from";

/** Initial style of a new map: the current theme's. */
export const mapStyle = () => MAP_STYLES[currentTheme()];

/**
 * Keeps `m` in the page's theme: repaints on every change, once its style has loaded. `onChange` runs after each
 * repaint (the main map resets its sky there). Returns the unsubscribe; call it before `m.remove()`.
 */
export function followTheme(m: MapLibreMap, onChange?: (theme: Theme) => void) {
  return subscribeTheme((theme) => {
    const repaint = () =>
      void paintMap(m, theme)
        .then(() => onChange?.(theme))
        .catch(() => {});
    if (m.isStyleLoaded()) repaint();
    else m.once("load", repaint);
  });
}
