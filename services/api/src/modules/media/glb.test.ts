import assert from "node:assert/strict";
import { test } from "node:test";
import { countTriangles, GlbError, MAX_MODEL_TRIANGLES, readGlbJson } from "./glb.ts";

/** One mesh with one primitive over an accessor of `count` elements, drawn by the scene's only node. */
const model = (primitive: Record<string, unknown>, count: number, extra: Record<string, unknown> = {}) => ({
  accessors: [{ count }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, ...primitive }] }],
  nodes: [{ mesh: 0 }],
  scenes: [{ nodes: [0] }],
  scene: 0,
  ...extra,
});

test("the limit is 1.5 times the heaviest model at hand", () => {
  assert.equal(MAX_MODEL_TRIANGLES, 139_152);
  assert.equal(MAX_MODEL_TRIANGLES, 92_768 * 1.5);
});

test("TRIANGLES (mode 4 or none) count N / 3 rounded down, at and one over the limit", () => {
  for (const mode of [{}, { mode: 4 }]) {
    assert.equal(countTriangles(model(mode, MAX_MODEL_TRIANGLES * 3)), MAX_MODEL_TRIANGLES);
    assert.equal(countTriangles(model(mode, MAX_MODEL_TRIANGLES * 3 + 3)), MAX_MODEL_TRIANGLES + 1);
    assert.equal(countTriangles(model(mode, 10)), 3, "stray vertices do not make a triangle");
    assert.equal(countTriangles(model(mode, 2)), 0);
  }
});

test("TRIANGLE_STRIP and TRIANGLE_FAN count N − 2, at and one over the limit", () => {
  for (const mode of [5, 6]) {
    assert.equal(countTriangles(model({ mode }, MAX_MODEL_TRIANGLES + 2)), MAX_MODEL_TRIANGLES);
    assert.equal(countTriangles(model({ mode }, MAX_MODEL_TRIANGLES + 3)), MAX_MODEL_TRIANGLES + 1);
    assert.equal(countTriangles(model({ mode }, 3)), 1);
    assert.equal(countTriangles(model({ mode }, 2)), 0);
    assert.equal(countTriangles(model({ mode }, 0)), 0, "never negative");
  }
});

test("points and lines (modes 0–3) are no triangles however many elements they have", () => {
  for (const mode of [0, 1, 2, 3]) assert.equal(countTriangles(model({ mode }, 1_000_000)), 0);
});

test("indices count instead of POSITION when present; a non-indexed primitive counts its POSITION accessor", () => {
  const indexed = {
    accessors: [{ count: 99 }, { count: 30 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
  };
  assert.equal(countTriangles(indexed), 10);
  assert.equal(countTriangles(model({}, 99)), 33);
});

test("every primitive of a mesh counts, and a node reached twice counts twice", () => {
  const gltf = {
    accessors: [{ count: 30 }, { count: 60 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }, { attributes: { POSITION: 1 }, mode: 4 }] }],
    nodes: [{ children: [1, 2, 1] }, { mesh: 0 }, { children: [1] }],
    scenes: [{ nodes: [0] }],
  };
  // Mesh = 10 + 20; node 1 is drawn as a child of the root (twice) and under node 2: three times.
  assert.equal(countTriangles(gltf), 90);
  // A scene that lists the same node twice draws it twice.
  assert.equal(countTriangles({ ...gltf, scenes: [{ nodes: [1, 1] }] }), 60);
});

test("only the default scene counts when there is one, all scenes when there is none, and all nodes when there are no scenes", () => {
  const gltf = {
    accessors: [{ count: 30 }, { count: 90 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }, { primitives: [{ attributes: { POSITION: 1 } }] }],
    nodes: [{ mesh: 0 }, { mesh: 1 }, { mesh: 0, children: [0] }],
    scenes: [{ nodes: [0] }, { nodes: [1] }],
  };
  assert.equal(countTriangles({ ...gltf, scene: 1 }), 30);
  assert.equal(countTriangles(gltf), 10 + 30);
  const { scenes: _scenes, ...noScenes } = gltf;
  assert.equal(countTriangles(noScenes), 10 + 30 + 10, "each node once, children not counted again through their parent");
  assert.equal(countTriangles({ ...gltf, scenes: [{}] }), 0, "an empty scene draws nothing");
  assert.equal(countTriangles({}), 0);
  assert.equal(countTriangles({ ...gltf, meshes: [{}, {}] }), 0, "a mesh without primitives draws nothing");
});

test("a deep chain of nodes and a ladder of shared children are counted without recursion blowing up", () => {
  const depth = 200_000;
  const chain = {
    accessors: [{ count: 3 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: Array.from({ length: depth }, (_, i) => ({ ...(i === depth - 1 ? { mesh: 0 } : {}), ...(i < depth - 1 ? { children: [i + 1] } : {}) })),
    scenes: [{ nodes: [0] }],
  };
  assert.equal(countTriangles(chain), 1);

  // Each node has the next one twice: 2^60 draws of the last node, summed in linear time.
  const ladder = { ...chain, nodes: Array.from({ length: 60 }, (_, i) => (i === 59 ? { mesh: 0 } : { children: [i + 1, i + 1] })) };
  assert.equal(countTriangles(ladder), 2 ** 59);
});

test("an unknown mode, a missing or out-of-range accessor and broken references are GlbError", () => {
  const bad: [string, unknown][] = [
    ["mode 7", model({ mode: 7 }, 9)],
    ["mode -1", model({ mode: -1 }, 9)],
    ["mode 4.5", model({ mode: 4.5 }, 9)],
    ["mode as text", model({ mode: "4" }, 9)],
    ["no POSITION", { ...model({}, 9), meshes: [{ primitives: [{ attributes: {} }] }] }],
    ["no attributes", { ...model({}, 9), meshes: [{ primitives: [{}] }] }],
    ["POSITION out of range", model({ attributes: { POSITION: 5 } }, 9)],
    ["indices out of range", model({ indices: 5 }, 9)],
    ["accessor without count", { ...model({}, 9), accessors: [{}] }],
    ["mesh out of range", { ...model({}, 9), nodes: [{ mesh: 3 }] }],
    ["child out of range", { ...model({}, 9), nodes: [{ mesh: 0, children: [4] }] }],
    ["scene node out of range", { ...model({}, 9), scenes: [{ nodes: [9] }] }],
    ["default scene out of range", model({}, 9, { scene: 3 })],
    ["not an object", [1, 2]],
    ["null", null],
  ];
  for (const [name, gltf] of bad) assert.throws(() => countTriangles(gltf), GlbError, name);
  // Primitives of a point cloud are checked too: a missing accessor is not excused by mode 0.
  assert.throws(() => countTriangles(model({ mode: 0, attributes: {} }, 9)), GlbError);
});

test("a cycle in the node graph is a GlbError, not a hang", () => {
  const cyclic = (nodes: object[]) => ({ ...model({}, 9), nodes, scenes: [{ nodes: [0] }] });
  assert.throws(() => countTriangles(cyclic([{ children: [0] }])), GlbError, "self loop");
  assert.throws(() => countTriangles(cyclic([{ children: [1] }, { children: [2] }, { children: [0] }])), GlbError, "loop of three");
  assert.throws(() => countTriangles(cyclic([{ children: [1] }, { children: [2, 1] }, { mesh: 0, children: [1] }])), GlbError, "loop below the root");
  // The same node under two parents is a diamond, not a cycle.
  assert.equal(countTriangles(cyclic([{ children: [1, 2] }, { children: [3] }, { children: [3] }, { mesh: 0 }])), 6);
});

test("the JSON chunk of a GLB is read once from the byte ranges asked for", async () => {
  const json = Buffer.from(JSON.stringify(model({}, 12)));
  const padded = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const header = Buffer.alloc(20);
  header.write("glTF", 0, "latin1");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + padded.length, 8);
  header.writeUInt32LE(padded.length, 12);
  header.write("JSON", 16, "latin1");
  const file = Buffer.concat([header, padded]);
  let reads = 0;
  const gltf = await readGlbJson(file.length, async ({ start, end }) => {
    reads++;
    return file.subarray(start, end + 1);
  });
  assert.equal(reads, 2);
  assert.equal(countTriangles(gltf), 4);
  await assert.rejects(readGlbJson(file.length, async () => Buffer.from("nope")), GlbError);
});
