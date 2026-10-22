import { mediaKinds } from "../../db/schema/shared.ts";

export type MediaKind = (typeof mediaKinds)[number];

const MiB = 1024 * 1024;

/**
 * The one table that limits uploads: the size cap and the content types (with the extension of the
 * stored object) each media kind may carry. Types are checked again against the file's first bytes
 * on `complete` (`matchesMagic`), so a declared type is never taken on trust.
 */
export const MEDIA_LIMITS = {
  photo: { maxBytes: 5 * MiB, types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } },
  model: { maxBytes: 5 * MiB, types: { "model/gltf-binary": "glb" } },
  audio: { maxBytes: 5 * MiB, types: { "audio/mpeg": "mp3", "audio/mp4": "m4a" } },
} as const satisfies Record<MediaKind, { maxBytes: number; types: Record<string, string> }>;

/** Largest body any upload may carry; the filesystem driver's body limit. */
export const MAX_UPLOAD_BYTES = Math.max(...mediaKinds.map((k) => MEDIA_LIMITS[k].maxBytes));

/** Extension of the stored object for a declared type; undefined when the kind does not allow the type. */
export function extensionFor(kind: MediaKind, contentType: string): string | undefined {
  const types: Record<string, string> = MEDIA_LIMITS[kind].types;
  return Object.hasOwn(types, contentType) ? types[contentType] : undefined;
}

/** "5 MB" in user-facing messages. */
export const megabytes = (bytes: number): string => `${Math.round(bytes / MiB)} MB`;

/** A `Content-Type` value without parameters, lower-cased: `image/PNG; q=1` → `image/png`. */
export const mediaTypeOf = (contentType: string): string => (contentType.split(";")[0] ?? "").trim().toLowerCase();

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** MPEG audio frame header: 11 sync bits, then neither the reserved version (01) nor layer (00). */
function isMpegFrame(head: Buffer): boolean {
  const second = head[1];
  if (head[0] !== 0xff || second === undefined) return false;
  return (second & 0xe0) === 0xe0 && ((second >> 3) & 3) !== 1 && ((second >> 1) & 3) !== 0;
}

const SIGNATURES: Record<string, (head: Buffer) => boolean> = {
  "image/jpeg": (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
  "image/png": (h) => h.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE),
  "image/webp": (h) => h.toString("latin1", 0, 4) === "RIFF" && h.toString("latin1", 8, 12) === "WEBP",
  "model/gltf-binary": (h) => h.toString("latin1", 0, 4) === "glTF" && h.length >= 8 && h.readUInt32LE(4) === 2,
  "audio/mpeg": (h) => h.toString("latin1", 0, 3) === "ID3" || isMpegFrame(h),
  "audio/mp4": (h) => h.toString("latin1", 4, 8) === "ftyp",
};

/** Whether the file's first bytes are those of `contentType`; false for an unknown type. */
export function matchesMagic(contentType: string, head: Buffer): boolean {
  return Object.hasOwn(SIGNATURES, contentType) && SIGNATURES[contentType]!(head);
}
