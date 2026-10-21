import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .pipe(z.url().optional())
  .optional();
const optionalText = z
  .string()
  .trim()
  .transform((v) => v || undefined)
  .optional();

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  /**
   * Reverse proxies in front of the API (hop count). 0: none, the socket address is the client.
   * Never trust more hops than exist: the client writes the left-most X-Forwarded-For entry.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),

  // Supabase (local stack via `supabase start`, or the cloud project). See README "Yerel geliştirme".
  SUPABASE_URL: optionalUrl,
  /** Admin API (invites). Server-side only. */
  SUPABASE_SERVICE_ROLE_KEY: optionalText,
  /** JWKS of Supabase Auth; access tokens are verified against it. */
  AUTH_JWKS_URL: optionalUrl,
  AUTH_JWT_ISSUER: optionalText,
  AUTH_JWT_AUDIENCE: z.string().default("authenticated"),

  // Object storage: `s3` (Supabase Storage S3 protocol, local or cloud) or `fs` (folder; tests/offline).
  STORAGE_DRIVER: z.enum(["s3", "fs"]).optional(),
  STORAGE_FS_ROOT: optionalText,
  STORAGE_S3_ENDPOINT: optionalUrl,
  STORAGE_S3_REGION: optionalText,
  STORAGE_S3_ACCESS_KEY_ID: optionalText,
  STORAGE_S3_SECRET_ACCESS_KEY: optionalText,
  /** Public bucket: `complete` publishes checked media into it, and `STORAGE_PUBLIC_BASE_URL` serves it. */
  STORAGE_BUCKET: z.string().default("media"),
  /** Non-public bucket clients upload into; nothing is served from it, so it must not be `STORAGE_BUCKET`. */
  STORAGE_UPLOAD_BUCKET: z.string().default("uploads"),
  /** Public read base for stored objects (CDN or storage public URL), no trailing slash. */
  STORAGE_PUBLIC_BASE_URL: optionalUrl,

  // Import geocoding (`npm run ingest` and the panel import): public OSM services, cached in `.cache/`.
  NOMINATIM_URL: z.url().default("https://nominatim.openstreetmap.org"),
  /** Contact address sent to Nominatim (usage policy). */
  NOMINATIM_EMAIL: optionalText,
  OVERPASS_URL: z.url().default("https://overpass-api.de/api/interpreter"),

  /** HMAC key for guest receipts (≥ 32 bytes). */
  RECEIPT_SECRET: z
    .string()
    .trim()
    .transform((v) => v || undefined)
    .pipe(z.string().min(32, "RECEIPT_SECRET en az 32 karakter olmalı.").optional())
    .optional(),
  /** Visit check radius in metres (D4). */
  VISIT_RADIUS_M: z.coerce.number().positive().default(30),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Env.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
