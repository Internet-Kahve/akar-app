// MapLibre map: illustrated style, walking route, stop markers.
import * as maplibregl from 'maplibre-gl';
// MapLibre v6 loads its worker as a separate ES module; let Vite bundle it.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { buildStyle, wavesImage, PAL } from './style.js';
import { STOPS, ROUTE, MOSQUE, FOUNTAIN, START_VIEW } from './stops.js';
import { PIXEL_RATIO, LOW_END, REDUCE_MOTION } from './perf.js';
import { createDial } from './dial.js';

maplibregl.setWorkerUrl(workerUrl);

export function createMap(container) {
  const map = new maplibregl.Map({
    container,
    style: buildStyle({ hiddenNames: STOPS.map(s => s.name) }),
    ...START_VIEW,
    minZoom: 13, maxZoom: 19.5, maxPitch: 65,
    pixelRatio: PIXEL_RATIO,
    canvasContextAttributes: { antialias: !LOW_END, powerPreference: 'default' },
    fadeDuration: LOW_END ? 0 : 200,
    maxTileCacheSize: LOW_END ? 60 : null,
    attributionControl: { compact: true },
    dragRotate: true, touchPitch: true,
    doubleClickZoom: false,   // no double-click / double-tap zoom: avoids accidental jumps (as in the 3D view)
  });

  // The wave pattern is generated in code; register it when the style asks.
  map.setMissingStyleImageResolver(id => {
    if (map.hasImage(id)) return;
    if (id === 'waves') { const s = wavesImage(); map.addImage(id, s.data, { pixelRatio: s.pixelRatio }); }
  });
  return map;
}

/** Fly the camera to a stop's framing. */
export function flyToStop(map, i, opts = {}) {
  const v = STOPS[i].view;
  map.flyTo({ ...v, duration: REDUCE_MOTION ? 0 : 1600, essential: true, ...opts });
}

const FIRST_LABEL = 'water-name-point';

/** Light plinths over the OSM footprints of the modelled monuments (hide the flat buildings under the 3D models). */
export function addPlinth(map) {
  const poly = ring => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } });
  map.addSource('plinth', { type: 'geojson', data: { type: 'FeatureCollection', features: [poly(MOSQUE.footprint), poly(FOUNTAIN.footprint)] } });
  map.addLayer({ id: 'plinth', type: 'fill', source: 'plinth', paint: { 'fill-color': PAL.landLight } }, FIRST_LABEL);
  map.addLayer({ id: 'plinth-line', type: 'line', source: 'plinth', paint: { 'line-color': PAL.gold, 'line-width': 1, 'line-opacity': 0.8 } }, FIRST_LABEL);
}

/** Teal dashed walking route on a soft white band, drawn under the labels. */
export function addRoute(map) {
  map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: ROUTE } } });
  const w = (a, b) => ['interpolate', ['linear'], ['zoom'], 14, a, 18, b];
  map.addLayer({ id: 'route-band', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ffffff', 'line-opacity': 0.85, 'line-width': w(4, 10) } }, FIRST_LABEL);
  map.addLayer({ id: 'route-dash', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': PAL.teal, 'line-width': w(1.6, 3.6), 'line-dasharray': [1.6, 1.8] } }, FIRST_LABEL);
}

/** Numbered circular DOM markers; returns their elements. */
export function addMarkers(map, makeEl) {
  return STOPS.map((s, i) => {
    const el = makeEl(i);
    new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(s.lngLat).addTo(map);
    return el;
  });
}

/**
 * Rotation dial on the right edge of the map (same component as the 3D view). The knob is the map's
 * bearing, i.e. the compass direction the top of the screen faces; dragging around the dial turns the
 * map around the screen centre, smoothly following the finger. One-finger pan, pinch zoom and
 * two-finger rotate keep working; the knob follows them too.
 * @param {maplibregl.Map} map
 * @param {{onReset: () => void}} o  centre tap: back to the current stop's default framing
 */
export function addRotationDial(map, { onReset }) {
  let target = null, raf = 0;
  const tick = () => {
    raf = 0;
    if (target == null) return;
    const cur = map.getBearing(), d = ((target - cur + 540) % 360) - 180;   // shortest way round
    if (REDUCE_MOTION || Math.abs(d) < 0.1) { map.setBearing(target); target = null; return; }
    map.setBearing(cur + d * 0.3);
    raf = requestAnimationFrame(tick);
  };
  const dial = createDial({
    onGrab: () => { map.stop(); },                      // interrupt a running flyTo
    onTurn: deg => { target = deg > 180 ? deg - 360 : deg; if (!raf) raf = requestAnimationFrame(tick); },
    onZoom: dir => map.easeTo({ zoom: map.getZoom() + dir, duration: REDUCE_MOTION ? 0 : 300 }),
    onReset: () => { target = null; dial.cancel(); onReset(); },
  });
  document.body.appendChild(dial.el);
  const sync = () => dial.setKnob(map.getBearing());
  map.on('rotate', sync);
  sync();

  // Band: below the progress header, above the stop card and the attribution button (both in the right column on phones).
  const rect = sel => { const e = document.querySelector(sel); const r = e?.getBoundingClientRect(); return r && r.height ? r : null; };
  const layout = () => dial.place({
    top: (rect('#progress')?.bottom ?? 0) + 12,
    height: window.innerHeight,
    obstacles: [rect('#card'), rect('.maplibregl-ctrl-bottom-right')],
  });
  const ro = new ResizeObserver(layout);
  ['#progress', '#card', '.maplibregl-ctrl-bottom-right'].forEach(sel => { const e = document.querySelector(sel); if (e) ro.observe(e); });
  window.addEventListener('resize', layout);
  layout();
  return dial;
}
