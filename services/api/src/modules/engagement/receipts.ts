import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Config } from "../../config.ts";
import { AppError } from "../../errors.ts";
import type { PointAction } from "./points.ts";

/**
 * Guest receipts (CONTRACTS §7):
 *
 *   v1.<payload>.<sig>
 *   payload = base64url(JSON { jti, act, sub, dev, iat, exp })
 *   sig     = base64url(HMAC-SHA256(RECEIPT_SECRET, "v1." + payload))
 *
 * A receipt is proof that the server itself checked an action for a device that had no account.
 * It is redeemed once, by a signed-in user, into the points ledger (`service.ts: redeemReceipts`).
 */

const VERSION = "v1";

/** `exp = iat + 30 days`. */
export const RECEIPT_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Actions the server may sign: only those it verifies itself for a guest. `memory.approved` is a
 * moderation decision about a signed-in author and never has a receipt.
 */
export const RECEIPT_ACTIONS = ["story.complete", "quiz.correct", "visit.verified"] as const satisfies readonly PointAction[];
export type ReceiptAction = (typeof RECEIPT_ACTIONS)[number];

/** Why a receipt earned nothing; stable identifiers returned per item by `POST /v1/me/receipts`. */
export const RECEIPT_REJECTIONS = [
  "malformed",
  "unsupported_version",
  "bad_signature",
  "expired",
  "unknown_action",
  "subject_not_found",
  "already_redeemed",
  "revealed",
] as const;
export type ReceiptRejection = (typeof RECEIPT_REJECTIONS)[number];

const Payload = z.object({
  jti: z.string().min(1).max(100),
  act: z.string(),
  sub: z.string().min(1).max(100),
  dev: z.string().min(1).max(100),
  iat: z.number().int(),
  exp: z.number().int(),
});

export type ReceiptPayload = Omit<z.infer<typeof Payload>, "act"> & { act: ReceiptAction };

export type ReceiptCheck =
  | { ok: true; payload: ReceiptPayload }
  | { ok: false; reason: Extract<ReceiptRejection, "malformed" | "unsupported_version" | "bad_signature" | "expired" | "unknown_action"> };

/** The HMAC key, or 503 when the server has none: a missing key never degrades to unsigned receipts. */
export function receiptSecret(config: Pick<Config, "RECEIPT_SECRET">): string {
  if (!config.RECEIPT_SECRET) {
    throw new AppError(503, "SERVICE_UNAVAILABLE", "Misafir makbuzları şu an kullanılamıyor.");
  }
  return config.RECEIPT_SECRET;
}

const sign = (secret: string, payload: string): string => createHmac("sha256", secret).update(`${VERSION}.${payload}`).digest("base64url");

/** Compares the canonical base64url texts in constant time (lengths are public: HMAC-SHA256 is fixed size). */
function sameSignature(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

const isReceiptAction = (act: string): act is ReceiptAction => (RECEIPT_ACTIONS as readonly string[]).includes(act);

/** Signs a receipt for an action the caller has just verified. `now` is injectable for tests. */
export function issueReceipt(
  secret: string,
  input: { action: ReceiptAction; subjectId: string; deviceId: string },
  now: Date = new Date(),
): string {
  const iat = Math.floor(now.getTime() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ jti: randomUUID(), act: input.action, sub: input.subjectId, dev: input.deviceId, iat, exp: iat + RECEIPT_TTL_SECONDS }),
  ).toString("base64url");
  return `${VERSION}.${payload}.${sign(secret, payload)}`;
}

/**
 * Version, signature (constant time), payload shape, expiry and action, in that order. The payload
 * is only parsed after the signature matched, so nothing about a forged receipt is interpreted.
 * Whether the subject still exists and whether the `jti` was used is the caller's business.
 */
export function verifyReceipt(secret: string, token: string, nowSeconds: number = Math.floor(Date.now() / 1000)): ReceiptCheck {
  const parts = token.split(".");
  const [version, payload, signature] = parts;
  if (parts.length !== 3 || !version || !payload || !signature) return { ok: false, reason: "malformed" };
  if (version !== VERSION) return { ok: false, reason: "unsupported_version" };
  if (!sameSignature(sign(secret, payload), signature)) return { ok: false, reason: "bad_signature" };

  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const parsed = Payload.safeParse(json);
  if (!parsed.success) return { ok: false, reason: "malformed" };

  const { act, ...rest } = parsed.data;
  if (nowSeconds >= rest.exp) return { ok: false, reason: "expired" };
  if (!isReceiptAction(act)) return { ok: false, reason: "unknown_action" };
  return { ok: true, payload: { ...rest, act } };
}
