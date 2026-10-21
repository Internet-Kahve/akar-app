/**
 * Object storage used for media. Implementations live in the media module: S3 protocol (Supabase
 * Storage, local stack or cloud) and a filesystem driver for tests/offline. Keys are bucket-relative
 * paths such as `photos/2026/10/<uuid>.webp`.
 */
export interface ObjectStorage {
  /** Short-lived URL the client PUTs the file to; the API never proxies large uploads in production. */
  createUploadUrl(
    key: string,
    opts: { contentType: string; maxBytes: number; expiresInSec: number },
  ): Promise<{ url: string; method: "PUT"; headers: Record<string, string> }>;
  /** Writes an object directly (derivatives, filesystem-driver uploads). */
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Null when the object does not exist. */
  head(key: string): Promise<{ bytes: number; contentType: string } | null>;
  /** Whole object, or an inclusive byte range (used for magic-byte checks). */
  read(key: string, range?: { start: number; end: number }): Promise<Buffer>;
  /** Public read URL (CDN/storage public base + key). */
  publicUrl(key: string): string;
  delete(key: string): Promise<void>;
}

/**
 * The two buckets of the media flow. Clients write only to `uploads`, which is not public and serves nothing
 * (its `publicUrl` throws); once `complete` has checked an object, the server writes its bytes to `media`, the
 * public bucket every served URL points into.
 */
export type StorageBuckets = { uploads: ObjectStorage; media: ObjectStorage };
