import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { mergeByMaterial } from "./model-merge";

test("meshes sharing a material become one draw call, each where it stood", () => {
  const stone = new THREE.MeshStandardMaterial(), lead = new THREE.MeshStandardMaterial();
  const root = new THREE.Group();
  const part = new THREE.Group();
  part.name = "Govde";
  part.position.set(10, 0, 0);
  root.add(part);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), stone);
    m.position.set(0, i * 2, 0);
    part.add(m);
  }
  root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lead));
  const box = new THREE.Box3().setFromObject(root);
  const result = mergeByMaterial(root);
  assert.deepEqual(result, { before: 4, after: 2 });
  let meshes = 0;
  root.traverse((n) => { if (n instanceof THREE.Mesh) meshes++; });
  assert.equal(meshes, 2);
  // Same place in the model: the bounding box does not move.
  const after = new THREE.Box3().setFromObject(root);
  assert.ok(after.min.distanceTo(box.min) < 1e-6 && after.max.distanceTo(box.max) < 1e-6);
});

test("a mesh with several materials, or with other attributes, is left alone", () => {
  const stone = new THREE.MeshStandardMaterial();
  const root = new THREE.Group();
  const plain = new THREE.BoxGeometry(1, 1, 1);
  const noUv = new THREE.BoxGeometry(1, 1, 1);
  noUv.deleteAttribute("uv");
  root.add(new THREE.Mesh(plain, stone), new THREE.Mesh(noUv, stone), new THREE.Mesh(new THREE.BoxGeometry(), [stone, stone]));
  assert.deepEqual(mergeByMaterial(root), { before: 3, after: 3 });
});
