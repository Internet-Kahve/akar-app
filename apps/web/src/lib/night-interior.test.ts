import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { interiorGain, warmNightInterior } from "./night-interior";

test("a dark bake is raised, a bright one is left, and the rise has a limit", () => {
  assert.equal(interiorGain([]), 1);
  assert.equal(interiorGain([0.7, 0.8, 0.9]), 1);
  assert.ok(Math.abs(interiorGain(Array(10).fill(0.1)) - 4) < 1e-9);
  assert.equal(interiorGain(Array(10).fill(0.001)), 14);
});

test("only unlit interior parts change; the bake's dark corners stay darker than its bright parts", () => {
  const geometry = (values: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(values), 3));
    return g;
  };
  const inside = new THREE.Mesh(geometry([0.1, 0.1, 0.1, 0.02, 0.02, 0.02]), new THREE.MeshBasicMaterial());
  inside.name = "Ic";
  const outside = new THREE.Mesh(geometry([0.1, 0.1, 0.1]), new THREE.MeshBasicMaterial());
  outside.name = "Dis";
  const lit = new THREE.Mesh(geometry([0.1, 0.1, 0.1]), new THREE.MeshStandardMaterial());
  lit.name = "Isikli";
  const root = new THREE.Group();
  root.add(inside, outside, lit);
  assert.ok(warmNightInterior(root, ["Ic", "Isikli", "Yok"]) > 1);
  const color = inside.geometry.attributes.color!;
  assert.ok(color.getX(0) > 0.3);
  assert.ok(color.getX(1) < color.getX(0));
  assert.ok(color.getZ(0) < color.getX(0));
  assert.ok(Math.abs(outside.geometry.attributes.color!.getX(0) - 0.1) < 1e-6);
  assert.ok(Math.abs(lit.geometry.attributes.color!.getX(0) - 0.1) < 1e-6);
});
