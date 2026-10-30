import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createDb } from "./db/client.ts";

// Builds the app without touching the database and writes the spec shared with frontend/mobile.
const config = loadConfig({ ...process.env, NODE_ENV: "test", DATABASE_URL: "postgres://unused@127.0.0.1/unused" });
const { db, pool } = createDb(config.DATABASE_URL);
const app = await buildApp({ config, db, auth: null, storage: null, jobs: null, geocoderFor: null, tts: null, translator: null }, { docs: false });
const out = fileURLToPath(new URL("../../../docs/api/openapi.json", import.meta.url));
await mkdir(fileURLToPath(new URL(".", `file://${out}`)), { recursive: true });
await writeFile(out, JSON.stringify(app.swagger(), null, 2) + "\n");
await app.close();
await pool.end();
console.log(`wrote ${out}`);
