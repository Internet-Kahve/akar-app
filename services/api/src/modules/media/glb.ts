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

/** Part names of the GLB behind `read` (`fileBytes` long); throws `GlbError` when it is malformed. */
export async function readGlbParts(fileBytes: number, read: RangeReader): Promise<string[]> {
  const range = jsonChunkRange(await read({ start: 0, end: HEAD_BYTES - 1 }), fileBytes);
  const chunk = await read(range);
  if (chunk.length !== range.end - range.start + 1) throw new GlbError("JSON chunk is truncated");
  let gltf: unknown;
  try {
    gltf = JSON.parse(chunk.toString("utf8"));
  } catch {
    throw new GlbError("JSON chunk is not valid JSON");
  }
  return partNames(gltf);
}
