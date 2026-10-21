import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectStorage } from "../../platform/storage.ts";

export type S3StorageOptions = {
  /** S3 API endpoint, e.g. Supabase Storage `http://127.0.0.1:54321/storage/v1/s3`. */
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public read base the bucket's objects are served from; `publicUrl(key)` is `<publicBaseUrl>/<key>`. */
  publicBaseUrl: string;
};

/** A 404 from S3: HEAD answers `NotFound`, GET and DELETE `NoSuchKey`. */
const isNotFound = (err: unknown): boolean =>
  err instanceof S3ServiceException && (err.name === "NotFound" || err.name === "NoSuchKey" || err.$metadata.httpStatusCode === 404);

/** S3 protocol storage (Supabase Storage, local or cloud). Uploads go straight to the bucket via presigned PUT. */
export function createS3Storage(opts: S3StorageOptions): ObjectStorage {
  const client = new S3Client({
    endpoint: opts.endpoint,
    region: opts.region,
    forcePathStyle: true,
    credentials: { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey },
    // Newer SDKs add CRC32 checksum parameters to every request; S3-compatible servers other than AWS reject them.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const Bucket = opts.bucket;
  const publicBase = opts.publicBaseUrl.replace(/\/+$/, "");

  return {
    // `maxBytes` is not enforceable on a presigned PUT, and the link stays writable until it expires; `complete`
    // re-checks the stored bytes and publishes a copy under another key.
    async createUploadUrl(key, { contentType, expiresInSec }) {
      const url = await getSignedUrl(client, new PutObjectCommand({ Bucket, Key: key, ContentType: contentType }), {
        expiresIn: expiresInSec,
        // The presigner leaves Content-Type unsigned by default; signing it pins the object to the declared type.
        signableHeaders: new Set(["content-type"]),
      });
      return { url, method: "PUT", headers: { "Content-Type": contentType } };
    },

    async put(key, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
    },

    async head(key) {
      try {
        const res = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
        return { bytes: res.ContentLength ?? 0, contentType: res.ContentType ?? "application/octet-stream" };
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },

    async read(key, range) {
      const res = await client.send(
        new GetObjectCommand({ Bucket, Key: key, ...(range && { Range: `bytes=${range.start}-${range.end}` }) }),
      );
      if (!res.Body) throw new Error(`Object ${key} came back without a body`);
      return Buffer.from(await res.Body.transformToByteArray());
    },

    publicUrl: (key) => `${publicBase}/${key}`,

    /** Idempotent: a missing object is no error, since most abandoned uploads never received a file. */
    async delete(key) {
      try {
        await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
      } catch (err) {
        if (!isNotFound(err)) throw err;
      }
    },
  };
}
