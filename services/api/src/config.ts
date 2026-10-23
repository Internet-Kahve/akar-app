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
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(10).default(2),
  DATABASE_SSL_CA: optionalText,
  JOB_SECRET: z.string().min(32).optional(),
  API_RUNTIME: z.enum(["server", "vercel"]).default("server"),
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

  /** Quota the panel health warning measures `media.bytes` against, MB (Supabase Free: 1 GB). Not required in production. */
  STORAGE_QUOTA_MB: z.coerce.number().int().positive().default(1024),

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

/**
 * In production every missing setting is an error at startup, not a quietly degraded server (401 for every
 * token, 503 media and receipts, files on the container disk, a web origin CORS never matches).
 * Development and tests may leave these out. S3 credentials are checked by `storageFromConfig` at startup.
 */
export function productionIssues(config: Config): string[] {
  const issues: string[] = [];
  if (config.API_RUNTIME === "vercel" && !config.JOB_SECRET) issues.push("JOB_SECRET is required for Supabase Cron");
  const required = [
    "AUTH_JWKS_URL",
    "AUTH_JWT_ISSUER",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STORAGE_PUBLIC_BASE_URL",
    "RECEIPT_SECRET",
  ] as const;
  for (const key of required) {
    if (config[key] === undefined) issues.push(`${key} is required`);
  }
  if (config.STORAGE_DRIVER !== "s3") issues.push("STORAGE_DRIVER must be s3 (the container disk is not kept across deploys)");
  if (config.CORS_ORIGINS.length === 0) issues.push("CORS_ORIGINS is required (the web app's origin)");
  for (const origin of config.CORS_ORIGINS) {
    if (!URL.canParse(origin) || new URL(origin).origin !== origin) {
      issues.push(`CORS_ORIGINS entry "${origin}" must be an exact origin such as https://akar.vercel.app (no path, no trailing slash, no *)`);
    }
  }
  return issues;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Env.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  const issues = parsed.data.NODE_ENV === "production" ? productionIssues(parsed.data) : [];
  if (issues.length > 0) {
    throw new Error(`Invalid production environment:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
  }
  return parsed.data;
}
