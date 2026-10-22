import assert from "node:assert/strict";
import { test } from "node:test";
import { loadConfig } from "./config.ts";

const production = {
  NODE_ENV: "production",
  DATABASE_URL: "postgres://akar:secret@db.example.com:5432/postgres",
  CORS_ORIGINS: "https://akar.vercel.app",
  SUPABASE_URL: "https://ref.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  AUTH_JWKS_URL: "https://ref.supabase.co/auth/v1/.well-known/jwks.json",
  AUTH_JWT_ISSUER: "https://ref.supabase.co/auth/v1",
  STORAGE_DRIVER: "s3",
  STORAGE_PUBLIC_BASE_URL: "https://ref.supabase.co/storage/v1/object/public/media",
  RECEIPT_SECRET: "0123456789abcdef0123456789abcdef",
};

test("a complete production environment loads", () => {
  assert.equal(loadConfig(production).NODE_ENV, "production");
});

test("production refuses to start without auth, storage, receipts or a web origin, naming every gap", () => {
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production", DATABASE_URL: production.DATABASE_URL, STORAGE_DRIVER: "fs" };
  assert.throws(
    () => loadConfig(env),
    (err: Error) => {
      for (const key of ["AUTH_JWKS_URL", "AUTH_JWT_ISSUER", "SUPABASE_SERVICE_ROLE_KEY", "STORAGE_PUBLIC_BASE_URL", "RECEIPT_SECRET", "STORAGE_DRIVER", "CORS_ORIGINS"]) {
        assert.match(err.message, new RegExp(key));
      }
      return true;
    },
  );
  // Development keeps starting with the same gaps (endpoints answer 401/503 instead).
  assert.doesNotThrow(() => loadConfig({ ...env, NODE_ENV: "development" }));
});

test("production rejects CORS entries the browser's Origin header can never equal", () => {
  for (const origin of ["https://akar.vercel.app/", "*", "akar.vercel.app", "https://akar.vercel.app/app"]) {
    assert.throws(() => loadConfig({ ...production, CORS_ORIGINS: `https://ok.example,${origin}` }), /CORS_ORIGINS entry/, origin);
  }
});
