import './styles.css';
import './perf.js';
import { createMap, addPlinth, addRoute, addMarkers, addRotationDial, flyToStop } from './map.js';
import { initChrome, setProgress, setCard, markerElement, setMarkerStates } from './ui.js';
import { STOPS, MOSQUE, FOUNTAIN } from './stops.js';
import { createMonumentsLayer } from './mapModel.js';
import { createDetailView } from './detailView.js';
import { REDUCE_MOTION } from './perf.js';

initChrome();
const map = createMap('map');
window.__map = map; // handy for debugging in the console

let current = 0;
let markers = [];

function goTo(i, fly = true) {
  current = Math.max(0, Math.min(STOPS.length - 1, i));
  setProgress(current);
  setMarkerStates(markers, current);
  setCard(current, { onOpen: openDetail, onPrev: () => goTo(current - 1), onNext: () => goTo(current + 1) });
  if (fly) flyToStop(map, current);
}

function onMarker(i) {
  if (STOPS[i].has3d) { if (current !== i) goTo(i, false); openDetail(); }
  else goTo(i);
}

let detail = null, busy = false;

/** Map camera dives toward the mosque while the detail view fades in over it. */
function openDetail() {
  if (detail || busy) return;
  const saved = { center: map.getCenter(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
  map.flyTo({ center: MOSQUE.lngLat, zoom: 18.7, pitch: 62, bearing: saved.bearing + 25, duration: REDUCE_MOTION ? 0 : 1000, essential: true });
  detail = createDetailView({
    stop: STOPS[0],
    onBack: () => closeDetail(saved),
    onNext: () => closeDetail(null).then(() => goTo(1)),
  });
  setTimeout(() => detail && detail.show(), REDUCE_MOTION ? 0 : 380);
}

async function closeDetail(restore) {
  if (!detail || busy) return;
  busy = true;
  if (restore) map.flyTo({ ...restore, duration: REDUCE_MOTION ? 0 : 900, essential: true });
  await detail.close();
  detail = null; busy = false;
}

map.on('load', () => {
  addPlinth(map);
  addRoute(map);
  map.addLayer(createMonumentsLayer({
    mosque: MOSQUE, fountain: FOUNTAIN,
    onTap: id => onMarker(STOPS.findIndex(s => s.model === id)),
  }));
  markers = addMarkers(map, i => markerElement(i, onMarker));
  addRotationDial(map, { onReset: () => flyToStop(map, current) });
  goTo(0, false);
});

window.__app = { goTo, openDetail };
