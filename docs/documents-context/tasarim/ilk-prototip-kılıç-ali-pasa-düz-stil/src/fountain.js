// Tophane Çeşmesi (1732, Sultan I. Mahmud), in the same flat toon style as the mosque.
// Approximate ("Temsili canlandırma"): a freestanding square marble meydan çeşmesi
// with rounded sebil-like corners, a tap niche and carved relief panels on each
// face, wide overhanging eaves and a low roof with small finials.
// Size follows the OSM footprint (way 1051483433, ~13.8 × 11.9 m incl. eaves) and
// its height tag (4 m to the eaves); proportions are estimated, not surveyed.
//
// Local frame: origin at the centre of the footprint, +y up; the four faces point
// along ±x / ±z, so a yaw only needs to align one side.
import * as THREE from 'three';
import { Acc, T, box, cyl, archGeos, alem, C } from './mosque.js';

const B = 4.6;          // half width of the body
const R = 1.45;         // corner (sebil) radius
const H = 4.2;          // body height up to the frieze
const EAVE = 6.3;       // half width of the eaves
const SQ = Math.SQRT2;

/** Square frustum/pyramid (a 4-sided cylinder turned 45°), base at y = 0. */
const sq = (top, bottom, h) => new THREE.CylinderGeometry(top * SQ, bottom * SQ, h, 4, 1).rotateY(Math.PI / 4).translate(0, h / 2, 0);

/**
 * @param {{detail?: 'low'|'high', kit: ReturnType<import('./mosque.js').createKit>, x?: number, z?: number, ry?: number}} o
 * @returns {THREE.Group} userData = { mainGeo, meshes, triangles }
 */
export function buildFountain({ detail = 'low', kit, x = 0, z = 0, ry = 0 }) {
  const hi = detail === 'high';
  const main = new Acc(), fine = new Acc();
  const cs = hi ? 14 : 8;                       // corner cylinder segments

  // steps / base
  main.add(box(2 * B + 1.6, 0.25, 2 * B + 1.6), T(0, 0, 0), C.stoneShade);
  main.add(box(2 * B + 0.8, 0.25, 2 * B + 0.8), T(0, 0.25, 0), C.stoneWarm);
  const y0 = 0.5;

  // body: a rounded square (two crossing boxes + four corner cylinders)
  main.add(box(2 * (B - R), H, 2 * B), T(0, y0, 0), C.stone);
  main.add(box(2 * B, H, 2 * (B - R)), T(0, y0, 0), C.stone);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * (B - R), cz = sz * (B - R);
    main.add(cyl(R + 0.15, R + 0.15, H, cs), T(cx, y0, cz), C.stone);           // sebil drum, bulging a little
    if (hi) {
      main.add(cyl(R + 0.35, R + 0.35, 0.3, cs), T(cx, y0, cz), C.stoneWarm);   // base moulding                                                                      // grilled sebil window toward the diagonal
      const a = Math.atan2(sx, sz), r = R + 0.17;
      for (const g of archGeos(1.5, 2.4, 0.12)) fine.add(g, T(cx + Math.sin(a) * r, y0 + 0.9, cz + Math.cos(a) * r, a), C.dark);
      for (let k = -2; k <= 2; k++) {
        const b = a + k * 0.16;
        fine.add(box(0.07, 2.2, 0.07), T(cx + Math.sin(b) * (r + 0.06), y0 + 0.9, cz + Math.cos(b) * (r + 0.06)), C.gold);
      }
    }
  }

  // faces: tap niche with basin, flanked by carved relief panels
  for (let f = 0; f < 4; f++) {
    const a = f * Math.PI / 2, nx = Math.sin(a), nz = Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a);
    const at = (u, out, y = 0) => T(tx * u + nx * out, y, tz * u + nz * out, a);
    // niche (ayna taşı recess)
    if (hi) for (const g of archGeos(1.7, 2.9, 0.06)) fine.add(g, at(0, B + 0.1, y0 + 0.5), C.dark);   // in front of its frame
    else fine.add(box(1.7, 2.6, 0.06), at(0, B + 0.1, y0 + 0.5), C.dark);
    main.add(box(2.5, 3.6, 0.18), at(0, B + 0.02, y0 + 0.2), C.stoneWarm);       // raised niche frame
    // basin (yalak) and tap
    main.add(box(2.2, 0.55, 0.9), at(0, B + 0.45, y0), C.stoneShade);
    if (hi) {
      fine.add(cyl(0.09, 0.09, 0.5, 6).rotateX(Math.PI / 2), at(0, B + 0.35, y0 + 1.55), C.gold);
      fine.add(new THREE.SphereGeometry(0.22, 8, 5), at(0, B + 0.2, y0 + 1.55), C.gold);
    }
    // relief panels left and right of the niche
    for (const s of [-1, 1]) {
      const u = s * 1.9;
      main.add(box(1.1, 2.9, 0.12), at(u, B + 0.02, y0 + 0.55), C.stoneWarm);
      if (hi) {
        // stylised vase of flowers in relief (Tulip-era motif), teal and gold
        fine.add(cyl(0.22, 0.32, 0.6, 8), at(u, B + 0.1, y0 + 1.0), C.teal);
        fine.add(new THREE.SphereGeometry(0.42, 8, 5).scale(1, 1, 0.35), at(u, B + 0.12, y0 + 1.95), C.teal);
        for (const k of [-1, 0, 1]) fine.add(new THREE.SphereGeometry(0.16, 6, 4).scale(1, 1, 0.5), at(u + k * 0.32, B + 0.16, y0 + 2.35 + (k ? 0 : 0.25)), C.gold);
        fine.add(box(0.9, 0.08, 0.06), at(u, B + 0.09, y0 + 3.0), C.gold);
      }
    }
    // frieze (inscription band) under the eaves
    if (hi) fine.add(box(2 * (B - R) + 0.2, 0.42, 0.06), at(0, B + 0.03, y0 + H - 0.62), C.teal);
  }

  // frieze course, wide overhanging eaves (flared) and a low lead roof
  const yE = y0 + H;
  main.add(sq(B + 0.35, B + 0.15, 0.45), T(0, yE, 0), C.stoneWarm);
  main.add(sq(EAVE, B + 0.4, 0.75), T(0, yE + 0.45, 0), C.stoneShade);          // eave soffit, flaring outward
  main.add(sq(EAVE, EAVE, 0.22), T(0, yE + 1.2, 0), C.stone);                    // fascia
  main.add(sq(0.9, EAVE - 0.15, 1.5), T(0, yE + 1.42, 0), C.lead);               // low hipped roof
  const yTop = yE + 2.92;
  main.add(cyl(0.95, 1.05, 0.35, cs), T(0, yTop, 0), C.stone);                   // little crown + finial
  main.add(new THREE.SphereGeometry(0.85, cs, hi ? 5 : 3, 0, Math.PI * 2, 0, Math.PI / 2), T(0, yTop + 0.35, 0), C.lead);
  if (hi) alem(fine, 0, yTop + 1.1, 0, 0.65, true);
  else fine.add(new THREE.ConeGeometry(0.18, 1.3, 5).translate(0, 0.65, 0), T(0, yTop + 1.1, 0), C.gold);
  if (hi) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                  // small finials on the eave corners
    const ex = sx * (EAVE - 0.5), ez = sz * (EAVE - 0.5);
    fine.add(cyl(0.18, 0.28, 0.35, 6), T(ex, yE + 1.42, ez), C.stoneWarm);
    fine.add(new THREE.ConeGeometry(0.16, 0.7, 6).translate(0, 0.35, 0), T(ex, yE + 1.77, ez), C.gold);
  }

  // --- bake ---
  const group = new THREE.Group();
  const mainGeo = main.geometry(), fineGeo = fine.geometry();
  const mesh = new THREE.Mesh(mainGeo, kit.toon), fineMesh = new THREE.Mesh(fineGeo, kit.toon);
  group.add(mesh, fineMesh, new THREE.Mesh(mainGeo, kit.hull));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(mainGeo, 30), kit.line));
  group.add(kit.blob(EAVE * 3, EAVE * 3));
  group.position.set(x, 0, z);
  group.rotation.y = ry;
  group.userData = { mainGeo, meshes: [mesh, fineMesh], triangles: (mainGeo.attributes.position.count + fineGeo.attributes.position.count) / 3 };
  return group;
}
