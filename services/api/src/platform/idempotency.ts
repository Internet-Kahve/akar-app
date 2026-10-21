import { and, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { Db } from "../db/client.ts";
import { idempotencyKeys } from "../db/schema/index.ts";
import { AppError } from "../errors.ts";

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type MutationResult<T> = { status: number; body: T };

/** `Idempotency-Key` header value, validated; undefined when absent. */
export function idempotencyKeyOf(req: FastifyRequest): string | undefined {
  const raw = req.headers["idempotency-key"];
  if (raw === undefined) return undefined;
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (!key || key.length > 200 || !/^[\x21-\x7e]+$/.test(key)) {
    throw new AppError(400, "VALIDATION_FAILED", "Idempotency-Key geçersiz.", {
      "idempotency-key": ["1–200 yazdırılabilir ASCII karakter olmalı."],
    });
  }
  return key;
}

/**
 * Runs a mutation once per (actor, Idempotency-Key). The handler gets the transaction that also
 * records the key, so the write and its replay record commit together. A retry with the same key
 * and body replays the stored response; the same key with a different request is 422.
 * Without a key the handler simply runs in a transaction. Responses ≥ 500 are never stored.
 */
export async function idempotent<T>(
  db: Db,
  req: FastifyRequest,
  actorId: string,
  run: (tx: Tx) => Promise<MutationResult<T>>,
): Promise<MutationResult<T>> {
  const key = idempotencyKeyOf(req);
  if (!key) return db.transaction(run);

  const requestHash = createHash("sha256")
    .update(`${req.method} ${req.url}\n${JSON.stringify(req.body ?? null)}`)
    .digest("base64url");

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`idem:${actorId}:${key}`}))`);
    const [prior] = await tx
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.actorId, actorId), eq(idempotencyKeys.key, key)));
    if (prior) {
      if (prior.requestHash !== requestHash) {
        throw new AppError(422, "IDEMPOTENCY_KEY_REUSED", "Bu Idempotency-Key farklı bir istek için kullanılmış.");
      }
      return { status: prior.statusCode, body: prior.responseBody as T };
    }
    const result = await run(tx);
    if (result.status < 500) {
      await tx.insert(idempotencyKeys).values({ actorId, key, requestHash, statusCode: result.status, responseBody: result.body ?? null });
    }
    return result;
  });
}
