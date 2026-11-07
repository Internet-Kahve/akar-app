import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { isAllUnlit } from "./light-materials";

test("only a file with nothing but unlit materials counts as unlit", () => {
  const root = new THREE.Group();
  assert.equal(isAllUnlit(root), false);
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
  assert.equal(isAllUnlit(root), true);
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  assert.equal(isAllUnlit(root), false);
});
