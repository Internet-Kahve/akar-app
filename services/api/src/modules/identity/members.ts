import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../../db/client.ts";
import { deletedAccounts, profiles, staffInvites, staffMembers } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Role } from "../../platform/auth.ts";
import type { Tx } from "../../platform/idempotency.ts";
import { lockStaff, normalizeEmail, removeStaff, setStaffRole, type Actor, type SupabaseAdmin } from "./service.ts";
import type { MemberDto, MemberListQuery } from "./schemas.ts";

// Parse only fields needed by the dashboard. Never forward Auth metadata, tokens or identities.
const AuthUser = z.object({
  id: z.uuid(),
  email: z.string().nullish(),
  created_at: z.iso.datetime({ offset: true }),
  last_sign_in_at: z.iso.datetime({ offset: true }).nullish(),
  email_confirmed_at: z.string().nullish(),
});
type AuthUser = z.infer<typeof AuthUser>;
const upstreamError = () => new AppError(502, "UPSTREAM_FAILED", "Üye bilgileri alınamadı. Biraz sonra tekrar dene.");

async function authGet(admin: SupabaseAdmin, path: string): Promise<Response> {
  try {
    const response = await fetch(`${admin.url.replace(/\/+$/, "")}/auth/v1/admin/users${path}`, {
      method: "GET",
      headers: { apikey: admin.serviceRoleKey, authorization: `Bearer ${admin.serviceRoleKey}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) throw new AppError(404, "NOT_FOUND", "Üye bulunamadı.");
    if (!response.ok) throw upstreamError();
    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw upstreamError();
  }
}
async function parseAuth<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  try {
    return schema.parse(await response.json());
  } catch {
    throw upstreamError();
  }
}
function toMember(user: AuthUser, role: Role, displayName: string | null): MemberDto {
  return {
    userId: user.id,
    email: user.email || null,
    displayName,
    role,
    emailConfirmed: !!user.email_confirmed_at,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}

export async function listMembers(db: Db, admin: SupabaseAdmin, query: MemberListQuery) {
  const params = new URLSearchParams({ page: String(query.page), per_page: String(query.pageSize) });
  if (query.query) params.set("filter", query.query);
  const response = await authGet(admin, `?${params}`);
  const { users } = await parseAuth(response, z.object({ users: z.array(AuthUser) }));
  const ids = users.map((user) => user.id);
  const [staff, names, erased] = ids.length
    ? await Promise.all([
        db.select().from(staffMembers).where(inArray(staffMembers.userId, ids)),
        db.select().from(profiles).where(inArray(profiles.userId, ids)),
        db.select().from(deletedAccounts).where(inArray(deletedAccounts.userId, ids)),
      ])
    : [[], [], []];
  const roles = new Map(staff.map((member) => [member.userId, member.role]));
  const displayNames = new Map(names.map((profile) => [profile.userId, profile.displayName]));
  const erasedIds = new Set(erased.map((account) => account.userId));
  // GoTrue returns offset pagination in Link headers. Fall back for older deployments.
  const links = response.headers.get("link");
  const hasNext = links !== null ? /rel="?next"?/.test(links) : users.length === query.pageSize;
  return {
    items: users
      .filter((user) => !erasedIds.has(user.id))
      .map((user) => toMember(user, roles.get(user.id) ?? "user", displayNames.get(user.id) ?? null)),
    page: query.page,
    nextPage: hasNext ? query.page + 1 : null,
  };
}

/** Authorization must be checked again after waiting for the shared staff lock. */
export async function lockAdmin(tx: Tx, actorId: string) {
  await lockStaff(tx);
  const [actor] = await tx.select().from(staffMembers).where(eq(staffMembers.userId, actorId));
  if (actor?.role !== "admin") throw new AppError(403, "FORBIDDEN", "Üye yönetimi için yönetici yetkisi gerekiyor.");
}

export async function setMemberRole(
  tx: Tx,
  admin: SupabaseAdmin,
  userId: string,
  role: Role,
  expectedRole: Role,
  actor: Actor,
): Promise<MemberDto> {
  await lockAdmin(tx, actor.actorId);
  if (userId === actor.actorId) throw new AppError(409, "CONFLICT", "Kendi rolünü değiştiremezsin. Başka bir yöneticiden yardım iste.");
  const [erased] = await tx.select().from(deletedAccounts).where(eq(deletedAccounts.userId, userId));
  if (erased) throw new AppError(404, "NOT_FOUND", "Üye bulunamadı.");
  const [member] = await tx.select().from(staffMembers).where(eq(staffMembers.userId, userId));
  if ((member?.role ?? "user") !== expectedRole) {
    throw new AppError(409, "CONFLICT", "Üyenin rolü başka bir işlemle değişti. Listeyi yenileyip tekrar dene.");
  }
  const user = await parseAuth(await authGet(admin, `/${encodeURIComponent(userId)}`), AuthUser);
  if (user.id !== userId) throw upstreamError();
  if (role !== "user" && (!user.email || !user.email_confirmed_at)) {
    throw new AppError(409, "CONFLICT", "Yetki atamak için üyenin e-posta adresini doğrulaması gerekiyor.");
  }
  // Consume pending email invites even when explicitly choosing user; otherwise an old invite
  // could silently re-grant privileges on the next request after a demotion.
  const inviteEmails = [...new Set([user.email, member?.email].filter((email): email is string => !!email).map(normalizeEmail))];
  if (inviteEmails.length) {
    const revoked = await tx
      .update(staffInvites)
      .set({ revokedAt: sql`now()`, updatedAt: sql`now()` })
      .where(and(inArray(sql`lower(${staffInvites.email})`, inviteEmails), isNull(staffInvites.userId), isNull(staffInvites.revokedAt)))
      .returning();
    for (const invite of revoked)
      await recordAudit(tx, {
        ...actor,
        action: "staff.revoke",
        entityType: "staff_invite",
        entityId: invite.id,
        before: { email: invite.email, role: invite.role },
        after: { reason: "member.role" },
      });
  }
  if (role === "user") {
    if (member) await removeStaff(tx, userId, actor);
  } else if (member) {
    await setStaffRole(tx, userId, role, actor);
    await tx
      .update(staffMembers)
      .set({ email: normalizeEmail(user.email!) })
      .where(eq(staffMembers.userId, userId));
  } else {
    await tx.insert(staffMembers).values({ userId, email: normalizeEmail(user.email!), role, grantedBy: actor.actorId });
    await recordAudit(tx, {
      ...actor,
      action: "staff.grant",
      entityType: "staff_member",
      entityId: userId,
      before: { role: "user" },
      after: { email: normalizeEmail(user.email!), role },
    });
  }
  const [profile] = await tx.select().from(profiles).where(eq(profiles.userId, userId));
  return toMember(user, role, profile?.displayName ?? null);
}
