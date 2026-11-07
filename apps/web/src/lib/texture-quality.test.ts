import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { smoothedSampling, smoothTextures } from "./texture-quality";

test("a nearest-filtered texture becomes smooth with anisotropy; one already right is left alone", () => {
  const hard = new THREE.Texture();
  hard.magFilter = THREE.NearestFilter;
  hard.minFilter = THREE.NearestMipmapNearestFilter;
  assert.deepEqual(smoothedSampling(hard, 8), { magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapLinearFilter, anisotropy: 8 });
  const right = new THREE.Texture();
  right.anisotropy = 8;
  assert.equal(smoothedSampling(right, 8), null);
});

test("every texture of a model is upgraded, shared ones once, and never past the GPU's limit", () => {
  const map = new THREE.Texture();
  map.magFilter = THREE.NearestFilter;
  const root = new THREE.Group();
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ map })));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), [new THREE.MeshStandardMaterial({ map })]));
  const before = map.version;
  smoothTextures(root, 8, 4);
  assert.equal(map.magFilter, THREE.LinearFilter);
  assert.equal(map.anisotropy, 4);
  assert.equal(map.version, before + 1);
});
