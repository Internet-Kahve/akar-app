import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireUser } from "../../platform/auth.ts";
import { idempotent, type Tx } from "../../platform/idempotency.ts";
import { PageQuery } from "../../platform/pagination.ts";
import { IdParams } from "../catalog/schemas.ts";
import {
  CompleteResponse,
  DeviceHeaders,
  MyRouteBody,
  MyRouteResponse,
  PassportResponse,
  ProgressBody,
  ProgressEntry,
  ProgressListResponse,
  QuizState,
  ReceiptsBody,
  ReceiptsResponse,
  RevealResponse,
  SavedListResponse,
  SavedState,
  SiteIdParams,
  SubmitBody,
  SubmitResponse,
  VerifyVisitBody,
  VerifyVisitResponse,
} from "./schemas.ts";
import {
  completeStory,
  getMyRoute,
  getPassport,
  getQuizState,
  listProgress,
  listSaved,
  playerOf,
  redeemReceipts,
  revealAnswer,
  setMyRoute,
  setProgress,
  setSaved,
  submitAnswer,
  verifyVisit,
} from "./service.ts";

/**
 * Player-facing state: saved sites, "Rotam", story progress, quizzes, visits, receipts, passport. Signed-in
 * players are identified by their token, guests (stories, quizzes, visits) by `x-device-id`.
 * Nothing here is public or cacheable, and none of it is a privileged write (no audit rows).
 */
export const engagementRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "private, no-store");
  });

  /** Runs `run` once per (actor, Idempotency-Key) in one transaction; the body is the 200 response (replayed on a retry). */
  const mutate = <T>(req: FastifyRequest, actorId: string, run: (tx: Tx) => Promise<T>): Promise<T> =>
    idempotent(app.deps.db, req, actorId, async (tx) => ({ status: 200, body: await run(tx) })).then((r) => r.body);

  // ── saved ──────────────────────────────────────────────────────────────────

  app.put(
    "/v1/me/saved/:siteId",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Eseri kaydedilenlere ekle: istenen durum belirlenir, tekrarında bir şey değişmez; yayında olmayan eser 404",
        params: SiteIdParams,
        response: { 200: SavedState },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      return mutate(req, userId, (tx) => setSaved(tx, userId, req.params.siteId, true));
    },
  );

  app.delete(
    "/v1/me/saved/:siteId",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Eseri kaydedilenlerden çıkar: kayıtlı olmasa da 200, eser artık yayında olmasa da çıkarılır",
        params: SiteIdParams,
        response: { 200: SavedState },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      return mutate(req, userId, (tx) => setSaved(tx, userId, req.params.siteId, false));
    },
  );

  app.get(
    "/v1/me/saved",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Kaydettiklerim: yalnız yayındaki eserler, en yeni önce, keyset sayfalama",
        querystring: PageQuery,
        response: { 200: SavedListResponse },
      },
    },
    async (req) => listSaved(app.deps.db, req.user!.id, req.query),
  );

  // ── my route ("Rotam") ─────────────────────────────────────────────────────

  app.get(
    "/v1/me/route",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Rotam: kullanıcının kendi rotası, sırasıyla; artık yayında olmayan eser gösterilmez",
        response: { 200: MyRouteResponse },
      },
    },
    async (req) => getMyRoute(app.deps.db, req.user!.id),
  );

  app.put(
    "/v1/me/route",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Rotam'ı baştan yaz: gövdedeki liste rotanın tamamıdır (en çok 100, yinelenmez); yayında olmayan eser 404",
        body: MyRouteBody,
        response: { 200: MyRouteResponse },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      return mutate(req, userId, (tx) => setMyRoute(tx, userId, req.body.siteIds));
    },
  );

  // ── story progress ─────────────────────────────────────────────────────────

  app.put(
    "/v1/me/progress/:siteId",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Hikâye ilerlemesini kaydet: ulaşılan en uzak blok korunur, geri gitmez; hikâyenin uzunluğunu aşamaz",
        params: SiteIdParams,
        body: ProgressBody,
        response: { 200: ProgressEntry },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      return mutate(req, userId, (tx) => setProgress(tx, userId, req.params.siteId, req.body.lastBlock));
    },
  );

  app.get(
    "/v1/me/progress",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Hikâye ilerlemelerim (“Devam et · 5/9”): son okunan önce, eser özetiyle, keyset sayfalama",
        querystring: PageQuery,
        response: { 200: ProgressListResponse },
      },
    },
    async (req) => listProgress(app.deps.db, req.user!.id, req.query),
  );

  // ── stories ────────────────────────────────────────────────────────────────

  app.post(
    "/v1/stories/:siteId/complete",
    {
      schema: {
        tags: ["stories"],
        summary: "Hikâyeyi tamamla: üye 15 puan alır (tekrarında 0) ve eserin hikâye rozetlerini kazanır (earnedBadges), misafir imzalı makbuz alır. Gövde gerekmez",
        params: SiteIdParams,
        headers: DeviceHeaders,
        response: { 200: CompleteResponse },
      },
    },
    async (req) => {
      const player = playerOf(req);
      return mutate(req, player.id, (tx) => completeStory(tx, app.deps.config, player, req.params.siteId));
    },
  );

  // ── quizzes ────────────────────────────────────────────────────────────────

  app.get(
    "/v1/quizzes/:id",
    {
      schema: {
        tags: ["quizzes"],
        summary: "Bulmaca ve oyuncunun durumu (ipucu, cevap gösterildi mi, çözüldü mü); cevap anahtarı hiçbir zaman yok",
        params: IdParams,
        headers: DeviceHeaders,
        response: { 200: QuizState },
      },
    },
    async (req) => getQuizState(app.deps.db, playerOf(req), req.params.id),
  );

  app.post(
    "/v1/quizzes/:id/submit",
    {
      schema: {
        tags: ["quizzes"],
        summary: "Cevabı sunucuda kontrol et: yanlışta ipucu, ilk doğruda 20 puan (üye) ya da makbuz (misafir)",
        params: IdParams,
        headers: DeviceHeaders,
        body: SubmitBody,
        response: { 200: SubmitResponse },
      },
    },
    async (req) => {
      const player = playerOf(req);
      return mutate(req, player.id, (tx) => submitAnswer(tx, app.deps.config, player, req.params.id, req.body.choice));
    },
  );

  app.post(
    "/v1/quizzes/:id/reveal",
    {
      schema: {
        tags: ["quizzes"],
        summary: "Cevabı göster: doğru şıkkın metni döner ve bu bulmacadan artık puan alınamaz. Gövde gerekmez",
        params: IdParams,
        headers: DeviceHeaders,
        response: { 200: RevealResponse },
      },
    },
    async (req) => {
      const player = playerOf(req);
      return mutate(req, player.id, (tx) => revealAnswer(tx, player, req.params.id));
    },
  );

  // ── visits ─────────────────────────────────────────────────────────────────

  app.post(
    "/v1/visits/verify",
    {
      schema: {
        tags: ["visits"],
        summary: "Ziyareti doğrula: koordinat yalnız bu istekte kullanılır, saklanmaz; üye 100 puan alır, misafir makbuz alır",
        headers: DeviceHeaders,
        body: VerifyVisitBody,
        response: { 200: VerifyVisitResponse },
      },
    },
    async (req) => {
      const player = playerOf(req);
      return mutate(req, player.id, (tx) => verifyVisit(tx, app.deps.config, player, req.body));
    },
  );

  // ── receipts and passport ──────────────────────────────────────────────────

  app.post(
    "/v1/me/receipts",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Misafir makbuzlarını hesaba aktar: makbuz başına sonuç döner, geçersiz makbuz puan kazandırmaz ve istek hata vermez",
        body: ReceiptsBody,
        response: { 200: ReceiptsResponse },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      return mutate(req, userId, (tx) => redeemReceipts(tx, app.deps.config, userId, req.body.receipts));
    },
  );

  app.get(
    "/v1/me/passport",
    {
      preHandler: requireUser,
      schema: {
        tags: ["me"],
        summary: "Pasaport: puan, kaydedilenler, okunanlar, ziyaretler, çözülen bulmacalar, rozetler ve hikâye ilerlemesi",
        response: { 200: PassportResponse },
      },
    },
    async (req) => getPassport(app.deps.db, req.user!.id),
  );
};
