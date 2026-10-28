import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole } from "../../platform/auth.ts";
import { idempotent, type Tx } from "../../platform/idempotency.ts";
import { IdParams } from "../catalog/schemas.ts";
import {
  asPublishBlocked,
  createCard,
  createSite,
  getAdminSite,
  listAdminSiteDetails,
  listAdminSites,
  listCards,
  publishSite,
  setHistoryImages,
  setLocation,
  setMapPlacement,
  setModel,
  setPhotos,
  setSections,
  setSources,
  setStories,
  unpublishSite,
  updateCard,
  updateSiteInfo,
  type AuditCtx,
} from "./sites.ts";
import {
  AdminCardDto,
  AdminCardListQuery,
  AdminCardListResponse,
  AdminListSitesQuery,
  AdminSiteDetail,
  AdminSiteDetailListResponse,
  AdminSiteListResponse,
  CreateCardBody,
  CreateSiteBody,
  HistoryImagesBody,
  LocationBody,
  MapPlacementBody,
  ModelBody,
  SectionsBody,
  SiteInfoBody,
  SiteMediaBody,
  SiteSourcesBody,
  StoriesBody,
  UpdateCardBody,
} from "./sites-schemas.ts";

/**
 * Editor panel: the 5-step site wizard (Model · Bilgiler · Fotoğraflar · Hikâye · Yayınla), About
 * sections, archive images and shared cards. Editors and admins only; every write accepts an
 * `Idempotency-Key`, runs in one transaction with its audit row, and answers with the site's full
 * editable view (drafts included).
 */
export const adminSiteRoutes: FastifyPluginAsyncZod = async (app) => {
  const editor = requireRole("editor");

  // Drafts and issue lists are for the signed-in editor only; nothing here may sit in a shared cache.
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  /** Runs one mutation through `idempotent`; the DB's publish CHECK reads as the 422 the gate gives. */
  const write = <T>(req: FastifyRequest, status: number, run: (tx: Tx, ctx: AuditCtx) => Promise<T>): Promise<T> => {
    const actorId = req.user!.id;
    return idempotent(app.deps.db, req, actorId, async (tx) => ({ status, body: await run(tx, { actorId, requestId: req.id }) })).then(
      (result) => result.body,
      (err: unknown) => {
        throw asPublishBlocked(err);
      },
    );
  };

  const sitesTag = ["admin-sites"];
  const cardsTag = ["admin-cards"];

  app.get(
    "/v1/admin/sites",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Panel eser listesi: taslaklar dahil, ada göre keyset sayfalama; her eserde yayın eksikleri ve konum kaynağı",
        querystring: AdminListSitesQuery,
        response: { 200: AdminSiteListResponse },
      },
    },
    async (req) => listAdminSites(app.deps.db, req.query),
  );

  app.get(
    "/v1/admin/site-details",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary:
          "Panel eser listesinin toplu tam görünümü: /v1/admin/sites ile aynı süzgeç, sıra ve imleç; her öğe GET /v1/admin/sites/:id gövdesiyle aynıdır (sayfa başına sabit sorgu)",
        querystring: AdminListSitesQuery,
        response: { 200: AdminSiteDetailListResponse },
      },
    },
    async (req) => listAdminSiteDetails(app.deps.db, req.query),
  );

  app.get(
    "/v1/admin/sites/:id",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Eserin düzenlenebilir tam görünümü: taslak dahil, durum, kopya anahtarı, konum kaynağı, yayın eksikleri",
        params: IdParams,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => getAdminSite(app.deps.db, req.params.id),
  );

  app.post(
    "/v1/admin/sites",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Yeni taslak eser oluştur; aynı şehirde aynı ad ve ilçe varsa 409",
        body: CreateSiteBody,
        response: { 201: AdminSiteDetail },
      },
    },
    async (req, reply) => {
      const site = await write(req, 201, (tx, ctx) => createSite(tx, ctx, req.body));
      return reply.status(201).send(site);
    },
  );

  app.patch(
    "/v1/admin/sites/:id/info",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Adım 2 · Bilgiler: ad, tür, dönem, mimar, tanım, ilçe… (gönderilen alanlar güncellenir)",
        params: IdParams,
        body: SiteInfoBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => updateSiteInfo(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/location",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Konumu belirle ya da doğrula; konum kaynağı 'manual' olur (yaklaşık iğne yayına açılır)",
        params: IdParams,
        body: LocationBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setLocation(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/model",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Adım 1 · Model: 3B modeli bağla ya da kaldır; açılış açısı",
        params: IdParams,
        body: ModelBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setModel(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/map-placement",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary:
          "Modelin haritadaki yerleşimi (konum, yön, ölçek, yükseklik, ana parça, gizlenen binalar), bütün alanlarla değiştirilir. Modeli olmayan eserde 409; konum ve noktalar eserin şehri dışındaysa 400. Yerleşim model değişince korunur",
        params: IdParams,
        body: MapPlacementBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setMapPlacement(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/media",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Adım 3 · Fotoğraflar: sıralı fotoğraf listesi ve kapak",
        params: IdParams,
        body: SiteMediaBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setPhotos(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/sources",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Eserin sıralı kaynak listesi; kaynaklar paylaşılır (var olan kimlik güncellenir, yeni kimlik oluşturulur)",
        params: IdParams,
        body: SiteSourcesBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setSources(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/stories",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Adım 4 · Hikâye: cümleleri sırasıyla değiştir; fotoğraf, kaynak, kart, ses ve vurgular doğrulanır",
        params: IdParams,
        body: StoriesBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setStories(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/sections",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Eser hakkında bölümleri (Tarihçe, Mimari, Vakıf ve akar) sırasıyla değiştir",
        params: IdParams,
        body: SectionsBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setSections(tx, ctx, req.params.id, req.body)),
  );

  app.put(
    "/v1/admin/sites/:id/history-images",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Geçmişi Gör görsellerini sırasıyla değiştir; verilen kimlikler korunur",
        params: IdParams,
        body: HistoryImagesBody,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => setHistoryImages(tx, ctx, req.params.id, req.body)),
  );

  app.post(
    "/v1/admin/sites/:id/publish",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Adım 5 · Yayınla: yayın kapısı geçerse eser herkese açılır; aksi halde 422 PUBLISH_BLOCKED ve fieldErrors._ içinde eksikler",
        params: IdParams,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => publishSite(tx, ctx, req.params.id)),
  );

  app.post(
    "/v1/admin/sites/:id/unpublish",
    {
      preHandler: editor,
      schema: {
        tags: sitesTag,
        summary: "Eseri yayından kaldır (taslağa döndür)",
        params: IdParams,
        response: { 200: AdminSiteDetail },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => unpublishSite(tx, ctx, req.params.id)),
  );

  app.get(
    "/v1/admin/cards",
    {
      preHandler: editor,
      schema: {
        tags: cardsTag,
        summary: "Paylaşılan kartlar: en yeniden eskiye, keyset sayfalama; her kartta kullanıldığı cümle sayısı",
        querystring: AdminCardListQuery,
        response: { 200: AdminCardListResponse },
      },
    },
    async (req) => listCards(app.deps.db, req.query),
  );

  app.post(
    "/v1/admin/cards",
    {
      preHandler: editor,
      schema: {
        tags: cardsTag,
        summary: "Paylaşılan kart oluştur (portre, fotoğraf ya da belge)",
        body: CreateCardBody,
        response: { 201: AdminCardDto },
      },
    },
    async (req, reply) => {
      const card = await write(req, 201, (tx, ctx) => createCard(tx, ctx, req.body));
      return reply.status(201).send(card);
    },
  );

  app.patch(
    "/v1/admin/cards/:id",
    {
      preHandler: editor,
      schema: {
        tags: cardsTag,
        summary: "Kartı düzenle; kartı kullanan her hikâye cümlesi değişikliği görür (kart başvuruyla bağlanır, kopyalanmaz)",
        params: IdParams,
        body: UpdateCardBody,
        response: { 200: AdminCardDto },
      },
    },
    async (req) => write(req, 200, (tx, ctx) => updateCard(tx, ctx, req.params.id, req.body)),
  );
};
