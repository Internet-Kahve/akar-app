import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { addReadCache } from "../../http-cache.ts";
import { PageQuery } from "../../platform/pagination.ts";
import { getLookups, listCities } from "./lookups.ts";
import { CityListResponse, IdParams, ListSitesQuery, LookupsResponse, SiteDetail, SiteDetailListResponse, SiteListResponse } from "./schemas.ts";
import { getSiteDetail, listSiteDetails, listSites } from "./service.ts";

export const catalogRoutes: FastifyPluginAsyncZod = async (app) => {
  addReadCache(app);

  app.get(
    "/v1/sites",
    {
      schema: {
        tags: ["sites"],
        summary: "Yayındaki eserler: filtreler, ada ya da mesafeye göre sıralama, keyset sayfalama",
        querystring: ListSitesQuery,
        response: { 200: SiteListResponse },
      },
    },
    async (req) => listSites(app.deps.db, req.query),
  );

  app.get(
    "/v1/sites/:id",
    {
      schema: {
        tags: ["sites"],
        summary: "Eser detayı: hikâye blokları, bölümler, kartlar, geçmiş görselleri, medya ve kaynaklar",
        params: IdParams,
        response: { 200: SiteDetail },
      },
    },
    async (req) => getSiteDetail(app.deps.db, req.params.id),
  );

  app.get(
    "/v1/site-details",
    {
      schema: {
        tags: ["sites"],
        summary: "Yayındaki eserlerin tam detayı, ada göre keyset sayfalama: istemci kataloğu eser başına istek atmadan yükler",
        querystring: PageQuery,
        response: { 200: SiteDetailListResponse },
      },
    },
    async (req) => listSiteDetails(app.deps.db, req.query),
  );

  app.get(
    "/v1/cities",
    {
      schema: {
        tags: ["cities"],
        summary: "Şehirler; yayındaki eser ve rota sayılarıyla, ada göre",
        response: { 200: CityListResponse },
      },
    },
    async () => ({ items: await listCities(app.deps.db) }),
  );

  app.get(
    "/v1/lookups",
    {
      schema: {
        tags: ["lookups"],
        summary: "Tür, vakıf rolü kategorisi ve dönem sözlükleri (filtre çiplerinin etiketleri)",
        response: { 200: LookupsResponse },
      },
    },
    async () => getLookups(app.deps.db),
  );
};
