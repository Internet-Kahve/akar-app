import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { isOverlayMaterial, liftOverlays } from "./overlay-layers";

test("the models' surface decorations are recognised by their material names", () => {
  for (const name of ["Kemer_Cizgi", "Kemer_Bant", "Ic_Hali_Sinir", "Tarh_Bordur", "Kursun_Dikis", "Serit_Derz", "Levha_Hat", "Bant_koyu"])
    assert.ok(isOverlayMaterial(name), name);
  for (const name of ["Ic_Duvar", "Kubbe.001", "Mermer", "Cati", undefined]) assert.ok(!isOverlayMaterial(name), String(name));
});

test("a decoration is drawn a hair in front once, shared materials once; a ground layer keeps its own offset", () => {
  const band = new THREE.MeshStandardMaterial({ name: "Kemer_Bant" });
  const wall = new THREE.MeshStandardMaterial({ name: "Ic_Duvar" });
  const ground = new THREE.MeshStandardMaterial({ name: "Ic_Hali_Sinir", polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -9 });
  const root = new THREE.Group();
  const g = new THREE.BoxGeometry();
  root.add(new THREE.Mesh(g, band), new THREE.Mesh(g, band), new THREE.Mesh(g, wall), new THREE.Mesh(g, ground));
  assert.equal(liftOverlays(root), 2);
  assert.equal(band.polygonOffset, true);
  assert.ok(band.polygonOffsetFactor < 0 && band.polygonOffsetUnits < 0);
  assert.equal(wall.polygonOffset, false);
  assert.equal(ground.polygonOffsetUnits, -9);
});
