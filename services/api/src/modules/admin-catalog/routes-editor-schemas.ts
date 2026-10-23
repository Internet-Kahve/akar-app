import { z } from "zod";
import { publishStatuses } from "../../db/schema/index.ts";
import { PageQuery, pageResponse } from "../../platform/pagination.ts";
import { TrustSchema } from "../catalog/schemas.ts";

// Admin ("Rota düzenle") view of routes and quizzes: drafts included, quiz answer key included.
// Staff-only: nothing here may be reused for a public response.

const id = (what: string) => z.string().trim().min(1, "Boş bırakılamaz.").max(100, "En fazla 100 karakter olabilir.").describe(what);

/** Required free text: trimmed, never empty. Optional fields use `.nullish()`: absent = unchanged/unset, null = cleared. */
const text = (max: number) => z.string().trim().min(1, "Boş bırakılamaz.").max(max, `En fazla ${max} karakter olabilir.`);

const RouteStatus = z.enum(publishStatuses);

// ── routes ───────────────────────────────────────────────────────────────────

const routeWriteFields = {
  name: text(120).describe("Rota adı (TR)"),
  nameEn: text(120).nullish().describe("Rota adı (EN); null ile silinir"),
  description: text(1000).describe("Kısa açıklama (TR)"),
  theme: text(80).describe("Tema"),
  cityId: id("Şehir kimliği (slug), örn. bursa; duraklar bu şehirdeki eserlerden seçilir"),
  badgeTitle: text(80).nullish().describe("Rotayı bitirene verilen rozetin adı; null = rozet yok"),
  badgeMediaId: id("Rozet görselinin medya kimliği (fotoğraf); rozet adı gerektirir").nullish(),
};

export const CreateRouteBody = z.object(routeWriteFields);
export type CreateRouteBody = z.infer<typeof CreateRouteBody>;

export const UpdateRouteBody = z
  .object(routeWriteFields)
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, "En az bir alan gönderilmeli.");
export type UpdateRouteBody = z.infer<typeof UpdateRouteBody>;

export const RouteStopInput = z.object({
  siteId: id("Durağın eseri; rotanın şehrinde olmalı"),
  quizId: id("Durağın bulmacası; durağın kendi eserine ait olmalı").nullish(),
  historyImageId: id("Durağın \"Geçmişi Gör\" görseli; durağın kendi eserine ait olmalı").nullish(),
});
export type RouteStopInput = z.infer<typeof RouteStopInput>;

export const SetStopsBody = z.object({
  stops: z.array(RouteStopInput).max(50, "En fazla 50 durak olabilir.").describe("Sıralı duraklar; bir eser rotada en fazla bir kez geçer"),
});
export type SetStopsBody = z.infer<typeof SetStopsBody>;

export const ListAdminRoutesQuery = PageQuery.extend({
  status: RouteStatus.optional().describe("draft ya da published; boşsa ikisi de"),
});
export type ListAdminRoutesQuery = z.infer<typeof ListAdminRoutesQuery>;

const routeFields = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  description: z.string(),
  theme: z.string(),
  cityId: z.string(),
  badgeTitle: z.string().nullable(),
  badgeMediaId: z.string().nullable(),
  status: RouteStatus,
  updatedAt: z.iso.datetime(),
});

export const AdminRouteStop = z.object({
  position: z.number().int().describe("Duraktaki sıra, 0'dan başlar"),
  site: z.object({ id: z.string(), name: z.string(), status: RouteStatus.describe("Eser taslaksa rota yayınlanamaz") }),
  quizId: z.string().nullable(),
  historyImageId: z.string().nullable(),
});

export const AdminRouteSummary = routeFields.extend({ stopCount: z.number().int(), stops: z.array(AdminRouteStop) });
export type AdminRouteSummary = z.infer<typeof AdminRouteSummary>;

export const AdminRouteList = pageResponse(AdminRouteSummary);

export const AdminRoute = routeFields.extend({ stops: z.array(AdminRouteStop).describe("Sıralı duraklar; taslak eserler dahil") });
export type AdminRoute = z.infer<typeof AdminRoute>;

// ── quizzes ──────────────────────────────────────────────────────────────────

const option = z.string().trim().min(1, "Boş bırakılamaz.").max(200, "En fazla 200 karakter olabilir.");
const threeOptions = z.array(option).length(3, "Tam üç seçenek gerekli.");

export const QuizBody = z.object({
  siteId: id("Bulmacanın eseri; sonradan değiştirilemez"),
  question: text(300).describe("Soru (TR)"),
  questionEn: text(300).nullish().describe("Soru (EN)"),
  options: threeOptions.describe("Üç seçenek (TR)"),
  optionsEn: threeOptions.nullish().describe("Üç seçenek (EN); verilirse tam üç tane"),
  correctIndex: z
    .number()
    .int("Tam sayı olmalı.")
    .min(0, "0 ile 2 arasında olmalı.")
    .max(2, "0 ile 2 arasında olmalı.")
    .describe("Doğru seçeneğin indeksi (0–2); yalnız personel yanıtlarında döner"),
  hint: text(300).nullish().describe("İpucu"),
  explanation: text(1000).describe("Doğru cevaptan sonra gösterilen açıklama"),
  sourceId: id("Açıklamanın kaynağı (sources)").nullish(),
  trust: TrustSchema.describe("Güven düzeyi: verified / inferred / representative"),
});
export type QuizBody = z.infer<typeof QuizBody>;

export const ListAdminQuizzesQuery = PageQuery.extend({
  siteId: z.string().trim().min(1).max(100).optional().describe("Yalnız bu eserin bulmacaları"),
});
export type ListAdminQuizzesQuery = z.infer<typeof ListAdminQuizzesQuery>;

export const AdminQuiz = z.object({
  id: z.string(),
  siteId: z.string(),
  question: z.string(),
  questionEn: z.string().nullable(),
  options: z.array(z.string()),
  optionsEn: z.array(z.string()).nullable(),
  correctIndex: z.number().int().nullable().describe("Cevap anahtarı: yalnız personel uçlarında; kayıt eksikse null"),
  hint: z.string().nullable(),
  explanation: z.string(),
  sourceId: z.string().nullable(),
  trust: TrustSchema,
  updatedAt: z.iso.datetime(),
});
export type AdminQuiz = z.infer<typeof AdminQuiz>;

export const AdminQuizList = pageResponse(AdminQuiz);
