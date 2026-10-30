import { z } from "zod";

/**
 * Part names of a binary glTF (GLB), read without a glTF library: the 12-byte header, then the first
 * chunk, which the spec requires to be the JSON chunk. Only that chunk is fetched (two ranged reads),
 * never the binary payload.
 */

/** The file cannot be read as a GLB; the model is marked `failed` instead of the job retrying. */
export class GlbError extends Error {}

const MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
/** File header (magic, version, length) plus the first chunk's length and type. */
const HEAD_BYTES = 20;

/**
 * Story highlights pick from this list and it travels in every site payload, so a scan with
 * thousands of generated mesh names keeps only the first ones.
 */
export const MAX_GLB_PARTS = 1000;

// Only names matter: a node or mesh that is not an object with a string name is simply unnamed.
const Named = z.array(z.object({ name: z.string().optional() }).catch({}));
const Gltf = z.object({ nodes: Named.optional(), meshes: Named.optional() });

export type RangeReader = (range: { start: number; end: number }) => Promise<Buffer>;

/** Inclusive byte range of the JSON chunk, from the first `HEAD_BYTES` of a file `fileBytes` long. */
function jsonChunkRange(head: Buffer, fileBytes: number): { start: number; end: number } {
  if (head.length < HEAD_BYTES) throw new GlbError("file is shorter than a GLB header");
  if (head.readUInt32LE(0) !== MAGIC) throw new GlbError("missing glTF magic");
  if (head.readUInt32LE(4) !== 2) throw new GlbError(`unsupported GLB version ${head.readUInt32LE(4)}`);
  if (head.readUInt32LE(8) > fileBytes) throw new GlbError("header length exceeds the file (truncated upload)");
  const length = head.readUInt32LE(12);
  if (head.readUInt32LE(16) !== CHUNK_JSON) throw new GlbError("first chunk is not JSON");
  if (length === 0 || HEAD_BYTES + length > fileBytes) throw new GlbError("JSON chunk is empty or runs past the file");
  return { start: HEAD_BYTES, end: HEAD_BYTES + length - 1 };
}

/** Distinct, non-blank node names then mesh names, in document order, capped at `MAX_GLB_PARTS`. */
export function partNames(gltf: unknown): string[] {
  const parsed = Gltf.safeParse(gltf);
  if (!parsed.success) throw new GlbError("JSON chunk is not a glTF document with node and mesh arrays");
  const names = new Set<string>();
  for (const item of [...(parsed.data.nodes ?? []), ...(parsed.data.meshes ?? [])]) {
    if (item.name !== undefined && item.name.trim() !== "") names.add(item.name);
  }
  return [...names].slice(0, MAX_GLB_PARTS);
}

/** The parsed JSON chunk of the GLB behind `read` (`fileBytes` long); throws `GlbError` when it is malformed. */
export async function readGlbJson(fileBytes: number, read: RangeReader): Promise<unknown> {
  const range = jsonChunkRange(await read({ start: 0, end: HEAD_BYTES - 1 }), fileBytes);
  const chunk = await read(range);
  if (chunk.length !== range.end - range.start + 1) throw new GlbError("JSON chunk is truncated");
  try {
    return JSON.parse(chunk.toString("utf8"));
  } catch {
    throw new GlbError("JSON chunk is not valid JSON");
  }
}

/** Part names of the GLB behind `read` (`fileBytes` long); throws `GlbError` when it is malformed. */
export async function readGlbParts(fileBytes: number, read: RangeReader): Promise<string[]> {
  return partNames(await readGlbJson(fileBytes, read));
}

/**
 * Largest triangle count `complete` accepts for a model: the heaviest model at hand (92,768) × 1.5
 * (docs/MAP-MODELS-PLAN.md).
 */
export const MAX_MODEL_TRIANGLES = 139_152;

const Index = z.number().int().nonnegative();
const TriangleGltf = z.object({
  accessors: z.array(z.object({ count: Index })).optional(),
  meshes: z
    .array(
      z.object({
        primitives: z.array(z.object({ attributes: z.object({ POSITION: Index.optional() }).optional(), indices: Index.optional(), mode: z.number().optional() })).default([]),
      }),
    )
    .optional(),
  nodes: z.array(z.object({ mesh: Index.optional(), children: z.array(Index).optional() })).optional(),
  scene: Index.optional(),
  scenes: z.array(z.object({ nodes: z.array(Index).optional() })).optional(),
});

const MODE_TRIANGLES = 4;
const MODE_STRIP = 5;
const MODE_FAN = 6;

/**
 * Triangles a GLB draws, from its JSON chunk alone (Draco-compressed files keep their counts there).
 * Every primitive of the mesh of every node reachable from the scene counts, once per use of the node
 * (a node reached twice is drawn twice). Without scenes every node counts once. Per primitive, N is the
 * `indices` count, else the `POSITION` count: `TRIANGLES` (mode 4 or none) gives ⌊N/3⌋, strips and fans
 * (5, 6) max(N − 2, 0), points and lines (0–3) none. An unknown mode, an unreadable accessor, a bad node
 * reference or a node cycle makes the file unreadable (`GlbError`).
 */
export function countTriangles(gltf: unknown): number {
  const parsed = TriangleGltf.safeParse(gltf);
  if (!parsed.success) throw new GlbError("JSON chunk is not a glTF document the triangle count can read");
  const { accessors = [], meshes = [], nodes = [], scene, scenes = [] } = parsed.data;

  const accessorCount = (index: number | undefined): number | undefined => (index === undefined ? undefined : accessors[index]?.count);
  const meshTriangles = meshes.map(({ primitives }) =>
    primitives.reduce((sum, { attributes, indices, mode = MODE_TRIANGLES }) => {
      if (!Number.isInteger(mode) || mode < 0 || mode > MODE_FAN) throw new GlbError(`unknown primitive mode ${mode}`);
      const n = indices !== undefined ? accessorCount(indices) : accessorCount(attributes?.POSITION);
      if (n === undefined) throw new GlbError("primitive has no readable indices or POSITION accessor");
      if (mode === MODE_TRIANGLES) return sum + Math.floor(n / 3);
      return mode >= MODE_STRIP ? sum + Math.max(n - 2, 0) : sum;
    }, 0),
  );
  const own = (node: number): number => {
    const mesh = nodes[node]?.mesh;
    if (mesh === undefined) return 0;
    const triangles = meshTriangles[mesh];
    if (triangles === undefined) throw new GlbError(`node ${node} uses mesh ${mesh}, which does not exist`);
    return triangles;
  };

  if (!scenes.length) return nodes.reduce((sum, _node, i) => sum + own(i), 0);

  // A node's subtree total is computed once however often it is reached, iteratively: a file of 5 MB can hold
  // a chain of a hundred thousand nodes and a ladder of shared children that would blow up a plain walk.
  const subtree = new Map<number, number>();
  const open = new Set<number>();
  const total = (root: number): number => {
    const stack = [root];
    while (stack.length) {
      const node = stack[stack.length - 1]!;
      if (subtree.has(node)) {
        stack.pop();
        continue;
      }
      const entry = nodes[node];
      if (!entry) throw new GlbError(`node ${node} does not exist`);
      const pending = (entry.children ?? []).filter((c) => !subtree.has(c));
      if (!open.has(node)) {
        open.add(node);
      } else if (!pending.length) {
        subtree.set(node, (entry.children ?? []).reduce((sum, c) => sum + subtree.get(c)!, own(node)));
        open.delete(node);
        stack.pop();
        continue;
      } else {
        // Back on this node and a child is still unfinished: that child is on the path above, a cycle.
        throw new GlbError("node graph has a cycle");
      }
      for (const child of pending) {
        if (open.has(child)) throw new GlbError("node graph has a cycle");
        if (!nodes[child]) throw new GlbError(`node ${child} does not exist`);
        stack.push(child);
      }
    }
    return subtree.get(root)!;
  };

  let roots: number[];
  if (scene !== undefined) {
    const chosen = scenes[scene];
    if (!chosen) throw new GlbError(`default scene ${scene} does not exist`);
    roots = chosen.nodes ?? [];
  } else {
    roots = scenes.flatMap((s) => s.nodes ?? []);
  }
  // A root listed twice (or reachable as a child too) is drawn twice.
  return roots.reduce((sum, root) => sum + total(root), 0);
}
