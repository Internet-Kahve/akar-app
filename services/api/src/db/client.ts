import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.ts";

export function createDb(url: string, max = 10) {
  const pool = new pg.Pool({ connectionString: url, max, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 5_000 });
  return { db: drizzle(pool, { schema }), pool };
}

export type Db = ReturnType<typeof createDb>["db"];
