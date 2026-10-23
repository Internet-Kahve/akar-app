import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import type { AppDeps } from "../../app.ts";
import { requireRole, requireUser } from "../../platform/auth.ts";
import { idempotent } from "../../platform/idempotency.ts";
import { deleteMediaObjects, deleteUploadObjects, requireDep } from "../media/service.ts";
import { deleteSupabaseUser, eraseAccount, type ErasedObjects } from "./erasure.ts";
import {
  AccountIdParams,
  InviteBody,
  InviteIdParams,
  InviteResponse,
  MeResponse,
  ProfileBody,
  ProfileResponse,
  RoleBody,
  StaffInviteDto,
  StaffListResponse,
  StaffMemberDto,
  UserIdParams,
} from "./schemas.ts";
import {
  displayNameOf,
  inviteResponse,
  inviteStaff,
  listStaff,
  removeStaff,
  revokeInvite,
  saveDisplayName,
  sendSupabaseInvite,
  setStaffRole,
  supabaseAdminFrom,
  toInviteDto,
  toMemberDto,
} from "./service.ts";

/**
 * Erases `userId` (see `eraseAccount`) under `idempotent`, then deletes the freed storage objects after the commit.
 * 503 before anything happens without a Supabase project, and (rolling back) when objects must go but no storage is set.
 */
async function erasing(deps: AppDeps, req: FastifyRequest, userId: string): Promise<void> {
  const supabase = supabaseAdminFrom(deps.config, "Hesap silinemiyor");
  const actor = { id: req.user!.id, requestId: req.id };
  let freed: ErasedObjects = { media: [], uploads: [] };
  await idempotent(deps.db, req, actor.id, async (tx) => {
    const objects = await eraseAccount(tx, userId, actor, () => deleteSupabaseUser(supabase, userId, req.log));
    if (objects.media.length + objects.uploads.length > 0) requireDep(deps.storage, "Depolama");
    freed = objects;
    return { status: 204, body: null };
  });
  await deleteMediaObjects(deps.db, deps.storage, freed.media, req.log);
  await deleteUploadObjects(deps.storage, freed.uploads, req.log);
}

/** Session, profile, account erasure and staff administration. Roles live in `staff_members`; see `verifier.ts` for how a token becomes a user. */
export const identityRoutes: FastifyPluginAsyncZod = async (app) => {
  // Personal and admin data: never stored by shared caches.
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "private, no-store");
  });

  app.get(
    "/v1/me",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Oturum açan kullanıcı: rol, e-posta ve görünen ad",
        response: { 200: MeResponse },
      },
    },
    async (req) => {
      const user = req.user!;
      return { id: user.id, role: user.role, email: user.email ?? null, displayName: await displayNameOf(app.deps.db, user.id) };
    },
  );

  app.put(
    "/v1/me/profile",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Görünen adı belirle (onaylı anılarda herkese açık görünür)",
        body: ProfileBody,
        response: { 200: ProfileResponse },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      const { displayName } = req.body;
      const result = await idempotent(app.deps.db, req, userId, async (tx) => {
        await saveDisplayName(tx, userId, displayName);
        return { status: 200, body: { id: userId, displayName } };
      });
      return result.body;
    },
  );

  app.delete(
    "/v1/me",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Hesabımı ve verilerimi sil (KVKK): geri alınamaz",
        description:
          "Hesap ve ona bağlı her veri kalıcı olarak silinir: anılar (her durumda; bildirimleri ve fotoğraflarıyla), başka anılara yapılan bildirimler, puanlar, kaydedilenler, Rotam, ilerleme, rozetler, görünen ad, yüklemeler; en son Supabase'deki hesap (e-posta). Supabase hata verirse hiçbir şey silinmez (502). Yetkili hesap (editör, moderatör, admin) silinemez (409): önce bir admin yetkiyi kaldırır. Silinen hesabın hâlâ geçerli token'ı 401 alır; bu yüzden aynı Idempotency-Key ile tekrar de 401 döner. Audit kaydında yalnız sayılar kalır (`account.delete`).",
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await erasing(app.deps, req, req.user!.id);
      return reply.status(204).send(null);
    },
  );

  app.get(
    "/v1/admin/staff",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["staff"],
        summary: "Yetkililer ve henüz kullanılmamış davetler",
        response: { 200: StaffListResponse },
      },
    },
    async () => listStaff(app.deps.db),
  );

  app.post(
    "/v1/admin/staff/invites",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["staff"],
        summary: "Yetkili davet et: e-postaya davet gider, rol e-postayla yapılan ilk girişte verilir",
        body: InviteBody,
        response: { 200: InviteResponse, 201: InviteResponse },
      },
    },
    async (req, reply) => {
      const supabase = supabaseAdminFrom(app.deps.config);
      const actor = { actorId: req.user!.id, requestId: req.id };
      const result = await idempotent(app.deps.db, req, actor.actorId, async (tx) => {
        const outcome = await inviteStaff(tx, { ...actor, email: req.body.email, role: req.body.role }, (email) =>
          sendSupabaseInvite(supabase, email, req.log),
        );
        return { status: outcome.outcome === "invited" && outcome.created ? 201 : 200, body: inviteResponse(outcome) };
      });
      return reply.status(result.status as 200 | 201).send(result.body);
    },
  );

  app.delete(
    "/v1/admin/staff/invites/:id",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["staff"],
        summary: "Kullanılmamış daveti geri al; geri alınan davet rol vermez",
        params: InviteIdParams,
        response: { 200: StaffInviteDto },
      },
    },
    async (req) => {
      const actor = { actorId: req.user!.id, requestId: req.id };
      const result = await idempotent(app.deps.db, req, actor.actorId, async (tx) => ({
        status: 200,
        body: toInviteDto(await revokeInvite(tx, req.params.id, actor)),
      }));
      return result.body;
    },
  );

  app.put(
    "/v1/admin/staff/:userId",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["staff"],
        summary: "Yetkilinin rolünü belirle; son yönetici düşürülemez (409)",
        params: UserIdParams,
        body: RoleBody,
        response: { 200: StaffMemberDto },
      },
    },
    async (req) => {
      const actor = { actorId: req.user!.id, requestId: req.id };
      const result = await idempotent(app.deps.db, req, actor.actorId, async (tx) => ({
        status: 200,
        body: toMemberDto(await setStaffRole(tx, req.params.userId, req.body.role, actor)),
      }));
      return result.body;
    },
  );

  app.delete(
    "/v1/admin/staff/:userId",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["staff"],
        summary: "Yetkiyi kaldır (hesap sıradan kullanıcı olarak kalır); son yönetici kaldırılamaz (409)",
        params: UserIdParams,
        response: { 200: StaffMemberDto },
      },
    },
    async (req) => {
      const actor = { actorId: req.user!.id, requestId: req.id };
      const result = await idempotent(app.deps.db, req, actor.actorId, async (tx) => ({
        status: 200,
        body: toMemberDto(await removeStaff(tx, req.params.userId, actor)),
      }));
      return result.body;
    },
  );

  app.delete(
    "/v1/admin/users/:userId",
    {
      preHandler: requireRole("admin"),
      schema: {
        tags: ["staff"],
        summary: "Bir kullanıcının hesabını ve verilerini sil (KVKK talebi; yalnız admin)",
        description:
          "`DELETE /v1/me` ile aynı silme, e-postayla gelen talepler için. Yetkili hesap 409 (önce yetkiyi kaldır). Bilinmeyen ya da zaten silinmiş id de 204 döner. Audit: `account.delete`, aktör admin.",
        params: AccountIdParams,
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await erasing(app.deps, req, req.params.userId);
      return reply.status(204).send(null);
    },
  );
};
