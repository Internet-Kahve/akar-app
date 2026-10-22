import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { addReadCache } from "../../http-cache.ts";
import { IdParams } from "../catalog/schemas.ts";
import { ListRoutesQuery, RouteBundle, RouteDto, RouteListResponse } from "./schemas.ts";
import { getRoute, getRouteBundle, listRoutes } from "./service.ts";

export const catalogRouteRoutes: FastifyPluginAsyncZod = async (app) => {
  addReadCache(app);

  app.get(
    "/v1/routes",
    {
      schema: {
        tags: ["routes"],
        summary: "Yayındaki katalog rotaları ve sıralı durakları",
        querystring: ListRoutesQuery,
        response: { 200: RouteListResponse },
      },
    },
    async (req) => ({ items: await listRoutes(app.deps.db, req.query) }),
  );

  app.get(
    "/v1/routes/:id",
    {
      schema: {
        tags: ["routes"],
        summary: "Rota detayı",
        params: IdParams,
        response: { 200: RouteDto },
      },
    },
    async (req) => getRoute(app.deps.db, req.params.id),
  );

  app.get(
    "/v1/routes/:id/bundle",
    {
      schema: {
        tags: ["routes"],
        summary: "Rotanın çevrimdışı paketi: durak eserleri, cevapsız bulmacalar ve önbelleğe alınacak medya adresleri",
        params: IdParams,
        response: { 200: RouteBundle },
      },
    },
    async (req) => getRouteBundle(app.deps.db, req.params.id),
  );
};
