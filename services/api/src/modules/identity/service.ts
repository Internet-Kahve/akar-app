import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";
import { randomUUID } from "node:crypto";
import type { Config } from "../../config.ts";
import type { Db } from "../../db/client.ts";
import { profiles, staffInvites, staffMembers } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { recordAudit } from "../../platform/audit.ts";
import type { Role } from "../../platform/auth.ts";
import type { Tx } from "../../platform/idempotency.ts";
import type { InviteResponse, StaffInviteDto, StaffMemberDto } from "./schemas.ts";

export type StaffMemberRow = typeof staffMembers.$inferSelect;
export type StaffInviteRow = typeof staffInvites.$inferSelect;
export type StaffRole = StaffMemberRow["role"];

/** Who performs a privileged write; `actorId` is `cli` for the bootstrap command. */
export type Actor = { actorId: string; requestId?: string | undefined };

/** Case-insensitive address key: invites, members and token claims are all compared in this form. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Every write to staff_members / staff_invites (the grant at first sign-in, invites, role changes,
 * removals) runs under this one transaction-scoped advisory lock. Staff changes are rare, so a
 * single lock is cheap, and it turns "the last admin stays" and "an invite is consumed once" into
 * plain read-then-write checks that concurrent requests cannot interleave.
 */
async function lockStaff(tx: Tx): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('identity.staff'))`);
}

const openInvitesFor = (email: string) =>
  and(sql`lower(${staffInvites.email}) = ${email}`, isNull(staffInvites.userId), isNull(staffInvites.revokedAt));

const notFound = (what: "member" | "invite") =>
  new AppError(404, "NOT_FOUND", what === "member" ? "Yetkili bulunamadı." : "Açık davet bulunamadı.");

export const toMemberDto = (m: StaffMemberRow): StaffMemberDto => ({
  userId: m.userId,
  email: m.email,
  role: m.role,
  grantedBy: m.grantedBy,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

export const toInviteDto = (i: StaffInviteRow): StaffInviteDto => ({
  id: i.id,
  email: i.email,
  role: i.role,
  invitedBy: i.invitedBy,
  createdAt: i.createdAt.toISOString(),
});

// ── Roles at sign-in ─────────────────────────────────────────────────────────────────────────────

/**
 * The server-side role of a verified token. Comes from `staff_members` only; a user without a row
 * who carries the address of an open invite is granted that invite's role on the spot.
 */
export async function resolveRole(db: Db, userId: string, email: string | undefined): Promise<Role> {
  const [member] = await db.select({ role: staffMembers.role }).from(staffMembers).where(eq(staffMembers.userId, userId));
  if (member) return member.role;
  if (email) {
    const granted = await claimInvite(db, userId, email);
    if (granted) return granted;
  }
  return "user";
}

/**
 * Turns the open invite for `email` into a staff row for `userId`: creates the member, marks the
 * invite as used by this user, audits `staff.grant`; all in one transaction. Returns the granted
 * role, or null when there is nothing to grant. Concurrent first requests of the same user queue on
 * the staff lock; the later ones find the member row and change nothing, so it happens once.
 */
export async function claimInvite(db: Db, userId: string, rawEmail: string): Promise<StaffRole | null> {
  const email = normalizeEmail(rawEmail);

  // Almost every signed-in user has no invite: answer them without a transaction or the lock. An
  // invite this user claimed also counts: a concurrent first request may have just claimed it, and
  // this request must then wait for that grant instead of answering "user".
  const [pending] = await db
    .select({ id: staffInvites.id })
    .from(staffInvites)
    .where(
      and(
        sql`lower(${staffInvites.email}) = ${email}`,
        isNull(staffInvites.revokedAt),
        or(isNull(staffInvites.userId), eq(staffInvites.userId, userId)),
      ),
    )
    .limit(1);
  if (!pending) return null;

  return db.transaction(async (tx) => {
    await lockStaff(tx);
    const [member] = await tx.select({ role: staffMembers.role }).from(staffMembers).where(eq(staffMembers.userId, userId));
    if (member) return member.role;

    // Newest first; older open invites for the same address are consumed with it so a later
    // removal of this member cannot re-grant through a forgotten invite.
    const open = await tx
      .select()
      .from(staffInvites)
      .where(openInvitesFor(email))
      .orderBy(desc(staffInvites.createdAt), desc(staffInvites.id));
    const [invite] = open;
    if (!invite) return null;

    await tx.insert(staffMembers).values({ userId, email, role: invite.role, grantedBy: invite.invitedBy });
    await tx
      .update(staffInvites)
      .set({ userId, updatedAt: sql`now()` })
      .where(inArray(staffInvites.id, open.map((i) => i.id)));
    await recordAudit(tx, {
      actorId: userId,
      action: "staff.grant",
      entityType: "staff_member",
      entityId: userId,
      after: { email, role: invite.role, inviteId: invite.id, invitedBy: invite.invitedBy },
    });
    return invite.role;
  });
}

// ── Profile ──────────────────────────────────────────────────────────────────────────────────────

export async function displayNameOf(db: Db, userId: string): Promise<string | null> {
  const [row] = await db.select({ displayName: profiles.displayName }).from(profiles).where(eq(profiles.userId, userId));
  return row?.displayName ?? null;
}

export async function saveDisplayName(tx: Tx, userId: string, displayName: string): Promise<void> {
  await tx
    .insert(profiles)
    .values({ userId, displayName })
    .onConflictDoUpdate({ target: profiles.userId, set: { displayName, updatedAt: sql`now()` } });
}

// ── Staff administration ─────────────────────────────────────────────────────────────────────────

export async function listStaff(db: Db): Promise<{ members: StaffMemberDto[]; invites: StaffInviteDto[] }> {
  const [members, invites] = await Promise.all([
    db.select().from(staffMembers).orderBy(asc(staffMembers.createdAt), asc(staffMembers.userId)),
    db
      .select()
      .from(staffInvites)
      .where(and(isNull(staffInvites.userId), isNull(staffInvites.revokedAt)))
      .orderBy(desc(staffInvites.createdAt), asc(staffInvites.id)),
  ]);
  return { members: members.map(toMemberDto), invites: invites.map(toInviteDto) };
}

/** Only the staff lock holder may call this; 409 unless another admin would remain. */
async function assertAnotherAdmin(tx: Tx, userId: string): Promise<void> {
  const [other] = await tx
    .select({ userId: staffMembers.userId })
    .from(staffMembers)
    .where(and(eq(staffMembers.role, "admin"), ne(staffMembers.userId, userId)))
    .limit(1);
  if (!other) {
    throw new AppError(
      409,
      "CONFLICT",
      "Sistemdeki son yönetici olduğu için rolü değiştirilemez ya da kaldırılamaz. Önce başka bir yönetici ata.",
    );
  }
}

/** Sets the role of an existing member (no-op when it already is that role). Staff lock must be held. */
async function applyRole(tx: Tx, member: StaffMemberRow, role: StaffRole, actor: Actor): Promise<StaffMemberRow> {
  if (member.role === role) return member;
  if (member.role === "admin") await assertAnotherAdmin(tx, member.userId);

  const [updated] = await tx
    .update(staffMembers)
    .set({ role, grantedBy: actor.actorId, updatedAt: sql`now()` })
    .where(eq(staffMembers.userId, member.userId))
    .returning();
  await recordAudit(tx, {
    actorId: actor.actorId,
    action: "staff.role",
    entityType: "staff_member",
    entityId: member.userId,
    before: { email: member.email, role: member.role },
    after: { email: member.email, role },
    requestId: actor.requestId,
  });
  return updated ?? member;
}

export async function setStaffRole(tx: Tx, userId: string, role: StaffRole, actor: Actor): Promise<StaffMemberRow> {
  await lockStaff(tx);
  const [member] = await tx.select().from(staffMembers).where(eq(staffMembers.userId, userId));
  if (!member) throw notFound("member");
  return applyRole(tx, member, role, actor);
}

/** Removes the role grant; the account itself stays an ordinary user. Returns the removed row. */
export async function removeStaff(tx: Tx, userId: string, actor: Actor): Promise<StaffMemberRow> {
  await lockStaff(tx);
  const [member] = await tx.select().from(staffMembers).where(eq(staffMembers.userId, userId));
  if (!member) throw notFound("member");
  if (member.role === "admin") await assertAnotherAdmin(tx, userId);

  await tx.delete(staffMembers).where(eq(staffMembers.userId, userId));
  await recordAudit(tx, {
    actorId: actor.actorId,
    action: "staff.revoke",
    entityType: "staff_member",
    entityId: userId,
    before: { email: member.email, role: member.role },
    requestId: actor.requestId,
  });
  return member;
}

/** Withdraws an invite that has not been used yet. Returns the revoked row. */
export async function revokeInvite(tx: Tx, inviteId: string, actor: Actor): Promise<StaffInviteRow> {
  await lockStaff(tx);
  const [invite] = await tx
    .update(staffInvites)
    .set({ revokedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(staffInvites.id, inviteId), isNull(staffInvites.userId), isNull(staffInvites.revokedAt)))
    .returning();
  if (!invite) throw notFound("invite");

  await recordAudit(tx, {
    actorId: actor.actorId,
    action: "staff.revoke",
    entityType: "staff_invite",
    entityId: invite.id,
    before: { email: invite.email, role: invite.role },
    requestId: actor.requestId,
  });
  return invite;
}

export type InviteResult =
  | { outcome: "invited"; invite: StaffInviteRow; created: boolean; emailSent: boolean }
  | { outcome: "role_updated"; member: StaffMemberRow };

/** Sends the invite email; true = sent, false = the account already exists. Throws to abort the invite. */
export type DeliverInvite = (email: string) => Promise<boolean>;

/**
 * Invites `email` with `role`. There is at most one open invite per address: inviting again
 * updates its role and sends the email again. An address that already belongs to a staff member
 * gets that member's role set instead (no email). The role itself is granted when the invitee's
 * first request arrives (see `claimInvite`). `deliver` runs inside the caller's transaction, so a
 * failing delivery rolls the invite back; without it (CLI) no email is sent.
 */
export async function inviteStaff(
  tx: Tx,
  input: Actor & { email: string; role: StaffRole },
  deliver?: DeliverInvite,
): Promise<InviteResult> {
  const email = normalizeEmail(input.email);
  await lockStaff(tx);

  const [member] = await tx
    .select()
    .from(staffMembers)
    .where(sql`lower(${staffMembers.email}) = ${email}`)
    .orderBy(desc(staffMembers.createdAt))
    .limit(1);
  if (member) return { outcome: "role_updated", member: await applyRole(tx, member, input.role, input) };

  const [open] = await tx
    .select()
    .from(staffInvites)
    .where(openInvitesFor(email))
    .orderBy(desc(staffInvites.createdAt), desc(staffInvites.id))
    .limit(1);

  let invite: StaffInviteRow | undefined;
  if (open) {
    [invite] = await tx
      .update(staffInvites)
      .set({ role: input.role, invitedBy: input.actorId, updatedAt: sql`now()` })
      .where(eq(staffInvites.id, open.id))
      .returning();
  } else {
    [invite] = await tx
      .insert(staffInvites)
      .values({ id: randomUUID(), email, role: input.role, invitedBy: input.actorId })
      .returning();
  }
  if (!invite) throw new Error("staff invite write returned no row");

  const emailSent = deliver ? await deliver(email) : false;
  await recordAudit(tx, {
    actorId: input.actorId,
    action: "staff.invite",
    entityType: "staff_invite",
    entityId: invite.id,
    before: open ? { email, role: open.role } : null,
    after: { email, role: input.role, emailSent },
    requestId: input.requestId,
  });
  return { outcome: "invited", invite, created: !open, emailSent };
}

export function inviteResponse(result: InviteResult): InviteResponse {
  if (result.outcome === "role_updated") {
    const { member } = result;
    return { outcome: "role_updated", email: member.email, role: member.role, inviteId: null, userId: member.userId, emailSent: false };
  }
  const { invite } = result;
  return { outcome: "invited", email: invite.email, role: invite.role, inviteId: invite.id, userId: null, emailSent: result.emailSent };
}

// ── Supabase Auth admin API ──────────────────────────────────────────────────────────────────────

export type SupabaseAdmin = { url: string; serviceRoleKey: string };

/** 503 when the server has no Supabase project to invite through. */
export function supabaseAdminFrom(config: Pick<Config, "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">): SupabaseAdmin {
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = config;
  if (!url || !serviceRoleKey) {
    throw new AppError(503, "SERVICE_UNAVAILABLE", "Davet e-postası gönderilemiyor: kimlik hizmeti (Supabase) yapılandırılmamış.");
  }
  return { url, serviceRoleKey };
}

/** GoTrue answers 422 `email_exists` when the address already has a confirmed account. */
function isAlreadyRegistered(status: number, body: unknown): boolean {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const code = typeof b.error_code === "string" ? b.error_code : typeof b.code === "string" ? b.code : "";
  if (code === "email_exists" || code === "user_already_exists") return true;
  const message = [b.msg, b.message].find((v): v is string => typeof v === "string") ?? "";
  return status === 422 && /already (been )?registered|already exists/i.test(message);
}

const INVITE_TIMEOUT_MS = 8_000;

/**
 * Asks Supabase Auth to create the account and email the invite (`POST /auth/v1/invite` with the
 * service-role key). True = email sent; false = the account already exists, so nothing was sent and
 * the person simply signs in (the role is granted by address). Anything else is 502 UPSTREAM_FAILED.
 */
export async function sendSupabaseInvite(admin: SupabaseAdmin, email: string, log?: FastifyBaseLogger): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(`${admin.url.replace(/\/+$/, "")}/auth/v1/invite`, {
      method: "POST",
      headers: {
        apikey: admin.serviceRoleKey,
        authorization: `Bearer ${admin.serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email }),
      signal: AbortSignal.timeout(INVITE_TIMEOUT_MS),
    });
  } catch (err) {
    log?.warn({ err }, "supabase invite: request failed");
    throw new AppError(502, "UPSTREAM_FAILED", "Davet e-postası gönderilemedi: kimlik hizmetine ulaşılamadı. Biraz sonra tekrar dene.");
  }

  const raw = await res.text().catch(() => "");
  if (res.ok) return true;

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  if (isAlreadyRegistered(res.status, body)) return false;

  log?.warn({ status: res.status, body: raw.slice(0, 500) }, "supabase invite: rejected");
  throw new AppError(502, "UPSTREAM_FAILED", "Davet e-postası gönderilemedi: kimlik hizmeti isteği reddetti. Biraz sonra tekrar dene.");
}
