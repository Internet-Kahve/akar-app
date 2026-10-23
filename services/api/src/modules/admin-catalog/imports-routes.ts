import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { importStatuses } from "../../db/schema/index.ts";
import { AppError } from "../../errors.ts";
import { requireRole } from "../../platform/auth.ts";
import { idempotent } from "../../platform/idempotency.ts";
import { PageQuery } from "../../platform/pagination.ts";
import { IdParams } from "../catalog/schemas.ts";
import { formatReport, type ImportReport, type ImportStatus } from "../ingest/service.ts";
import {
  commitImportJob,
  createImportJob,
  getImportJob,
  IMPORT_PLAN_JOB,
  importItems,
  parseInventory,
  planImportJob,
  resolveCity,
  type ImportJobRow,
} from "./imports.ts";

/** The 2 MB ceiling of an uploaded inventory CSV (Fastify's default is 1 MiB). */
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const CreateImportBody = z.object({
  cityId: z.string().trim().min(1, "Boş bırakılamaz.").max(60, "En fazla 60 karakter olabilir.").describe("Şehir kimliği; ingest/cities.ts içinde tanımlı olmalı, örn. bursa"),
  csv: z
    .string()
    .min(1, "CSV boş olamaz.")
    .refine((text) => !text.includes("\u0000"), "CSV geçersiz karakter içeriyor; düz metin dosyası olmalı.")
    .describe("Envanter CSV metni; sütunlar id,cilt,sayfa,ilce,ad_ham,ad_supheli,tur,sablon,rol,olcu_sayisi,kubbe_gecisi,adres"),
  includeToc: z.boolean().default(false).describe("[yalnız içindekiler] satırlarını da al"),
});

const ImportReportDto = z.object({
  read: z.number().int(),
  ready: z.number().int(),
  approximate: z.number().int().describe("Konum yaklaşık (sokak ya da mahalle merkezi): haritada düzeltilmeden yayınlanamaz"),
  noLocation: z.number().int(),
  typeUnclear: z.number().int(),
  duplicates: z.number().int(),
  tocSkipped: z.number().int(),
  possibleDuplicates: z.number().int().describe("Yayındaki bir eserle aynı ad; yine de taslak olarak eklenir"),
  invalid: z.number().int().describe("Adı boş kalan, atlanan satırlar"),
  nameSuspect: z.number().int(),
  nameWarning: z.number().int(),
  locatedBy: z.record(z.string(), z.number().int()).describe("Konum kaynağına göre kayıt sayısı"),
});

const itemStatuses = ["ready", "approximate", "noLocation", "typeUnclear", "duplicate", "tocSkipped"] as const satisfies readonly ImportStatus[];

const ImportItem = z.object({
  row: z.number().int().describe("CSV'deki 1 tabanlı veri satırı"),
  sourceRowId: z.string(),
  status: z.enum(itemStatuses).describe("Satırın raporlama kovası; ilk eşleşen kazanır"),
  name: z.string(),
  suggestedName: z.string().nullable().describe("Ad şüpheliyse adresin ilk parçasından önerilen ad"),
  district: z.string().nullable(),
  typeId: z.string().nullable().describe("site_types kimliği; null = tür belirsiz"),
  tocOnly: z.boolean().describe("Yalnız içindekiler satırı (ilçe, adres ve sayfa yok)"),
  nameSuspect: z.boolean().describe("Veri ekibi işaretledi: çıkarılan ad yanlış"),
  nameWarning: z.boolean().describe("Otomatik uyarı: ad kesik ya da gövde metniyle karışmış olabilir"),
  possibleDuplicateOf: z.string().nullable().describe("Aynı adlı yayındaki eserin kimliği"),
  locationSource: z.string().nullable(),
});

const ImportJob = z.object({
  id: z.string(),
  cityId: z.string(),
  status: z.enum(importStatuses),
  includeToc: z.boolean(),
  report: ImportReportDto.nullable().describe("Planlama bitince dolar"),
  summary: z.string().nullable().describe("Panelde gösterilen Türkçe özet (formatReport)"),
  insertedCount: z.number().int().nullable().describe("Onaydan sonra eklenen taslak sayısı"),
  error: z.string().nullable().describe("status=failed ise nedeni"),
  createdBy: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
type ImportJob = z.infer<typeof ImportJob>;

const ImportJobDetail = ImportJob.extend({
  items: z.array(ImportItem).describe("Planlanan satırlar, CSV sırasıyla; sayfalanır"),
  nextCursor: z.string().nullable(),
});

const PlanJobData = z.object({ importId: z.string().min(1) });

function toJob(row: ImportJobRow): ImportJob {
  // Written by the planning job as an ImportReport, never by a client.
  const report = row.report as ImportReport | null;
  return {
    id: row.id,
    cityId: row.cityId,
    status: row.status,
    includeToc: row.includeToc,
    report,
    summary: report ? formatReport(report) : null,
    insertedCount: row.insertedCount,
    error: row.error,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Admin inventory import: `/v1/admin/imports*`, editors and admins only. Registers the
 * `admin.import-plan` job that plans an uploaded CSV in the background.
 */
export const adminImportRoutes: FastifyPluginAsyncZod = async (app) => {
  // Checked on `onRequest`, so a guest or a visitor is turned away before the body is read.
  app.addHook("onRequest", requireRole("editor"));

  // The openapi build has no queue: nothing to register then.
  await app.deps.jobs?.work(IMPORT_PLAN_JOB, async (data) => {
    const job = PlanJobData.safeParse(data);
    if (!job.success) {
      app.log.error({ data }, "admin.import-plan: unreadable job data");
      return;
    }
    await planImportJob(app.deps, job.data.importId, app.log);
  });

  app.post(
    "/v1/admin/imports",
    {
      bodyLimit: MAX_UPLOAD_BYTES,
      schema: {
        tags: ["admin-imports"],
        summary: "Envanter CSV'sinden içe aktarma başlat: arka planda planlanır, 202 ile işi döner (editör)",
        body: CreateImportBody,
        response: { 202: ImportJob },
      },
    },
    async (req, reply) => {
      const { jobs, geocoderFor } = app.deps;
      if (!jobs || !geocoderFor) {
        throw new AppError(503, "SERVICE_UNAVAILABLE", "İçe aktarma şu an kullanılamıyor: iş kuyruğu ya da coğrafi kodlama yapılandırılmamış.");
      }
      const city = resolveCity(req.body.cityId);
      const rows = parseInventory(req.body.csv);
      const actor = { id: req.user!.id, requestId: req.id };

      const { body } = await idempotent(app.deps.db, req, actor.id, async (tx) => {
        const job = await createImportJob(tx, actor, { city, csv: req.body.csv, includeToc: req.body.includeToc, rows: rows.length });
        await jobs.send(IMPORT_PLAN_JOB, { importId: job.id }, tx);
        return { status: 202, body: toJob(job) };
      });
      reply.code(202);
      return body;
    },
  );

  app.get(
    "/v1/admin/imports/:id",
    {
      schema: {
        tags: ["admin-imports"],
        summary: "İçe aktarmanın durumu, raporu, özeti ve planlanan satırları (editör)",
        params: IdParams,
        querystring: PageQuery,
        response: { 200: ImportJobDetail },
      },
    },
    async (req) => {
      const job = await getImportJob(app.deps.db, req.params.id);
      const page = importItems(job, req.query);
      return {
        ...toJob(job),
        items: page.items.map((i) => ({
          row: i.row,
          sourceRowId: i.sourceRowId,
          status: i.status,
          name: i.name,
          suggestedName: i.suggestedName,
          district: i.district,
          typeId: i.typeId,
          tocOnly: i.tocOnly,
          nameSuspect: i.nameSuspect,
          nameWarning: i.nameWarning,
          possibleDuplicateOf: i.possibleDuplicateOf,
          locationSource: i.locationSource,
        })),
        nextCursor: page.nextCursor,
      };
    },
  );

  app.post(
    "/v1/admin/imports/:id/commit",
    {
      schema: {
        tags: ["admin-imports"],
        summary: "Planlanmış içe aktarmayı taslak eser olarak onayla; yalnız planned durumunda, aksi halde 409 (editör)",
        params: IdParams,
        response: { 200: ImportJob },
      },
    },
    async (req) => {
      const actor = { id: req.user!.id, requestId: req.id };
      const { body } = await idempotent(app.deps.db, req, actor.id, async (tx) => ({
        status: 200,
        body: toJob(await commitImportJob(tx, actor, req.params.id)),
      }));
      return body;
    },
  );
};
