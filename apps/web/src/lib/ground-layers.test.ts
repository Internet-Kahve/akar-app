import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { groundLayerRanks, liftGroundLayers } from "./ground-layers";

const material = new THREE.MeshStandardMaterial();
/** A flat square lying at height `y`. */
function plate(y: number, shared = material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), shared);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.updateMatrixWorld(true);
  return mesh;
}

test("ground surfaces a few millimetres apart are ranked by height; walls and high floors are not layers", () => {
  const disc = plate(0),
    courtyard = plate(0.004),
    grass = plate(0.009),
    sameAsCourtyard = plate(0.0042);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), material);
  wall.position.y = 1.5;
  wall.updateMatrixWorld(true);
  const gallery = plate(2);
  const ranks = groundLayerRanks([grass, wall, courtyard, disc, gallery, sameAsCourtyard]);
  assert.equal(ranks.get(disc), 0);
  assert.equal(ranks.get(courtyard), 1);
  assert.equal(ranks.get(sameAsCourtyard), 1);
  assert.equal(ranks.get(grass), 2);
  assert.equal(ranks.has(wall), false);
  assert.equal(ranks.has(gallery), false);
});

test("raised layers are pulled toward the camera on their own material copy; the lowest keeps its material", () => {
  const root = new THREE.Group();
  const disc = plate(0),
    courtyard = plate(0.004);
  root.add(disc, courtyard);
  liftGroundLayers(root);
  assert.equal(disc.material, material);
  assert.equal(material.polygonOffset, false);
  const lifted = courtyard.material as THREE.Material;
  assert.notEqual(lifted, material);
  assert.equal(lifted.polygonOffset, true);
  assert.equal(lifted.polygonOffsetFactor, -0.5);
  assert.equal(lifted.polygonOffsetUnits, -3);
});
