import { eq } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";
import { deletedAccounts, profiles, staffInvites, staffMembers } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import { forgetIdempotencyKeys, type Tx } from "../../platform/idempotency.ts";
import { eraseEngagement } from "../engagement/service.ts";
import { eraseUploads } from "../media/service.ts";
import { eraseMemories } from "../moderation/service.ts";
import { lockStaff, type SupabaseAdmin } from "./service.ts";

/** Objects freed by an erasure, per bucket; after the commit: `media` keys (already in the outbox) via `deleteMediaObjects`, `uploads` keys via `deleteUploadObjects`. */
export type ErasedObjects = { media: string[]; uploads: string[] };

/**
 * Account erasure (KVKK, decision §11.31): deletes everything the database holds about `userId` (memories with
 * their photos and reports, the reports they filed, points, saves, Rotam, progress, badges, profile, uploads,
 * claimed staff invites, replay records), marks the id in `deleted_accounts` so its still-valid token is refused,
 * audits `account.delete` (counts only) and, last inside the transaction, deletes the Supabase Auth user: if
 * Supabase fails, nothing is erased. Staff accounts are refused (409): an admin removes the role first, so the
 * last admin can never disappear. Audit rows keep the bare id, which points to no one once the Auth user is gone.
 */
export async function eraseAccount(
  tx: Tx,
  userId: string,
  actor: { id: string; requestId: string },
  deleteAuthUser: () => Promise<void>,
): Promise<ErasedObjects> {
  // Same lock as every staff write: no invite can turn this account into staff while it is erased.
  await lockStaff(tx);
  const [member] = await tx.select({ role: staffMembers.role }).from(staffMembers).where(eq(staffMembers.userId, userId));
  if (member) {
    throw new AppError(409, "CONFLICT", "Yetkili hesabı silinemez. Önce bir yönetici yetkiyi kaldırmalı (panel: Yetkililer), sonra hesap silinebilir.");
  }

  const { result: counts, removedObjects } = await eraseMemories(tx, userId);
  const uploads = await eraseUploads(tx, userId);
  await eraseEngagement(tx, userId);
  await tx.delete(profiles).where(eq(profiles.userId, userId));
  // A used invite holds the address; open invites belong to whoever signs up with it next.
  await tx.delete(staffInvites).where(eq(staffInvites.userId, userId));
  await forgetIdempotencyKeys(tx, userId);
  await tx.insert(deletedAccounts).values({ userId }).onConflictDoNothing();
  await recordAudit(tx, {
    actorId: actor.id,
    action: "account.delete",
    entityType: "account",
    entityId: userId,
    before: { byUser: actor.id === userId, memories: counts.memories, reports: counts.reports },
    requestId: actor.requestId,
  });
  await deleteAuthUser();
  return { media: [...removedObjects, ...uploads.media], uploads: uploads.uploads };
}

const ADMIN_TIMEOUT_MS = 8_000;

/**
 * Deletes the Supabase Auth user (`DELETE /auth/v1/admin/users/:id`, service-role key): the e-mail address and
 * sessions go with it. An account Supabase no longer knows (404) counts as deleted; anything else is 502.
 */
export async function deleteSupabaseUser(admin: SupabaseAdmin, userId: string, log?: FastifyBaseLogger): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${admin.url.replace(/\/+$/, "")}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { apikey: admin.serviceRoleKey, authorization: `Bearer ${admin.serviceRoleKey}` },
      signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
    });
  } catch (err) {
    log?.warn({ err }, "supabase user delete: request failed");
    throw new AppError(502, "UPSTREAM_FAILED", "Hesap silinemedi: kimlik hizmetine ulaşılamadı. Hiçbir veri silinmedi; biraz sonra tekrar dene.");
  }
  const raw = await res.text().catch(() => "");
  if (res.ok || res.status === 404) return;
  log?.warn({ status: res.status, body: raw.slice(0, 500) }, "supabase user delete: rejected");
  throw new AppError(502, "UPSTREAM_FAILED", "Hesap silinemedi: kimlik hizmeti isteği reddetti. Hiçbir veri silinmedi; biraz sonra tekrar dene.");
}
