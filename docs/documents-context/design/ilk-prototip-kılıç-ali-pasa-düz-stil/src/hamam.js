// Kılıç Ali Paşa Hamamı, in the same flat toon style as the mosque (terracotta body).
// Low rectangular body; the entrance hall (soğukluk) under one larger dome,
// the hot rooms (sıcaklık) under a grid of small domes with glass "fil gözü".
// Placement is illustrative: beside the mosque, on the side away from the minaret.
import * as THREE from 'three';
import { Acc, T, box, cyl, dome, archGeos, alem, roundTree, cypress, C } from './mosque.js';

export const HAMAM = { x: -38, z: -4, w: 14, d: 24, h: 5 };

/**
 * @param {ReturnType<import('./mosque.js').createKit>} kit  shared with the mosque (disposed with it)
 * @returns {THREE.Group} userData = { mainGeo, triangles }
 */
export function buildHamam(kit) {
  const { x, z, w, d, h } = HAMAM;
  const main = new Acc(), fine = new Acc();
  const z0 = z - d / 2;                         // entrance end (toward the courtyard, -z)
  const bigZ = z0 + 5.5, bigH = 7;

  // body: low block for the hot rooms, taller block under the big dome
  main.add(box(w, h, d - 11), T(x, 0, z + 5.5), C.terra);
  main.add(box(w + 0.4, 0.4, d - 11 + 0.4), T(x, h, z + 5.5), C.stone);
  main.add(box(11, bigH, 11), T(x, 0, bigZ), C.terra);
  main.add(box(11.4, 0.45, 11.4), T(x, bigH, bigZ), C.stoneWarm);

  // larger dome on an octagonal drum
  main.add(cyl(4.9, 4.9, 1.2, 8), T(x, bigH + 0.45, bigZ), C.stone);
  main.add(dome(4.6, 24, 8), T(x, bigH + 1.65, bigZ), C.lead);
  alem(fine, x, bigH + 6.15, bigZ, 0.8, true);

  // small domes over the hot rooms (2 × 3), each with a ring of glass eyes
  for (const sx of [-1, 1]) for (const k of [0, 1, 2]) {
    const dx = x + sx * 3.3, dz = z + 1.5 + k * 3.6;
    main.add(cyl(1.75, 1.75, 0.5, 10), T(dx, h + 0.4, dz), C.stone);
    main.add(dome(1.6, 14, 5), T(dx, h + 0.9, dz), C.lead);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      fine.add(new THREE.SphereGeometry(0.16, 5, 3), T(dx + Math.sin(a) * 0.8, h + 0.9 + 1.32, dz + Math.cos(a) * 0.8), C.gold);
    }
  }
  // one slightly larger dome at the back (halvet)
  main.add(cyl(2.3, 2.3, 0.5, 12), T(x, h + 0.4, z + d / 2 - 2.6), C.stone);
  main.add(dome(2.15, 16, 6), T(x, h + 0.9, z + d / 2 - 2.6), C.lead);

  // chimney of the furnace (külhan)
  main.add(box(1.2, 4.5, 1.2), T(x + w / 2 - 1.2, h, z + d / 2 - 1.2), C.terraDeep);

  // entrance: arched door with a gold inscription band, small windows along the sides
  for (const g of archGeos(2.2, 3.6, 0.25)) fine.add(g, T(x, 0, z0 - 0.1), C.dark);
  fine.add(box(4.2, 0.5, 0.1), T(x, 4.4, z0 - 0.08), C.gold);
  for (const s of [-1, 1]) for (const k of [-3, 3, 9]) {
    for (const g of archGeos(0.9, 1.6, 0.16)) fine.add(g, T(x + s * (w / 2 + 0.02), 2.2, z + k, s * Math.PI / 2), C.dark);
  }

  // a few trees around it
  roundTree(fine, x - 11, z - 8, 0.9, 1); roundTree(fine, x + 10, z + 13, 0.8);
  cypress(fine, x - 10, z + 6, 0.9, 1); cypress(fine, x - 9, z + 12, 0.8, 2);

  const group = new THREE.Group();
  const mainGeo = main.geometry(), fineGeo = fine.geometry();
  group.add(new THREE.Mesh(mainGeo, kit.toon), new THREE.Mesh(fineGeo, kit.toon), new THREE.Mesh(mainGeo, kit.hull));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(mainGeo, 30), kit.line));
  group.add(kit.blob(w * 1.9, d * 1.55, x, z));
  group.userData = { mainGeo, triangles: (mainGeo.attributes.position.count + fineGeo.attributes.position.count) / 3 };
  return group;
}
