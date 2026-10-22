import { z } from "zod";
import { mediaKinds, partsStatuses } from "../../db/schema/index.ts";
import { PageQuery, pageResponse } from "../../platform/pagination.ts";
import { MediaDto, TrustSchema } from "../catalog/schemas.ts";

export const RequestUploadBody = z.object({
  kind: z.enum(mediaKinds).describe("photo (JPEG/PNG/WebP), model (GLB) ya da audio (MP3/M4A); model ve ses yalnız editör ve yöneticiler içindir"),
  contentType: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(100)
    .describe("Dosyanın MIME türü, örn. image/jpeg; tamamlanırken dosyanın ilk baytlarıyla doğrulanır"),
  bytes: z.number().int().min(1).describe("Dosya boyutu (bayt); her tür için en çok 5 MB"),
});
export type RequestUploadInput = z.infer<typeof RequestUploadBody>;

export const UploadTicket = z.object({
  uploadId: z.string(),
  url: z.string().describe("İmzalı yükleme adresi; dosya bu adrese PUT edilir"),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()).describe("PUT isteğine aynen eklenecek başlıklar (Content-Type)"),
  expiresAt: z.string().describe("ISO 8601; yükleme ve tamamlama bu andan önce yapılmalı"),
  maxBytes: z.number().int().describe("Yüklenebilecek en büyük dosya boyutu (bayt)"),
});
export type UploadTicket = z.infer<typeof UploadTicket>;

/**
 * Metadata of one media file, every field optional on the wire: which ones are required depends on
 * who sends them (editors set everything on complete, visitors send `alt` only), which Zod cannot see.
 */
export const MediaMetadata = z.object({
  alt: z.string().trim().max(500).optional().describe("Görsel için erişilebilirlik metni; fotoğrafta zorunlu"),
  title: z.string().trim().max(200).optional(),
  titleEn: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(2000).optional(),
  license: z.string().trim().min(1).max(200).optional().describe("Lisans ya da kullanım izni; editörler için zorunlu"),
  sourceId: z.string().trim().min(1).max(100).nullable().optional().describe("Kaynak kaydı (sources) kimliği"),
  trust: TrustSchema.optional().describe("verified, inferred ya da representative; editörler için zorunlu"),
});
export type MediaMetadata = z.infer<typeof MediaMetadata>;

export const CompleteUploadBody = MediaMetadata.describe(
  "Editör ve yönetici: alt (fotoğrafta), license ve trust zorunlu, diğerleri isteğe bağlı. Diğer kullanıcılar yalnız alt gönderir; lisans ve güven düzeyini sunucu belirler.",
);

export const UpdateMediaBody = MediaMetadata.refine((body) => Object.values(body).some((value) => value !== undefined), {
  message: "En az bir alan gönderilmeli.",
});

/** The catalog's media DTO plus what the panel needs: size, GLB part extraction state, uploader, timestamps. */
export const MediaItem = MediaDto.extend({
  bytes: z.number().int().nullable().describe("Depolanan dosyanın boyutu; dış bağlantılı kayıtta boş"),
  partsStatus: z.enum(partsStatuses).describe("3B model parça adı çıkarımı: none, pending, done ya da failed"),
  uploadedBy: z.string().nullable().describe("Yükleyen kullanıcı kimliği; tohum ve içe aktarma kayıtlarında boş"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MediaItem = z.infer<typeof MediaItem>;

export const ListMediaQuery = PageQuery.extend({ kind: z.enum(mediaKinds).optional() });
export const MediaListResponse = pageResponse(MediaItem);

export const FsUploadParams = z.object({ token: z.string().min(1).max(2048) });

/** Payload of the `media.glb-parts` job. */
export const GlbPartsJob = z.object({ mediaId: z.string().min(1) });

/** The error contract of `errors.ts`, documented once for OpenAPI. */
export const ErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())),
    requestId: z.string(),
  }),
});
