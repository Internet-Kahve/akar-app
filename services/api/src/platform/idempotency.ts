import { and, eq, lt, sql } from "drizzle-orm";
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
 * How long a stored response can be replayed. Clients retry within minutes; past this the key is forgotten, which
 * also drops the personal data stored responses carry (a deleted memory's text must not live on here, KVKK).
 */
export const IDEMPOTENCY_TTL_HOURS = 24;

/** Deletes replay records older than `IDEMPOTENCY_TTL_HOURS` (`server.ts`, every 15 minutes); returns how many. */
export async function purgeIdempotencyKeys(db: Db, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - IDEMPOTENCY_TTL_HOURS * 3_600_000);
  const gone = await db.delete(idempotencyKeys).where(lt(idempotencyKeys.createdAt, cutoff)).returning({ key: idempotencyKeys.key });
  return gone.length;
}

/** Drops every replay record of one actor (account erasure: stored responses can carry their personal data). */
export async function forgetIdempotencyKeys(tx: Tx, actorId: string): Promise<void> {
  await tx.delete(idempotencyKeys).where(eq(idempotencyKeys.actorId, actorId));
}

/**
 * Runs a mutation once per (actor, Idempotency-Key). The handler gets the transaction that also
 * records the key, so the write and its replay record commit together. A retry with the same key
 * and body replays the stored response; the same key with a different request is 422.
 * Without a key the handler simply runs in a transaction. Responses ≥ 500 are never stored. Records live
 * `IDEMPOTENCY_TTL_HOURS` (see `purgeIdempotencyKeys`).
 */
export async function idempotent<T>(
  db: Db,
  req: FastifyRequest,
  actorId: string,
  run: (tx: Tx) => Promise<MutationResult<T>>,
): Promise<MutationResult<T>> {
  const key = idempotencyKeyOf(req);
  if (!key) return db.transaction(run);

  const requestHash = requestHashOf(req);

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
      // A bodiless answer (204) is stored as JSON `null`: the column is NOT NULL, and a JS null would be SQL NULL.
      const responseBody = result.body === undefined || result.body === null ? sql`'null'::jsonb` : result.body;
      await tx.insert(idempotencyKeys).values({ actorId, key, requestHash, statusCode: result.status, responseBody });
    }
    return result;
  });
}

function requestHashOf(req: FastifyRequest): string {
  return createHash("sha256")
    .update(`${req.method} ${req.url}\n${JSON.stringify(req.body ?? null)}`)
    .digest("base64url");
}

/**
 * Like `idempotent`, for a handler that must not hold a transaction while it waits on another service (voice-over
 * generation): the stored response is looked up first and written after `run`, in separate statements. Two
 * concurrent calls with one key may both run, so `run` has to be safe to repeat; a later retry still replays the
 * first stored answer (`onConflictDoNothing`).
 */
export async function idempotentUnlocked<T>(
  db: Db,
  req: FastifyRequest,
  actorId: string,
  run: () => Promise<MutationResult<T>>,
): Promise<MutationResult<T>> {
  const key = idempotencyKeyOf(req);
  if (!key) return run();

  const requestHash = requestHashOf(req);
  const [prior] = await db
    .select()
    .from(idempotencyKeys)
    .where(and(eq(idempotencyKeys.actorId, actorId), eq(idempotencyKeys.key, key)));
  if (prior) {
    if (prior.requestHash !== requestHash) {
      throw new AppError(422, "IDEMPOTENCY_KEY_REUSED", "Bu Idempotency-Key farklı bir istek için kullanılmış.");
    }
    return { status: prior.statusCode, body: prior.responseBody as T };
  }
  const result = await run();
  if (result.status < 500) {
    const responseBody = result.body === undefined || result.body === null ? sql`'null'::jsonb` : result.body;
    await db.insert(idempotencyKeys).values({ actorId, key, requestHash, statusCode: result.status, responseBody }).onConflictDoNothing();
  }
  return result;
}
