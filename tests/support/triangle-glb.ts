/** A one-triangle GLB whose only node is called `partName`: enough for the viewer to load, name and hit a part. */
export function triangleGlb(partName?: string) {
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
  const data = Buffer.alloc(positions.length * 4);
  positions.forEach((v, i) => data.writeFloatLE(v, i * 4));
  const doc = JSON.stringify({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: partName }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true }],
    buffers: [{ byteLength: data.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: data.length }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
  });
  const json = Buffer.from(doc.padEnd(Math.ceil(doc.length / 4) * 4, " "));
  const result = Buffer.alloc(28 + json.length + data.length);
  result.writeUInt32LE(0x46546c67, 0);
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(json.length, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  json.copy(result, 20);
  result.writeUInt32LE(data.length, 20 + json.length);
  result.writeUInt32LE(0x004e4942, 24 + json.length);
  data.copy(result, 28 + json.length);
  return result;
}
