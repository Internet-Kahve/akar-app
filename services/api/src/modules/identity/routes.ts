import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole, requireUser } from "../../platform/auth.ts";
import { idempotent } from "../../platform/idempotency.ts";
import {
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

/** Session, profile and staff administration. Roles live in `staff_members`; see `verifier.ts` for how a token becomes a user. */
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
};
