import type { Config } from "../../config.ts";
import type { ObjectStorage } from "../../platform/storage.ts";
import { createFsStorage } from "./storage-fs.ts";
import { createS3Storage } from "./storage-s3.ts";

/**
 * The server's object storage from `STORAGE_*`: null when `STORAGE_DRIVER` is unset (media endpoints
 * then answer 503), a misconfigured driver throws at startup. The filesystem driver signs its upload
 * links with `RECEIPT_SECRET` (domain-separated, so receipts and links cannot stand in for each other)
 * and points them at this server's own address.
 */
export function storageFromConfig(config: Config): ObjectStorage | null {
  const publicBaseUrl = config.STORAGE_PUBLIC_BASE_URL;
  switch (config.STORAGE_DRIVER) {
    case undefined:
      return null;
    case "s3": {
      const endpoint = config.STORAGE_S3_ENDPOINT;
      const region = config.STORAGE_S3_REGION;
      const accessKeyId = config.STORAGE_S3_ACCESS_KEY_ID;
      const secretAccessKey = config.STORAGE_S3_SECRET_ACCESS_KEY;
      if (!endpoint || !region || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
        throw new Error(
          "STORAGE_DRIVER=s3 needs STORAGE_S3_ENDPOINT, STORAGE_S3_REGION, STORAGE_S3_ACCESS_KEY_ID, STORAGE_S3_SECRET_ACCESS_KEY and STORAGE_PUBLIC_BASE_URL",
        );
      }
      return createS3Storage({ endpoint, region, accessKeyId, secretAccessKey, bucket: config.STORAGE_BUCKET, publicBaseUrl });
    }
    case "fs": {
      const root = config.STORAGE_FS_ROOT;
      const signingSecret = config.RECEIPT_SECRET;
      if (!root || !publicBaseUrl || !signingSecret) {
        throw new Error("STORAGE_DRIVER=fs needs STORAGE_FS_ROOT, STORAGE_PUBLIC_BASE_URL and RECEIPT_SECRET");
      }
      const host = config.HOST === "0.0.0.0" ? "127.0.0.1" : config.HOST;
      return createFsStorage({ root, publicBaseUrl, uploadBaseUrl: `http://${host}:${config.PORT}`, signingSecret });
    }
  }
}
