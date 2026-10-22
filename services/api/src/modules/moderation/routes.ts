import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { addReadCache } from "../../http-cache.ts";
import { requireRole, requireUser } from "../../platform/auth.ts";
import { idempotent } from "../../platform/idempotency.ts";
import { PageQuery } from "../../platform/pagination.ts";
import { IdParams } from "../catalog/schemas.ts";
import {
  AdminMemory,
  AdminMemoryListResponse,
  CreateMemoryBody,
  DecisionBody,
  MemoryFeedQuery,
  ModerationQuery,
  OwnMemory,
  OwnMemoryListResponse,
  PublicMemoryListResponse,
  ReportBody,
  ReportResult,
} from "./schemas.ts";
import { createMemory, decideMemory, listMemoryFeed, listModerationQueue, listOwnMemories, listSiteMemories, reportMemory } from "./service.ts";

/** The public, cacheable reads. Their own scope: the cache hook must never reach a mutation. */
const publicMemoryReads: FastifyPluginAsyncZod = async (app) => {
  addReadCache(app);

  app.get(
    "/v1/sites/:id/memories",
    {
      schema: {
        tags: ["memories"],
        summary: "Eserin onaylı anıları, en yeniden eskiye; keyset sayfalama",
        description: "Yalnız onaylanmış anılar. Yazar yalnız görünen adla gelir; kimlik ve e-posta dönmez. Yayında olmayan eser 404.",
        params: IdParams,
        querystring: PageQuery,
        response: { 200: PublicMemoryListResponse },
      },
    },
    async (req) => listSiteMemories(app.deps.db, req.params.id, req.query),
  );

  app.get(
    "/v1/memories",
    {
      schema: {
        tags: ["memories"],
        summary: "Anı akışı: yayındaki eserlerin onaylı anıları tek listede, en yeniden eskiye; keyset sayfalama",
        description:
          "Eser başına ayrı istek gerekmez. siteIds ve city isteğe bağlı daraltır. Yalnız onaylanmış anılar ve yalnız yayındaki eserler; taslak ya da bilinmeyen eser kimliği hata vermez, sonuç getirmez. Yazar yalnız görünen adla gelir.",
        querystring: MemoryFeedQuery,
        response: { 200: PublicMemoryListResponse },
      },
    },
    async (req) => listMemoryFeed(app.deps.db, req.query),
  );
};

export const moderationRoutes: FastifyPluginAsyncZod = async (app) => {
  await app.register(publicMemoryReads);

  app.post(
    "/v1/memories",
    {
      preHandler: requireUser,
      schema: {
        tags: ["memories"],
        summary: "İz Bırak: anı gönder (her zaman onay bekler)",
        description:
          "Eser yayında olmalı; metin 1–280 karakter; kvkkConsent yalnız true olabilir; mediaId varsa kullanıcının kendi yüklediği fotoğraf olmalı. Anı `pending` başlar, moderatör onaylayana kadar yayında görünmez.",
        body: CreateMemoryBody,
        response: { 201: OwnMemory },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      const result = await idempotent(app.deps.db, req, user.id, async (tx) => ({
        status: 201,
        body: await createMemory(tx, user.id, req.body),
      }));
      reply.statusCode = result.status;
      return result.body;
    },
  );

  app.get(
    "/v1/me/memories",
    {
      preHandler: requireUser,
      schema: {
        tags: ["memories"],
        summary: "Paylaşımlarım: kendi anıların, durumları ve ret nedenleriyle",
        querystring: PageQuery,
        response: { 200: OwnMemoryListResponse },
      },
    },
    async (req) => listOwnMemories(app.deps.db, req.user!.id, req.query),
  );

  app.post(
    "/v1/memories/:id/report",
    {
      preHandler: requireUser,
      schema: {
        tags: ["memories"],
        summary: "Bildir: yayındaki anıyı moderasyona bildir",
        description:
          "Yalnız onaylı anı bildirilebilir (aksi 404); kendi anını bildiremezsin (403). Her kullanıcı bir kez bildirir: yeni bildirim 201, tekrarı 200 ve değişiklik yapmaz. Anı, onayından sonra 3 farklı kullanıcı bildirene kadar yayında kalır; 3. bildirim anıyı `pending` yapıp yayından kaldırır. Bir kullanıcı 24 saatte en fazla 5 yeni bildirim gönderebilir (aşılırsa 429 `RATE_LIMITED`); tekrar bildirim sayılmaz.",
        params: IdParams,
        body: ReportBody,
        response: { 200: ReportResult, 201: ReportResult },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      const result = await idempotent(app.deps.db, req, user.id, (tx) =>
        reportMemory(tx, user.id, req.params.id, req.body.reason, req.id),
      );
      reply.statusCode = result.status;
      return result.body;
    },
  );

  app.get(
    "/v1/admin/memories",
    {
      preHandler: requireRole("moderator"),
      schema: {
        tags: ["admin-memories"],
        summary: "Moderasyon kuyruğu: en eskiden yeniye; bildirim sayısı ve son nedenleriyle",
        description:
          "Varsayılan (`pending`) kuyruk, onaydan sonra bildirilmiş ama hâlâ yayındaki (`approved`) anıları da `reportCount` (farklı bildiren sayısı) ile listeler.",
        querystring: ModerationQuery,
        response: { 200: AdminMemoryListResponse },
      },
    },
    async (req) => listModerationQueue(app.deps.db, req.query),
  );

  app.post(
    "/v1/admin/memories/:id/decision",
    {
      preHandler: requireRole("moderator"),
      schema: {
        tags: ["admin-memories"],
        summary: "Anıyı onayla ya da nedenli reddet",
        description:
          "`pending` anı ve onaydan sonra bildirilmiş (`reportCount` > 0) onaylı anı karara bağlanır; bildirilmemiş onaylı anı ya da reddedilen anı 409 verir (ret kesindir). Bildirilmiş onaylı anıda ret anıyı yayından kaldırır; onay bildirimleri geçersiz sayar, anı yayında kalır ve bildirim sayısı sıfırdan başlar. Ret nedeni zorunludur (400). Moderatör kendi anısını karara bağlayamaz (403); admin bağlayabilir. Onay yazara 25 puan yazar (anı başına bir kez). Karar audit kaydına düşer.",
        params: IdParams,
        body: DecisionBody,
        response: { 200: AdminMemory },
      },
    },
    async (req, reply) => {
      const moderator = req.user!;
      const result = await idempotent(app.deps.db, req, moderator.id, async (tx) => ({
        status: 200,
        body: await decideMemory(tx, moderator, req.params.id, req.body, req.id),
      }));
      reply.statusCode = result.status;
      return result.body;
    },
  );
};
