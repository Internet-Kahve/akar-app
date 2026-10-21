import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Stats } from "node:fs";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";
import type { ObjectStorage } from "../../platform/storage.ts";

export type FsStorageOptions = {
  /** Folder the objects live in; a key maps to a path below it. */
  root: string;
  /** Base of `publicUrl(key)`: whatever serves `root` over HTTP. */
  publicBaseUrl: string;
  /** Origin clients reach this API at; upload links are `<uploadBaseUrl>/v1/media/uploads/fs/<token>`. */
  uploadBaseUrl: string;
  /** HMAC key of the upload links. */
  signingSecret: string;
};

/** What an upload link allows: one object key, one content type, a size cap. */
export type UploadGrant = { key: string; contentType: string; maxBytes: number };

export type FsStorage = ObjectStorage & {
  /** Marks the driver: `mediaRoutes` serves `PUT /v1/media/uploads/fs/:token` only when storage is this one. */
  readonly kind: "fs";
  /** `invalid`: not signed by us or malformed. `expired`: genuine but past its deadline. */
  verifyUploadToken(token: string): { ok: true; grant: UploadGrant } | { ok: false; reason: "invalid" | "expired" };
};

export function isFsStorage(storage: ObjectStorage | null): storage is FsStorage {
  return storage !== null && "kind" in storage && storage.kind === "fs";
}

/** Domain separation: a signature made for another purpose with the same key is never a valid upload link. */
const SIGNING_DOMAIN = "media-fs-upload.v1";

/** Payload of an upload link: key, content type, size cap and expiry (Unix seconds). */
const Payload = z.object({ k: z.string().min(1), t: z.string().min(1), m: z.number().int().positive(), e: z.number().int() });

/** The content type is not part of the object's bytes, so it is kept in a sidecar file next to it. */
const META_SUFFIX = ".meta.json";
const Meta = z.object({ contentType: z.string().min(1) });

const isMissing = (err: unknown): boolean =>
  err instanceof Error && "code" in err && (err.code === "ENOENT" || err.code === "ENOTDIR");

/** Objects as files below `root`, for tests and offline use; uploads go through a signed API link, as with S3. */
export function createFsStorage(opts: FsStorageOptions): FsStorage {
  const rootDir = resolve(opts.root);
  const publicBase = opts.publicBaseUrl.replace(/\/+$/, "");
  const uploadBase = opts.uploadBaseUrl.replace(/\/+$/, "");
  const sign = (payload: string) => createHmac("sha256", opts.signingSecret).update(`${SIGNING_DOMAIN}.${payload}`).digest("base64url");

  /** Keys are bucket-relative paths; anything that could leave `root` is refused. */
  function pathOf(key: string): string {
    const segments = key.split("/");
    if (key.includes("\\") || key.includes("\0") || segments.some((s) => s === "" || s === "." || s === "..")) {
      throw new Error(`Invalid object key: ${key}`);
    }
    return join(rootDir, ...segments);
  }

  async function contentTypeOf(path: string): Promise<string> {
    try {
      const meta = Meta.safeParse(JSON.parse(await readFile(path + META_SUFFIX, "utf8")));
      if (meta.success) return meta.data.contentType;
    } catch (err) {
      if (!isMissing(err) && !(err instanceof SyntaxError)) throw err;
    }
    return "application/octet-stream";
  }

  return {
    kind: "fs",

    async createUploadUrl(key, { contentType, maxBytes, expiresInSec }) {
      const grant = { k: key, t: contentType, m: maxBytes, e: Math.floor(Date.now() / 1000 + expiresInSec) };
      const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");
      return {
        url: `${uploadBase}/v1/media/uploads/fs/${payload}.${sign(payload)}`,
        method: "PUT",
        headers: { "Content-Type": contentType },
      };
    },

    verifyUploadToken(token) {
      const [payload, signature, ...rest] = token.split(".");
      if (!payload || !signature || rest.length > 0) return { ok: false, reason: "invalid" };
      const given = Buffer.from(signature);
      const expected = Buffer.from(sign(payload));
      if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "invalid" };
      let grant: z.infer<typeof Payload>;
      try {
        grant = Payload.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
      } catch {
        return { ok: false, reason: "invalid" };
      }
      if (Date.now() >= grant.e * 1000) return { ok: false, reason: "expired" };
      return { ok: true, grant: { key: grant.k, contentType: grant.t, maxBytes: grant.m } };
    },

    async put(key, body, contentType) {
      const path = pathOf(key);
      await mkdir(dirname(path), { recursive: true });
      // Write beside the target and rename: `head` never sees a half-written object.
      const partial = `${path}.${randomUUID()}.tmp`;
      await writeFile(path + META_SUFFIX, JSON.stringify({ contentType }));
      await writeFile(partial, body);
      await rename(partial, path);
    },

    async head(key) {
      const path = pathOf(key);
      let info: Stats;
      try {
        info = await stat(path);
      } catch (err) {
        if (isMissing(err)) return null;
        throw err;
      }
      return info.isFile() ? { bytes: info.size, contentType: await contentTypeOf(path) } : null;
    },

    async read(key, range) {
      const path = pathOf(key);
      if (!range) return readFile(path);
      if (!(range.start >= 0 && range.end >= range.start)) throw new RangeError(`Invalid byte range ${range.start}-${range.end}`);
      const file = await open(path, "r");
      try {
        // Like S3: the range is inclusive and an end past the object is cut off.
        const length = Math.min(range.end + 1, (await file.stat()).size) - range.start;
        if (length <= 0) return Buffer.alloc(0);
        const out = Buffer.alloc(length);
        const { bytesRead } = await file.read(out, 0, length, range.start);
        return out.subarray(0, bytesRead);
      } finally {
        await file.close();
      }
    },

    publicUrl: (key) => `${publicBase}/${key}`,

    async delete(key) {
      const path = pathOf(key);
      await rm(path, { force: true });
      await rm(path + META_SUFFIX, { force: true });
    },
  };
}
