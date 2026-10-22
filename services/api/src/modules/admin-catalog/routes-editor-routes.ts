import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole } from "../../platform/auth.ts";
import { idempotent, type Tx } from "../../platform/idempotency.ts";
import { IdParams } from "../catalog/schemas.ts";
import {
  createQuiz,
  createRoute,
  getAdminQuiz,
  getAdminRoute,
  listAdminQuizzes,
  listAdminRoutes,
  replaceQuiz,
  setRouteStatus,
  setRouteStops,
  updateRoute,
  type Actor,
} from "./routes-editor.ts";
import {
  AdminQuiz,
  AdminQuizList,
  AdminRoute,
  AdminRouteList,
  CreateRouteBody,
  ListAdminQuizzesQuery,
  ListAdminRoutesQuery,
  QuizBody,
  SetStopsBody,
  UpdateRouteBody,
} from "./routes-editor-schemas.ts";

/**
 * Route editor ("Rota düzenle") and quiz editor: `/v1/admin/routes*` and `/v1/admin/quizzes*`.
 * Editors and admins only; none of these responses is cacheable or public (they include drafts and
 * the quiz answer key).
 */
export const adminRouteRoutes: FastifyPluginAsyncZod = async (app) => {
  // Checked on `onRequest`, so a guest or a visitor is turned away before the body is parsed or validated.
  app.addHook("onRequest", requireRole("editor"));

  /**
   * Runs `write` in one transaction, once per (actor, Idempotency-Key); a replay returns the stored
   * body. The response status is fixed per endpoint, so it is passed in rather than read back.
   */
  const mutate = async <T>(req: FastifyRequest, status: number, write: (tx: Tx, actor: Actor) => Promise<T>): Promise<T> => {
    const actor: Actor = { id: req.user!.id, requestId: req.id };
    const { body } = await idempotent(app.deps.db, req, actor.id, async (tx) => ({ status, body: await write(tx, actor) }));
    return body;
  };

  // ── routes ─────────────────────────────────────────────────────────────────

  app.get(
    "/v1/admin/routes",
    {
      schema: {
        tags: ["admin-routes"],
        summary: "Rotalar: taslaklar dahil, duruma göre süzülebilir, id sırasıyla sayfalanır (editör)",
        querystring: ListAdminRoutesQuery,
        response: { 200: AdminRouteList },
      },
    },
    async (req) => listAdminRoutes(app.deps.db, req.query),
  );

  app.get(
    "/v1/admin/routes/:id",
    {
      schema: {
        tags: ["admin-routes"],
        summary: "Rota detayı: taslak dahil, durakları eserlerinin yayın durumuyla (editör)",
        params: IdParams,
        response: { 200: AdminRoute },
      },
    },
    async (req) => getAdminRoute(app.deps.db, req.params.id),
  );

  app.post(
    "/v1/admin/routes",
    {
      schema: {
        tags: ["admin-routes"],
        summary: "Taslak rota oluştur; kimlik addan üretilir (editör)",
        body: CreateRouteBody,
        response: { 201: AdminRoute },
      },
    },
    async (req, reply) => {
      const route = await mutate(req, 201, (tx, actor) => createRoute(tx, actor, req.body));
      reply.code(201);
      return route;
    },
  );

  app.patch(
    "/v1/admin/routes/:id",
    {
      schema: {
        tags: ["admin-routes"],
        summary: "Rota bilgilerini güncelle: yalnız gönderilen alanlar değişir, null alanı siler (editör)",
        params: IdParams,
        body: UpdateRouteBody,
        response: { 200: AdminRoute },
      },
    },
    (req) => mutate(req, 200, (tx, actor) => updateRoute(tx, actor, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/routes/:id/stops",
    {
      schema: {
        tags: ["admin-routes"],
        summary: "Rotanın sıralı duraklarını belirle: eserler rotanın şehrinde, bulmaca ve görsel durağın kendi eserinden olmalı (editör)",
        params: IdParams,
        body: SetStopsBody,
        response: { 200: AdminRoute },
      },
    },
    (req) => mutate(req, 200, (tx, actor) => setRouteStops(tx, actor, req.params.id, req.body.stops)),
  );

  app.post(
    "/v1/admin/routes/:id/publish",
    {
      schema: {
        tags: ["admin-routes"],
        summary: "Rotayı yayınla: en az iki durak ve hepsinin eseri yayında olmalı, yoksa 422 PUBLISH_BLOCKED (editör)",
        params: IdParams,
        response: { 200: AdminRoute },
      },
    },
    (req) => mutate(req, 200, (tx, actor) => setRouteStatus(tx, actor, req.params.id, "published")),
  );

  app.post(
    "/v1/admin/routes/:id/unpublish",
    {
      schema: {
        tags: ["admin-routes"],
        summary: "Rotayı yayından kaldır: taslağa döner (editör)",
        params: IdParams,
        response: { 200: AdminRoute },
      },
    },
    (req) => mutate(req, 200, (tx, actor) => setRouteStatus(tx, actor, req.params.id, "draft")),
  );

  // ── quizzes ────────────────────────────────────────────────────────────────

  app.get(
    "/v1/admin/quizzes",
    {
      schema: {
        tags: ["admin-quizzes"],
        summary: "Bulmacalar, cevap indeksi dahil: eser kimliğine göre süzülebilir, id sırasıyla sayfalanır (editör)",
        querystring: ListAdminQuizzesQuery,
        response: { 200: AdminQuizList },
      },
    },
    async (req) => listAdminQuizzes(app.deps.db, req.query),
  );

  app.get(
    "/v1/admin/quizzes/:id",
    {
      schema: {
        tags: ["admin-quizzes"],
        summary: "Bulmaca detayı, cevap indeksi dahil (editör)",
        params: IdParams,
        response: { 200: AdminQuiz },
      },
    },
    async (req) => getAdminQuiz(app.deps.db, req.params.id),
  );

  app.post(
    "/v1/admin/quizzes",
    {
      schema: {
        tags: ["admin-quizzes"],
        summary: "Bulmaca oluştur: soru, tam üç seçenek, doğru seçenek, açıklama ve kaynak; cevap ayrı tabloda saklanır (editör)",
        body: QuizBody,
        response: { 201: AdminQuiz },
      },
    },
    async (req, reply) => {
      const quiz = await mutate(req, 201, (tx, actor) => createQuiz(tx, actor, req.body));
      reply.code(201);
      return quiz;
    },
  );

  app.put(
    "/v1/admin/quizzes/:id",
    {
      schema: {
        tags: ["admin-quizzes"],
        summary: "Bulmacayı bütünüyle değiştir; eser değiştirilemez (editör)",
        params: IdParams,
        body: QuizBody,
        response: { 200: AdminQuiz },
      },
    },
    (req) => mutate(req, 200, (tx, actor) => replaceQuiz(tx, actor, req.params.id, req.body)),
  );
};
