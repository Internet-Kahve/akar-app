import assert from "node:assert/strict";
import test from "node:test";
import { defaultCityScene } from "@akar/domain";
import type { Map as MapLibreMap, MercatorCoordinate } from "maplibre-gl";
import { BoxGeometry, Group, Mesh } from "three";
import { MapModelLayer, type MapModelSite } from "./map-models";
import { defaultPlacement } from "./placement";
import { footprintRing } from "./osm-buildings";

test("a model finishing its download uses the latest placement and building overrides", async () => {
  const pending = Promise.withResolvers<{ scene: Group }>();
  const map = {
    getZoom: () => 18,
    triggerRepaint() {},
    off() {},
  } as unknown as MapLibreMap;
  const origins: number[][] = [];
  const mercator = {
    fromLngLat(at: number[]) {
      origins.push(at);
      return { x: 0, y: 0, z: 0, meterInMercatorCoordinateUnits: () => 1 };
    },
  } as unknown as typeof MercatorCoordinate;
  const layer = new MapModelLayer(mercator, () => {}, true);
  // Exercise async reconciliation without requiring a WebGL context or downloading a file.
  Object.assign(layer, { map, loader: { loadAsync: () => pending.promise } });
  const original: MapModelSite = {
    id: "site",
    src: "/slow.glb",
    placement: defaultPlacement([29.06, 40.18]),
    light: { ...defaultCityScene.light, groundShadow: 0 },
  };
  layer.setSites([original]);
  assert.equal(layer.status("site"), "loading");
  const latest = {
    ...original,
    placement: {
      ...original.placement,
      lng: 29.061,
      headingDeg: 90,
      scale: 2,
      hiddenPoints: [{ lng: 29.062, lat: 40.18 }],
    },
  };
  layer.setSites([latest]);
  const scene = new Group();
  scene.add(new Mesh(new BoxGeometry(10, 4, 6)));
  pending.resolve({ scene });
  await pending.promise;
  try {
    assert.equal(layer.status("site"), "ready");
    assert.deepEqual(origins, [[latest.placement.lng, latest.placement.lat]]);
    assert.deepEqual(layer.hideRules(), [
      {
        footprint: footprintRing(latest.placement, {
          minX: -5,
          maxX: 5,
          minZ: -3,
          maxZ: 3,
        }),
        hiddenPoints: latest.placement.hiddenPoints,
        keptPoints: [],
      },
    ]);
  } finally {
    layer.onRemove(map);
  }
});
