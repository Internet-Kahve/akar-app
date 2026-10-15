// Kılıç Ali Paşa Camii, built in code in a flat illustrated style:
// toon material with a 3-step gradient, thin outlines in a darker tone of each
// surface's own colour (inverted hull) and soft crease lines, blob shadows.
//
// One builder, two levels:
//   detail: 'low'  -> map model (~4k triangles), one mesh + one line set
//   detail: 'high' -> detail view (~30k triangles): windows, buttresses,
//                     portico arcade, courtyard, şadırvan, türbe, cypresses
//
// Units are metres. Local frame: +y up, portico/courtyard toward -z,
// mihrab (qibla) toward +z, minaret on +x. Origin = centre of the OSM footprint.
import * as THREE from 'three';

export const C = {
  stone: '#f7f0e4', stoneWarm: '#ecdcc6', stoneShade: '#dcc6aa', lead: '#a7b6cb', leadDark: '#8c9fb9',
  terra: '#df9a78', terraDeep: '#c97c5c', teal: '#2f7a76',
  gold: '#dcaa3f', dark: '#2f6466', paving: '#f3dcc0', sand: '#f3d5b3',
  cypress: '#3d7a66', cypress2: '#4f8f6c', leaf: '#86b97a', leaf2: '#6aa572', trunk: '#94704f',
  grass: '#b2d394', line: 0x7a6555,
};

// Hall and dome dimensions (approximate, see README)
export const HALL = { w: 26, d: 26, h: 12, z: 2.5 };            // z = centre of hall along the qibla axis
export const DOME = { r: 6.5, drumR: 6.8, drumH: 2.4, base: 13.4 };
export const SEMI_R = 6.0;
const PORT = { z0: -18.5, z1: -10.5, h: 7.5 };
const MIN = { x: 14.7, z: -8.6 };

/** Materials shared by every part of one build; call dispose() when done. */
export function createKit() {
  const grad = new THREE.DataTexture(new Uint8Array([150, 205, 255]), 3, 1, THREE.RedFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
  const kit = {
    grad,
    toon: new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad }),
    // Soft crease lines (1px, translucent warm grey) instead of black ink.
    line: new THREE.LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.32, depthWrite: false }),
    // Inverted-hull silhouette: back faces pushed out along the normal by a
    // fixed number of screen pixels (works for any projection, incl. MapLibre's).
    // Coloured with a darker tone of the surface's own vertex colour.
    hull: new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexColors: true,
      uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uPx: { value: 0.8 } },
      vertexShader: `uniform vec2 uRes; uniform float uPx; varying vec3 vC;
        void main() {
          vC = mix(color * 0.62, vec3(0.36, 0.29, 0.25), 0.3);
          mat4 mvp = projectionMatrix * modelViewMatrix;
          vec4 c0 = mvp * vec4(position, 1.0);
          vec4 c1 = mvp * vec4(position + normal * 0.1, 1.0);
          vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * uRes;
          float l = length(d);
          if (l > 1e-5) c0.xy += (d / l) * uPx * 2.0 / uRes * c0.w;
          gl_Position = c0;
        }`,
      fragmentShader: `varying vec3 vC; void main() { gl_FragColor = vec4(vC, 1.0); }`,
    }),
    // Soft round blob shadow (a transparent plane; no real-time shadows).
    shadowTex: blobTexture(),
    shadow: null,
    /** Keep outline width in pixels: pass the drawing-buffer size. */
    setResolution(w, h) { kit.hull.uniforms.uRes.value.set(w, h); },
    /** Flat ellipse of soft shadow under a building, w × d metres, on the ground. */
    blob(w, d, x = 0, z = 0, ry = 0) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), kit.shadow);
      m.position.set(x, 0.05, z); m.rotation.y = ry; m.renderOrder = -1;
      return m;
    },
    dispose() { grad.dispose(); kit.toon.dispose(); kit.line.dispose(); kit.hull.dispose(); kit.shadowTex.dispose(); kit.shadow.dispose(); },
  };
  kit.shadow = new THREE.MeshBasicMaterial({ map: kit.shadowTex, color: '#7a5542', transparent: true, opacity: 0.34, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  return kit;
}

function blobTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Lights matched to the reference (ambient .55 / directional .62 in legacy units). */
export function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 1.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.75);
  sun.position.set(-40, 80, -60);
  scene.add(sun);
  return sun;
}

// ---------------------------------------------------------------------------
// Merge helper: every part is baked into a few vertex-coloured buffers.

export class Acc {
  constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, m, hex) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(m);
    const P = g.attributes.position.array, N = g.attributes.normal.array, col = _col.set(hex);
    for (let i = 0; i < P.length; i++) { this.p.push(P[i]); this.n.push(N[i]); }
    for (let i = 0; i < P.length / 3; i++) this.c.push(col.r, col.g, col.b);
    g.dispose();
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    return g;
  }
}
const _col = new THREE.Color(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
/** Transform: position, rotation about Y, optional scale. */
export const T = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(sx, sy, sz));

// Geometry primitives (base at y = 0)
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
export const cyl = (rt, rb, h, seg, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open).translate(0, h / 2, 0);
const cone = (r, h, seg) => new THREE.ConeGeometry(r, h, seg).translate(0, h / 2, 0);
export const dome = (r, ws, hs) => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, Math.PI / 2);
/** Half dome bulging toward +z, closed by a half-disc facing -z. */
export function semiDome(r, ws, hs) {
  const shell = new THREE.SphereGeometry(r, ws, hs, 0, Math.PI, 0, Math.PI / 2);
  const cap = new THREE.CircleGeometry(r, ws, 0, Math.PI).rotateY(Math.PI);
  return [shell, cap];
}
/** Arched opening facing +z: rectangle + half-cylinder head. */
export function archGeos(w, h, d) {
  const r = w / 2;
  return [box(w, h - r, d), new THREE.CylinderGeometry(r, r, d, 10, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, h - r, 0)];
}
/** Gold finial (alem): rod, beads and, at high detail, a crescent. */
export function alem(acc, x, y, z, s, high) {
  acc.add(cyl(0.07 * s, 0.07 * s, 1.4 * s, 6), T(x, y, z), C.gold);
  acc.add(new THREE.SphereGeometry(0.28 * s, 8, 6), T(x, y + 0.55 * s, z), C.gold);
  acc.add(new THREE.SphereGeometry(0.2 * s, 8, 6), T(x, y + 1.05 * s, z), C.gold);
  if (high) acc.add(new THREE.TorusGeometry(0.42 * s, 0.07 * s, 5, 14, Math.PI * 1.35).rotateZ(Math.PI * 0.82), T(x, y + 1.85 * s, z), C.gold);
}

// ---------------------------------------------------------------------------

/**
 * @param {{detail?: 'low'|'high', kit?: ReturnType<typeof createKit>}} opts
 * @returns {THREE.Group} group.userData = { mesh, triangles, kit }
 */
export function buildMosque({ detail = 'low', kit = createKit() } = {}) {
  const hi = detail === 'high';
  const seg = hi ? { dome: [32, 12], small: [16, 6], drum: 24, shaft: 16 } : { dome: [14, 5], small: [10, 4], drum: 12, shaft: 10 };
  const main = new Acc();   // big masses: silhouette + crease lines
  const fine = new Acc();   // windows, finials, trees: silhouette only at high detail

  // --- prayer hall ---
  main.add(box(HALL.w, HALL.h, HALL.d), T(0, 0, HALL.z), C.stone);
  main.add(box(HALL.w + 0.6, 0.5, HALL.d + 0.6), T(0, HALL.h - 0.5, HALL.z), C.stoneWarm);           // cornice
  main.add(box(14, DOME.base - HALL.h, 14), T(0, HALL.h, HALL.z), C.stone);                          // raised central bay

  // central dome on drum
  main.add(cyl(DOME.drumR, DOME.drumR, DOME.drumH, seg.drum), T(0, DOME.base, HALL.z), C.stone);
  main.add(cyl(DOME.drumR + 0.25, DOME.drumR + 0.25, 0.35, seg.drum), T(0, DOME.base + DOME.drumH - 0.35, HALL.z), C.stoneWarm);
  const domeY = DOME.base + DOME.drumH;
  main.add(dome(DOME.r, ...seg.dome), T(0, domeY, HALL.z), C.lead);
  alem(fine, 0, domeY + DOME.r - 0.1, HALL.z, 1.6, hi);

  // two semi-domes on the qibla axis (Hagia Sophia scheme)
  for (const s of [-1, 1]) {
    const [shell, cap] = semiDome(SEMI_R, ...seg.dome.map(n => Math.max(4, n >> 1)));
    const m = T(0, HALL.h + 0.6, HALL.z + s * DOME.r, s > 0 ? 0 : Math.PI);
    main.add(shell, m, C.lead); main.add(cap, m, C.stone);
    main.add(box(SEMI_R * 2 + 0.4, 0.6, SEMI_R + 0.3), T(0, HALL.h, HALL.z + s * (DOME.r + SEMI_R / 2 - 0.15)), C.stone);
  }

  // side-aisle domes and corner weight turrets
  for (const sx of [-1, 1]) for (const dz of [-8, 0, 8]) {
    main.add(cyl(2.6, 2.6, 0.8, 8), T(sx * 9.6, HALL.h, HALL.z + dz), C.stone);
    main.add(dome(2.4, ...seg.small), T(sx * 9.6, HALL.h + 0.8, HALL.z + dz), C.lead);
    if (hi) alem(fine, sx * 9.6, HALL.h + 3.1, HALL.z + dz, 0.6, false);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    main.add(cyl(0.9, 1.0, 2.6, 8), T(sx * 7.3, DOME.base - 1.4, HALL.z + sz * 7.3), C.stone);
    main.add(dome(0.95, ...seg.small), T(sx * 7.3, DOME.base + 1.2, HALL.z + sz * 7.3), C.lead);
    if (hi) alem(fine, sx * 7.3, DOME.base + 2.1, HALL.z + sz * 7.3, 0.4, false);
  }

  // mihrab apse (qibla side)
  const apseZ = HALL.z + HALL.d / 2;
  main.add(box(9, 9, 3), T(0, 0, apseZ + 1.5), C.stone);
  {
    const [shell, cap] = semiDome(3.6, ...seg.small);
    main.add(shell, T(0, 9, apseZ - 0.6), C.lead); main.add(cap, T(0, 9, apseZ - 0.6), C.stone);
  }

  // --- portico (son cemaat yeri) ---
  const pz = (PORT.z0 + PORT.z1) / 2, pd = PORT.z1 - PORT.z0;
  if (hi) buildArcade(main, fine, pz, pd);
  else {
    main.add(box(HALL.w, PORT.h, pd), T(0, 0, pz), C.stone);
    for (let i = 0; i < 5; i++) for (const g of archGeos(3.2, 5.2, 0.3)) fine.add(g, T((i - 2) * 5.1, 0.4, PORT.z0 - 0.05), C.dark);
  }
  main.add(box(HALL.w + 0.4, 0.6, pd + 0.4), T(0, PORT.h, pz), C.stoneWarm);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 5.1;
    main.add(cyl(2.2, 2.2, 0.7, 8), T(x, PORT.h + 0.6, pz), C.stone);
    main.add(dome(2.05, ...seg.small), T(x, PORT.h + 1.3, pz), C.lead);
    if (hi) alem(fine, x, PORT.h + 3.25, pz, 0.55, false);
  }

  // --- minaret ---
  buildMinaret(main, fine, hi, seg);

  // --- detail-only: windows, buttresses, door, drum windows, surroundings ---
  if (hi) {
    buildFacades(main, fine);
    buildDrumDetail(main, fine, domeY);
    buildSurroundings(main, fine);
  }

  // --- bake ---
  const group = new THREE.Group();
  const mainGeo = main.geometry(), fineGeo = fine.geometry();
  const mesh = new THREE.Mesh(mainGeo, kit.toon);
  const fineMesh = new THREE.Mesh(fineGeo, kit.toon);
  group.add(mesh, fineMesh, new THREE.Mesh(mainGeo, kit.hull));
  if (hi) group.add(new THREE.Mesh(fineGeo, kit.hull));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(mainGeo, 30), kit.line));
  group.add(kit.blob(hi ? 48 : 40, hi ? 60 : 50, 0, hi ? -2 : -1));
  group.userData = { kit, meshes: [mesh, fineMesh], triangles: (mainGeo.attributes.position.count + fineGeo.attributes.position.count) / 3 };
  return group;
}

/** Dispose every geometry in a built group, plus its material kit (incl. blob shadows, which share its material). */
export function disposeMosque(group) {
  group.traverse(o => o.geometry && o.geometry.dispose());
  group.userData.kit?.dispose();
}

// ---------------------------------------------------------------------------

function buildMinaret(main, fine, hi, seg) {
  const { x, z } = MIN, S = seg.shaft;
  main.add(box(3.4, 13, 3.4), T(x, 0, z), C.stone);
  main.add(box(3.7, 0.4, 3.7), T(x, 12.8, z), C.stoneWarm);
  main.add(cyl(1.45, 1.75, 2, 8), T(x, 13.2, z), C.stone);                 // transition (pabuç)
  main.add(cyl(1.3, 1.4, 17.4, S), T(x, 15.2, z), C.stone);               // shaft
  // şerefe (balcony) on corbels
  main.add(cyl(2.15, 1.3, 1.3, S), T(x, 32.6, z), C.stoneWarm);
  main.add(cyl(2.2, 2.2, 0.35, S), T(x, 33.9, z), C.stone);
  if (hi) {
    main.add(cyl(2.15, 2.15, 1.0, S, true), T(x, 34.25, z), C.stone);     // railing
    for (let i = 0; i < 3; i++) main.add(cyl(1.3 + 0.28 * i, 1.3 + 0.28 * i, 0.22, S), T(x, 31.8 + i * 0.35, z), C.stoneWarm); // muqarnas hint
    for (let i = 0; i < 8; i++) {                                           // shaft flutes
      const a = (i / 8) * Math.PI * 2;
      fine.add(box(0.12, 16, 0.12), T(x + Math.sin(a) * 1.33, 16, z + Math.cos(a) * 1.33), C.stoneWarm);
    }
    for (let i = 0; i < 3; i++) fine.add(box(0.35, 0.9, 0.1), T(x + 1.36, 18 + i * 5, z, Math.PI / 2), C.dark);  // slit windows
  } else main.add(cyl(2.15, 2.15, 0.7, S), T(x, 34.25, z), C.stone);
  main.add(cyl(1.12, 1.15, 5.6, S), T(x, 34.25, z), C.stone);             // upper shaft
  main.add(cyl(1.3, 1.3, 0.35, S), T(x, 39.85, z), C.stoneWarm);
  main.add(cone(1.38, 7.6, S), T(x, 40.2, z), C.lead);                     // conical cap (külah)
  alem(fine, x, 47.6, z, 1.1, hi);
}

function buildArcade(main, fine, pz, pd) {
  const W = HALL.w, H = PORT.h, t = 0.9;
  // front arcade wall: shape with five arched openings, extruded
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H); shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const aw = 3.6, spring = 4.2;
  for (let i = 0; i < 5; i++) {
    const cx = (i - 2) * 5.1, h = new THREE.Path();
    h.moveTo(cx - aw / 2, 0); h.lineTo(cx - aw / 2, spring);
    h.absarc(cx, spring, aw / 2, Math.PI, 0, true);           // round arch
    h.lineTo(cx + aw / 2, 0); h.lineTo(cx - aw / 2, 0);
    shape.holes.push(h);
  }
  const front = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 10 });
  main.add(front, T(0, 0, PORT.z0), C.stone);
  // side walls with one arch each
  for (const s of [-1, 1]) {
    const side = new THREE.Shape();
    side.moveTo(0, 0); side.lineTo(pd, 0); side.lineTo(pd, H); side.lineTo(0, H); side.lineTo(0, 0);
    const h = new THREE.Path(), c = pd / 2;
    h.moveTo(c - 1.6, 0); h.lineTo(c - 1.6, 3.8); h.absarc(c, 3.8, 1.6, Math.PI, 0, true); h.lineTo(c + 1.6, 0); h.lineTo(c - 1.6, 0);
    side.holes.push(h);
    const g = new THREE.ExtrudeGeometry(side, { depth: t, bevelEnabled: false, curveSegments: 8 });
    main.add(g, T(s * W / 2 - (s > 0 ? t : 0), 0, PORT.z1, Math.PI / 2), C.stone);
  }
  // floor, shadowed back (hall front wall), door and columns
  main.add(box(W, 0.4, pd), T(0, 0, pz), C.stoneShade);
  fine.add(box(W - 2, H - 0.5, 0.2), T(0, 0, PORT.z1 - 0.15), C.stoneShade);
  for (const g of archGeos(2.6, 5, 0.3)) fine.add(g, T(0, 0.4, PORT.z1 - 0.3), C.dark);
  for (const sx of [-1, 1]) for (const k of [1, 2]) for (const g of archGeos(1.6, 3.4, 0.25)) fine.add(g, T(sx * k * 4.8, 1.2, PORT.z1 - 0.3), C.dark);
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * 5.1;
    fine.add(cyl(0.38, 0.42, 4.0, 10), T(x, 0.3, PORT.z0 - 0.35), C.stoneWarm);
    fine.add(box(1.0, 0.45, 1.0), T(x, 4.3, PORT.z0 - 0.35), C.stoneWarm);
    fine.add(box(1.0, 0.3, 1.0), T(x, 0, PORT.z0 - 0.35), C.stoneWarm);
  }
  // inscription panel band over the arcade
  fine.add(box(W - 1.5, 0.7, 0.1), T(0, H - 1.25, PORT.z0 - 0.06), C.gold);
}

/** Two rows of windows between buttresses on the sides and the qibla wall. */
function buildFacades(main, fine) {
  const faces = [
    { ry: Math.PI / 2, cx: HALL.w / 2, cz: HALL.z, len: HALL.d },
    { ry: -Math.PI / 2, cx: -HALL.w / 2, cz: HALL.z, len: HALL.d },
    { ry: 0, cx: 0, cz: HALL.z + HALL.d / 2, len: HALL.w, skipMid: true },
  ];
  for (const f of faces) {
    const tx = Math.cos(f.ry), tz = -Math.sin(f.ry), nx = Math.sin(f.ry), nz = Math.cos(f.ry);
    const at = (u, out) => [f.cx + tx * u + nx * out, f.cz + tz * u + nz * out];
    // buttresses with a stepped top
    for (const u of [-1, -0.5, 0, 0.5, 1]) {
      if (f.skipMid && u === 0) continue;
      const [x, z] = at(u * (f.len / 2 - 0.6), 0.45);
      main.add(box(1.3, HALL.h - 1.5, 0.9), T(x, 0, z, f.ry), C.stoneWarm);
      const [x2, z2] = at(u * (f.len / 2 - 0.6), 0.25);
      main.add(box(1.3, 1.0, 0.5), T(x2, HALL.h - 1.5, z2, f.ry), C.stoneWarm);
    }
    // window rows: rectangular below (with stone frames), arched above, small oculi on top
    for (let k = 0; k < 4; k++) {
      const u = (-1.5 + k) * (f.len / 2 - 0.6) / 2;               // midway between buttresses
      if (f.skipMid && Math.abs(u) < 4.6) continue;              // apse occupies the middle
      const [x, z] = at(u, 0.05), [xf, zf] = at(u, 0.0);
      fine.add(box(2.0, 2.9, 0.12), T(xf, 1.9, zf, f.ry), C.stoneWarm);
      fine.add(box(1.4, 2.2, 0.16), T(x, 2.25, z, f.ry), C.dark);
      for (const g of archGeos(1.4, 3.0, 0.16)) fine.add(g, T(x, 6.3, z, f.ry), C.dark);
      fine.add(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 10).rotateX(Math.PI / 2), T(x, 10.4, z, f.ry), C.dark);
    }
  }
  // mihrab apse windows
  for (const u of [-2.2, 0, 2.2]) for (const g of archGeos(1.1, 2.4, 0.16)) fine.add(g, T(u, 5.4, HALL.z + HALL.d / 2 + 3.05), C.dark);
}

/** Drum windows and little buttresses, semi-dome windows. */
function buildDrumDetail(main, fine, domeY) {
  const n = 16, r = DOME.drumR;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    for (const g of archGeos(0.95, 1.6, 0.2)) fine.add(g, T(Math.sin(a) * (r + 0.02), DOME.base + 0.35, HALL.z + Math.cos(a) * (r + 0.02), a), C.dark);
    const b = (i / n) * Math.PI * 2;
    main.add(box(0.6, DOME.drumH, 0.6), T(Math.sin(b) * (r + 0.2), DOME.base, HALL.z + Math.cos(b) * (r + 0.2), b), C.stoneWarm);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.42;
    for (const g of archGeos(0.8, 1.3, 0.2)) {
      fine.add(g, T(Math.sin(a) * (SEMI_R + 0.02), HALL.h + 0.7, HALL.z + s * DOME.r + s * Math.cos(a) * (SEMI_R + 0.02), s > 0 ? a : Math.PI - a), C.dark);
    }
  }
  fine.add(new THREE.TorusGeometry(DOME.r + 0.02, 0.12, 4, 32).rotateX(Math.PI / 2), T(0, domeY + 0.05, HALL.z), C.gold);
}

/** Courtyard with walls and gate, şadırvan, türbe in the garden, cypresses. */
function buildSurroundings(main, fine) {
  const z0 = PORT.z0 - 0.2, z1 = -42, xw = 18, h = 2.8, t = 0.8, zc = (z0 + z1) / 2;
  // paving
  fine.add(box(xw * 2, 0.12, z0 - z1), T(0, 0, zc), C.paving);
  // walls with a cap course; gate gap on the front wall
  const wall = (len, x, z, ry) => {
    main.add(box(len, h, t), T(x, 0, z, ry), C.stoneShade);
    main.add(box(len + 0.2, 0.35, t + 0.3), T(x, h, z, ry), C.stoneWarm);
  };
  wall(z0 - z1, -xw, zc, Math.PI / 2); wall(z0 - z1, xw, zc, Math.PI / 2);
  wall(xw - 2.5, -(xw + 2.5) / 2, z1, 0); wall(xw - 2.5, (xw + 2.5) / 2, z1, 0);
  // gate portal
  main.add(box(6.4, 5.2, 1.6), T(0, 0, z1), C.stone);
  main.add(box(6.8, 0.4, 2.0), T(0, 5.2, z1), C.stoneWarm);
  for (const g of archGeos(2.8, 4.1, 1.8)) fine.add(g, T(0, 0, z1), C.dark);
  fine.add(box(4.4, 0.6, 0.1), T(0, 4.4, z1 - 0.85), C.gold);
  // şadırvan: octagonal basin, columns, lead roof
  const sz = -30;
  main.add(cyl(3.2, 3.4, 1.0, 8), T(0, 0, sz), C.stoneWarm);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    fine.add(cyl(0.18, 0.18, 2.6, 6), T(Math.sin(a) * 3.0, 1.0, sz + Math.cos(a) * 3.0), C.stone);
  }
  main.add(cyl(4.0, 4.0, 0.35, 8), T(0, 3.6, sz), C.stone);
  main.add(cone(4.2, 2.6, 8), T(0, 3.95, sz), C.lead);
  alem(fine, 0, 6.5, sz, 0.6, true);
  // türbe of Kılıç Ali Paşa in the garden behind the qibla wall
  const tx = -9, tz = 27;
  main.add(cyl(3.3, 3.3, 5.6, 8), T(tx, 0, tz), C.stone);
  main.add(cyl(3.6, 3.6, 0.4, 8), T(tx, 5.6, tz), C.stoneWarm);
  main.add(dome(3.0, 16, 6), T(tx, 6.0, tz), C.lead);
  alem(fine, tx, 8.9, tz, 0.7, true);
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    for (const g of archGeos(0.9, 1.8, 0.15)) fine.add(g, T(tx + Math.sin(a) * 3.15, 2.2, tz + Math.cos(a) * 3.15, a), C.dark);
  }
  // garden patches
  fine.add(box(14, 0.1, 18), T(-21, 0, 8), C.grass);
  fine.add(box(14, 0.1, 18), T(21, 0, 8), C.grass);
  fine.add(box(30, 0.1, 12), T(0, 0, 26), C.grass);
  // trees: tall cypresses and round trees, in three greens
  const spots = [[-14, -22], [14, -22], [-14, -38], [14, -38], [-21, -6], [-22, 4], [-20, 14], [21, -6], [22, 4], [20, 14], [-17, 24], [8, 28], [16, 25], [-3, 31]];
  spots.forEach(([x, z], i) => cypress(fine, x, z, 0.85 + ((i * 37) % 10) / 30, i));
  for (const [x, z, s] of [[-9, -34, 1], [9, -24, 0.9], [-26, 22, 1.1], [27, 22, 0.95]]) roundTree(fine, x, z, s);
}

// Shared tree shapes (merged into `fine`; low poly but rounded)
const CYP = new THREE.LatheGeometry([[0, 0], [0.3, 0], [0.3, 0.9], [1.0, 1.6], [1.25, 3.4], [1.0, 6], [0.55, 8.2], [0, 10]].map(([x, y]) => new THREE.Vector2(x, y)), 8);
const CROWN = new THREE.SphereGeometry(3, 10, 7);
const TRUNK = cyl(0.3, 0.42, 3.6, 6);
export function cypress(acc, x, z, s = 1, i = 0) {
  acc.add(CYP, T(x, 0, z, i, s, s * (1 + (i % 3) * 0.1), s), i % 2 ? C.cypress2 : C.cypress);
}
export function roundTree(acc, x, z, s = 1, i = 0) {
  acc.add(TRUNK, T(x, 0, z, 0, s), C.trunk);
  acc.add(CROWN, T(x, 3.4 * s + 2.3 * s, z, i, s, s * 0.92, s), (Math.round(x + z) + i) % 2 ? C.leaf : C.leaf2);
}
