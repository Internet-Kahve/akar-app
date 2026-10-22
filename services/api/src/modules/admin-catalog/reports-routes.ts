import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireRole } from "../../platform/auth.ts";
import {
  draftIssuesReport,
  DraftIssuesQuery,
  duplicateReport,
  DuplicateReportQuery,
  DuplicateReportResponse,
  locationReport,
  LocationReportQuery,
} from "./reports.ts";
import { AdminSiteListResponse } from "./sites-schemas.ts";

/**
 * Editor reports ("Raporlar"): `/v1/admin/reports/*`. Read-only views over the drafts for editors and
 * admins; they name drafts, so nothing here is public or cacheable.
 */
export const adminReportRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("onRequest", requireRole("editor"));
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  const tags = ["admin-reports"];

  app.get(
    "/v1/admin/reports/draft-issues",
    {
      schema: {
        tags,
        summary: "Taslakların yayın eksikleri (publicationIssues + tür/konum kuralları), ada göre sayfalanır; ready ile yayına hazır taslaklar",
        querystring: DraftIssuesQuery,
        response: { 200: AdminSiteListResponse },
      },
    },
    async (req) => draftIssuesReport(app.deps.db, req.query),
  );

  app.get(
    "/v1/admin/reports/locations",
    {
      schema: {
        tags,
        summary: "Konumu bulunamayan ya da yaklaşık (sokak, mahalle merkezi) taslaklar, ada göre sayfalanır",
        querystring: LocationReportQuery,
        response: { 200: AdminSiteListResponse },
      },
    },
    async (req) => locationReport(app.deps.db, req.query),
  );

  app.get(
    "/v1/admin/reports/duplicates",
    {
      schema: {
        tags,
        summary: "Olası kopyalar: aynı şehirde yalın adı aynı olan, en az biri taslak eser grupları; şehir ve anahtara göre sayfalanır",
        querystring: DuplicateReportQuery,
        response: { 200: DuplicateReportResponse },
      },
    },
    async (req) => duplicateReport(app.deps.db, req.query),
  );
};
