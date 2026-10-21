import { z } from "zod";
import { memoryStatuses } from "../../db/schema/index.ts";
import { PageQuery, pageResponse } from "../../platform/pagination.ts";

export const MEMORY_TEXT_MAX = 280;
const TEXT_RANGE = `Anın 1–${MEMORY_TEXT_MAX} karakter olmalı.`;
const REPORT_RANGE = "Bildirim nedeni 3–200 karakter olmalı.";
const REJECT_REASON_REQUIRED = "Ret nedeni zorunludur.";

export const MemoryStatus = z.enum(memoryStatuses);
export type MemoryStatus = z.infer<typeof MemoryStatus>;

// ── requests ─────────────────────────────────────────────────────────────────

export const CreateMemoryBody = z.object({
  siteId: z.string().min(1).max(100).describe("Yayındaki eserin kimliği"),
  text: z
    .string({ error: TEXT_RANGE })
    .trim()
    .min(1, TEXT_RANGE)
    .max(MEMORY_TEXT_MAX, TEXT_RANGE)
    .describe(`Anı metni; kırpıldıktan sonra 1–${MEMORY_TEXT_MAX} karakter`),
  mediaId: z.string().min(1).max(100).optional().describe("Kullanıcının kendi yüklediği fotoğrafın medya kimliği (data URL kabul edilmez)"),
  kvkkConsent: z.literal(true, { error: "Devam etmek için KVKK aydınlatma metnini onaylamalısın." }).describe("KVKK aydınlatma metni onayı; yalnız true kabul edilir"),
  kvkkTextVersion: z.string().trim().min(1).max(40).describe("Kullanıcıya gösterilen KVKK metninin sürümü"),
});
export type CreateMemoryBody = z.infer<typeof CreateMemoryBody>;

/** Rejection carries a mandatory reason; an approval has none (a stray `reason` is dropped). */
export const DecisionBody = z.discriminatedUnion(
  "status",
  [
    z.object({ status: z.literal("approved") }),
    z.object({
      status: z.literal("rejected"),
      reason: z
        .string({ error: REJECT_REASON_REQUIRED })
        .trim()
        .min(1, REJECT_REASON_REQUIRED)
        .max(500, "Ret nedeni en fazla 500 karakter olmalı.")
        .describe("Ret nedeni; yazara gösterilir"),
    }),
  ],
  { error: "Karar 'approved' ya da 'rejected' olmalı." },
);
export type DecisionBody = z.infer<typeof DecisionBody>;

export const ReportBody = z.object({
  reason: z.string({ error: REPORT_RANGE }).trim().min(3, REPORT_RANGE).max(200, REPORT_RANGE).describe("Bildirim nedeni, 3–200 karakter"),
});

export const ModerationQuery = PageQuery.extend({
  status: z
    .enum(memoryStatuses, { error: "Durum pending, approved ya da rejected olmalı." })
    .default("pending")
    .describe("Kuyruk durumu; varsayılan pending"),
});

// ── responses ────────────────────────────────────────────────────────────────

const Photo = z.object({ id: z.string(), url: z.string(), alt: z.string() });

/** What anyone may read: no author id, no e-mail, only the name shown at submission. */
export const PublicMemory = z.object({
  id: z.string(),
  siteId: z.string(),
  text: z.string(),
  authorName: z.string().describe("Gönderim anındaki görünen ad; kimlik ve e-posta hiçbir yanıtta yer almaz"),
  photo: Photo.nullable().describe("Eklenen fotoğraf; yoksa null"),
  createdAt: z.iso.datetime(),
});
export type PublicMemory = z.infer<typeof PublicMemory>;

/** The author's own view ("Paylaşımlarım"). */
export const OwnMemory = z.object({
  id: z.string(),
  siteId: z.string(),
  siteName: z.string().nullable().describe("Eserin adı; eser yayından kalktıysa null (taslak adı hiçbir okuma yanıtında yer almaz)"),
  text: z.string(),
  photo: Photo.nullable(),
  status: MemoryStatus.describe("pending: onay bekliyor · approved: yayında · rejected: reddedildi (kesin)"),
  reason: z.string().nullable().describe("Ret nedeni; yalnız reddedilen anıda dolu"),
  createdAt: z.iso.datetime(),
  decidedAt: z.iso.datetime().nullable().describe("Son moderasyon kararının zamanı; beklemedeyse null"),
});
export type OwnMemory = z.infer<typeof OwnMemory>;

/** Moderation queue item. */
export const AdminMemory = OwnMemory.extend({
  siteName: z.string(),
  authorName: z.string(),
  decidedBy: z.string().nullable().describe("Kararı veren moderatörün kullanıcı kimliği"),
  reportCount: z.number().int().describe("Farklı kullanıcıların bildirim sayısı. Onaylı anıda yalnız son onaydan sonrakiler; bekleyen ve reddedilen anıda tümü"),
  reportReasons: z.array(z.string()).describe("En son bildirim nedenleri, yeniden eskiye (en çok 5)"),
});
export type AdminMemory = z.infer<typeof AdminMemory>;

export const ReportResult = z.object({
  id: z.string().describe("Bildirilen anının kimliği"),
  reported: z.literal(true).describe("Bu kullanıcının bildirimi kayıtlı"),
});
export type ReportResult = z.infer<typeof ReportResult>;

export const PublicMemoryListResponse = pageResponse(PublicMemory);
export const OwnMemoryListResponse = pageResponse(OwnMemory);
export const AdminMemoryListResponse = pageResponse(AdminMemory);
