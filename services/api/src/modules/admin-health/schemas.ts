import { z } from "zod";
import { mediaKinds } from "../../db/schema/index.ts";

export const StorageLevel = z.enum(["ok", "warn", "critical"]);
export type StorageLevel = z.infer<typeof StorageLevel>;

export const PendingStale = z.object({
  count: z.number().int().nonnegative().describe("Eşikten uzun süredir bekleyen (pending) anı sayısı"),
  oldestCreatedAt: z.iso.datetime().nullable().describe("Bu anıların en eskisinin gönderim zamanı; yoksa null"),
  thresholdHours: z.number().int().positive().describe("Bekleme eşiği, saat (48)"),
});

export const StorageHealth = z.object({
  usedBytes: z.number().int().nonnegative().describe("Medya kayıtlarının toplam boyutu (media.bytes toplamı; boyutu bilinmeyen kayıt 0 sayılır)"),
  quotaBytes: z.number().int().positive().describe("Depolama kotası, bayt (STORAGE_QUOTA_MB)"),
  percent: z.number().nonnegative().describe("Doluluk yüzdesi, bir ondalık; kota aşılırsa 100'ü geçebilir"),
  level: StorageLevel.describe("ok: %80 altı; warn: %80 ve üstü; critical: %95 ve üstü"),
  byKind: z.record(z.enum(mediaKinds), z.number().int().nonnegative()).describe("Medya türüne göre bayt (photo, model, audio); kaydı olmayan tür 0"),
});

export const AdminHealthResponse = z.object({
  pendingStale: PendingStale,
  storage: StorageHealth.optional().describe("Yalnız admin için; moderatör cevabında bu alan hiç bulunmaz"),
});
export type AdminHealthResponse = z.infer<typeof AdminHealthResponse>;
