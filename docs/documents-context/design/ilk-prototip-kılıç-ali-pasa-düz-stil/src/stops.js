// Route data. Coordinates from OpenStreetMap (© OpenStreetMap contributors, ODbL).

// Kılıç Ali Paşa Camii — OSM way 165574748. Area-weighted centroid of the footprint.
export const MOSQUE = {
  lngLat: [28.9809471, 41.0264162],
  // Long (qibla) axis of the OSM footprint points to ~132° (SE); the model's
  // portico faces the opposite way (NW), toward the courtyard.
  qiblaAzimuth: 132,
  footprint: [[28.9809948, 41.0262177], [28.9810672, 41.0262784], [28.9810967, 41.0262643], [28.9811635, 41.0263204], [28.9811369, 41.0263331], [28.9812093, 41.0264019], [28.981035, 41.0265172], [28.9810001, 41.0265414], [28.9810186, 41.0265632], [28.9809706, 41.02659], [28.9809492, 41.0265697], [28.9808714, 41.0266163], [28.9806855, 41.026453], [28.9807292, 41.0264282], [28.9807477, 41.0263872], [28.9807829, 41.0263675], [28.9808177, 41.0263513], [28.9807963, 41.0263351], [28.9809948, 41.0262177]],
};

// Tophane Çeşmesi — OSM way 1051483433 (amenity=fountain, fountain=sebilj, building=yes).
// Centroid of the 4-node footprint (~13.8 × 11.9 m incl. the eaves), across the street, ~46 m NE of the mosque.
export const FOUNTAIN = {
  lngLat: [28.9812685, 41.0267496],
  azimuth: 144.6,             // bearing of one footprint side; the model is square, so any side works
  footprint: [[28.9813765, 41.0267415], [28.9812426, 41.02667], [28.9811605, 41.0267576], [28.9812944, 41.0268291], [28.9813765, 41.0267415]],
};

export const STOPS = [
  {
    id: 'kilic-ali-pasa', name: 'Kılıç Ali Paşa Camii', sub: 'Mimar Sinan · 1580', has3d: true, model: 'mosque',
    lngLat: [28.98035, 41.02651],              // ~50 m W: screen-left of the model in the default bearings, clear of the minaret
    view: { center: [28.98085, 41.02655], zoom: 17.6, pitch: 55, bearing: -28 },
  },
  {
    id: 'tophane-cesmesi', name: 'Tophane Çeşmesi', sub: 'Sultan I. Mahmud · 1732', has3d: false, model: 'fountain',
    lngLat: [28.98101, 41.0267],               // ~22 m W of the fountain (OSM way 1051483433), on the route, so it doesn't cover the model
    view: { center: [28.98118, 41.02672], zoom: 18.4, pitch: 55, bearing: -20 },
  },
  {
    id: 'nusretiye', name: 'Nusretiye Camii', sub: 'Krikor Balyan · 1826', has3d: false,
    lngLat: [28.9831455, 41.0274139],          // OSM way 498861882
    view: { center: [28.98305, 41.02738], zoom: 17.3, pitch: 50, bearing: -20 },
  },
];

// Stop 1 -> 2 crosses the open square; 2 -> 3 follows an OSRM foot route (routing.openstreetmap.de).
export const ROUTE = [
  [28.98035, 41.02651], [28.980593, 41.026658], [28.98092, 41.026692], [28.98101, 41.0267], [28.98112, 41.026712], [28.9812685, 41.0267496],
  [28.981444, 41.026873], [28.981607, 41.026847], [28.981818, 41.026798], [28.981904, 41.027239],
  [28.982277, 41.027374], [28.982311, 41.027442], [28.982587, 41.027533], [28.983032, 41.027664],
  [28.9831455, 41.0274139],
];

// Whole route on a phone screen (~300 m wide at z16.25).
export const START_VIEW = { center: [28.98185, 41.0269], zoom: 16.25, pitch: 50, bearing: -20 };

/**
 * A lng/lat in the mosque model's local frame (metres; +x toward ~42°, +z toward the qibla at 132°),
 * i.e. the inverse of the map layer's rotation of (180° - qiblaAzimuth) about Y. Equirectangular is
 * plenty for tens of metres.
 */
export function toLocal([lng, lat]) {
  const [lng0, lat0] = MOSQUE.lngLat;
  const east = (lng - lng0) * 111320 * Math.cos(lat0 * Math.PI / 180), south = -(lat - lat0) * 110574;
  const t = (180 - MOSQUE.qiblaAzimuth) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  return { x: east * c - south * s, z: east * s + south * c };
}
