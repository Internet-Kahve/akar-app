import assert from "node:assert/strict";
import test from "node:test";
import { createSeed } from "@akar/api-client";
import { CITY_MARKER_MAX_ZOOM, type HeritageSite } from "@akar/domain";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  PIN_LABEL_LAYER,
  PIN_LAYER,
  PIN_SOURCE,
  pinAt,
  pinFeatures,
  pinImageId,
  pinLayers,
} from "./map-pins";

const sites = createSeed().sites;
const at = (id: string) => sites.find((s) => s.id === id)!;
/** The layers as the style spec sees them: only their layout and paint are read here. */
const specs = (labels: boolean) =>
  pinLayers(labels) as unknown as Array<{
    id: string;
    source: string;
    minzoom: number;
    layout: Record<string, unknown>;
    paint?: Record<string, unknown>;
  }>;

test("a pin's image is its kind, with the route stop number when it is a stop", () => {
  assert.equal(pinImageId("han"), "pin-han");
  assert.equal(pinImageId("han", 3), "pin-han-3");
});

test("pins carry the site's rank as sort key, unranked sites come after every ranked one", () => {
  const { features } = pinFeatures(sites, []);
  const order = (id: string) =>
    features.find((f) => f.properties.id === id)!.properties.order;
  assert.equal(order("ulu-cami"), at("ulu-cami").displayOrder);
  assert.equal(order("ulu-cami"), 1);
  assert.equal(order("bedesten"), 2);
  // The two fictional demo sites have no rank.
  assert.equal(at("bursa-cesme-demo").displayOrder, undefined);
  assert.ok(order("bursa-cesme-demo") > order("orhan-gazi"));
  assert.ok(order("bursa-mektep-demo") > 100);
});

test("a pin sits at the site, names it and numbers the route stops from 1", () => {
  const { features } = pinFeatures(sites, ["koza-han", "ulu-cami"], "bedesten");
  const koza = features.find((f) => f.properties.id === "koza-han")!;
  assert.deepEqual(koza.geometry.coordinates, at("koza-han").coordinates);
  assert.equal(koza.properties.name, at("koza-han").name);
  assert.equal(koza.properties.stop, 1);
  assert.equal(koza.properties.icon, "pin-han-1");
  const ulucami = features.find((f) => f.properties.id === "ulu-cami")!;
  assert.equal(ulucami.properties.stop, 2);
  assert.equal(ulucami.properties.icon, "pin-cami-2");
  const outside = features.find((f) => f.properties.id === "orhan-gazi")!;
  assert.equal(outside.properties.stop, 0);
  assert.equal(outside.properties.icon, "pin-cami");
  assert.deepEqual(
    features.filter((f) => f.properties.selected).map((f) => f.properties.id),
    ["bedesten"],
  );
});

test("every kind the app knows gets a pin; a kind the server added has none", () => {
  const kinds = ["cami", "turbe", "cesme", "hamam", "han", "bedesten", "egitim"];
  const every = kinds.map((kind, i) => ({
    ...at("ulu-cami"),
    id: `site-${i}`,
    kind,
  })) as HeritageSite[];
  assert.equal(pinFeatures(every, []).features.length, 7);
  const unknown = { ...at("ulu-cami"), id: "x", kind: "tekke" } as unknown as HeritageSite;
  assert.deepEqual(pinFeatures([unknown], []).features, []);
});

test("the icons shrink as the visitor comes closer and are placed by rank, over the labels", () => {
  const [names, icons] = specs(true);
  // The icon layer is the upper one, so the map places the icons first and no label covers a pin.
  assert.equal(names!.id, PIN_LABEL_LAYER);
  assert.equal(icons!.id, PIN_LAYER);
  for (const layer of [names!, icons!]) {
    assert.equal(layer.source, PIN_SOURCE);
    // Pins give way to the city markers of the globe view.
    assert.equal(layer.minzoom, CITY_MARKER_MAX_ZOOM);
    assert.deepEqual(layer.layout["symbol-sort-key"], ["get", "order"]);
  }
  const { layout } = icons!;
  assert.equal(layout["icon-allow-overlap"], true);
  assert.deepEqual(layout["icon-image"], ["get", "icon"]);
  assert.equal("text-field" in layout, false);
  const size = layout["icon-size"] as unknown[];
  assert.deepEqual(size.slice(0, 3), ["interpolate", ["linear"], ["zoom"]]);
  const stops = size.slice(3);
  assert.equal(stops[0], 16);
  assert.equal(stops[2], 18);
  // The value of an unselected pin: ["case", selected, selectedSize, size].
  const unselected = (stop: unknown) => (stop as unknown[])[3] as number;
  assert.equal(unselected(stops[1]), 1);
  assert.ok(unselected(stops[3]) < 1);
});

test("a label that finds no room beside its pin moves to the other side, then below, then above", () => {
  const { layout } = specs(true)[0]!;
  const offsets = layout["text-variable-anchor-offset"] as unknown[];
  const anchors = offsets.filter((x) => typeof x === "string");
  // «left» puts the text's left edge at the pin, so the label stands on its right.
  assert.deepEqual(anchors, ["left", "right", "top", "bottom"]);
  // Both side offsets clear the icon's own box (32 px wide, 12 px text).
  const [left, right] = [offsets[1], offsets[3]] as Array<[number, number]>;
  assert.ok(left[0] * 12 > 20 && right[0] * 12 < -20);
  assert.equal(left[1], right[1]);
  // Labels appear from zoom 16 and carry the site's name.
  assert.deepEqual(layout["text-field"], [
    "step",
    ["zoom"],
    "",
    16,
    ["get", "name"],
  ]);
  assert.equal("icon-image" in layout, false);
});

test("a style without a glyph server gets the icons alone", () => {
  const layers = specs(false);
  assert.equal(layers.length, 1);
  assert.equal(layers[0]!.id, PIN_LAYER);
  for (const key of ["text-field", "text-font", "text-variable-anchor-offset"])
    assert.equal(key in layers[0]!.layout, false, key);
});

test("a tap finds the pin or label around it and nothing without the layers", () => {
  const queries: unknown[] = [];
  const map = (layers: string[]) =>
    ({
      getLayer: (id: string) => (layers.includes(id) ? {} : undefined),
      queryRenderedFeatures: (box: unknown, options: unknown) => {
        queries.push([box, options]);
        return [{ properties: { id: "ulu-cami" } }];
      },
    }) as unknown as MapLibreMap;
  assert.equal(pinAt(map([]), 10, 10), null);
  assert.deepEqual(queries, []);
  assert.equal(pinAt(map([PIN_LAYER, PIN_LABEL_LAYER]), 100, 50), "ulu-cami");
  assert.deepEqual(queries[0], [
    [
      [96, 46],
      [104, 54],
    ],
    { layers: [PIN_LAYER, PIN_LABEL_LAYER] },
  ]);
  // A style without glyphs has no label layer to ask.
  assert.equal(pinAt(map([PIN_LAYER]), 1, 1), "ulu-cami");
  assert.deepEqual((queries[1] as unknown[])[1], { layers: [PIN_LAYER] });
  const empty = {
    getLayer: () => ({}),
    queryRenderedFeatures: () => [],
  } as unknown as MapLibreMap;
  assert.equal(pinAt(empty, 1, 1), null);
});
