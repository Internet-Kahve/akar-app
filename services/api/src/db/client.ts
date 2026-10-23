import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.ts";

export function createDb(url: string, max = 10, ca = process.env.DATABASE_SSL_CA) {
  // pg's URL SSL parameters override an explicit SSL object. With a supplied CA, always verify
  // both chain and hostname using that CA, including when the dashboard URL says sslmode=require.
  const connection = new URL(url);
  if (ca) for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) connection.searchParams.delete(key);
  const pool = new pg.Pool({
    connectionString: connection.toString(), max, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 5_000,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
  });
  return { db: drizzle(pool, { schema }), pool };
}

export type Db = ReturnType<typeof createDb>["db"];
