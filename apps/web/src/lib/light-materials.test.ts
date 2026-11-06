import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { isAllUnlit, lambertFrom, lambertWanted, useLambert } from "./light-materials";

test("Lambert keeps a material's textures and settings and a metal's lower diffuse", () => {
  const map = new THREE.Texture();
  const source = new THREE.MeshStandardMaterial({ map, color: 0xffffff, metalness: 0.5, transparent: true, opacity: 0.4, side: THREE.DoubleSide, alphaTest: 0.2 });
  const copy = lambertFrom(source);
  assert.equal(copy.map, map);
  assert.ok(Math.abs(copy.color.r - 0.5) < 1e-6);
  assert.equal(copy.transparent, true);
  assert.equal(copy.opacity, 0.4);
  assert.equal(copy.side, THREE.DoubleSide);
  assert.equal(copy.alphaTest, 0.2);
});

test("a shared material stays shared, a basic one is left alone", () => {
  const shared = new THREE.MeshStandardMaterial();
  const basic = new THREE.MeshBasicMaterial();
  const a = new THREE.Mesh(new THREE.BoxGeometry(), shared);
  const b = new THREE.Mesh(new THREE.BoxGeometry(), [shared, basic]);
  const root = new THREE.Group();
  root.add(a, b);
  useLambert(root);
  assert.ok(a.material instanceof THREE.MeshLambertMaterial);
  assert.equal((b.material as THREE.Material[])[0], a.material);
  assert.equal((b.material as THREE.Material[])[1], basic);
});

test("only a file with nothing but unlit materials counts as unlit; the switch is read from the address", () => {
  const root = new THREE.Group();
  assert.equal(isAllUnlit(root), false);
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
  assert.equal(isAllUnlit(root), true);
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
  assert.equal(isAllUnlit(root), false);
  assert.equal(lambertWanted("?akar-malzeme=lambert", ""), true);
  assert.equal(lambertWanted("", "#view=detail&akar-malzeme=lambert"), true);
  assert.equal(lambertWanted("", "#view=detail"), false);
});
