import { z } from "zod";
import { cardKinds, publishStatuses, sectionKinds, siteRoles, siteTiers, sourceKinds } from "../../db/schema/index.ts";
import { PageQuery, pageResponse } from "../../platform/pagination.ts";
import { CardDto, KindSchema, SiteDetail, TrustSchema } from "../catalog/schemas.ts";

// ── input building blocks ────────────────────────────────────────────────────

/**
 * Row id. Clients choose the ids of sources, story blocks, sections and archive images (a known id
 * keeps the row stable across saves); everywhere else it references an existing row.
 */
const Id = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "Kimlik harf, rakam, nokta, alt çizgi, iki nokta ve tire içerebilir.");

const text = (max: number) => z.string().trim().max(max);
const nullableText = (max: number) => text(max).nullable();

/** [lng, lat] inside WGS84 bounds. */
export const LngLatInput = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).describe("[boylam, enlem] (WGS84)");

export const CameraPoseInput = z
  .object({
    label: text(60).optional(),
    azimuthDeg: z.number().min(-360).max(360),
    elevationDeg: z.number().min(-90).max(90),
    distanceM: z.number().positive().max(10_000),
  })
  .describe("Kamera açısı: azimut ve yükseklik derece, uzaklık metre");
export type CameraPoseInput = z.infer<typeof CameraPoseInput>;

// ── site: list and detail ────────────────────────────────────────────────────

const issuesField = z
  .array(z.string())
  .describe("Yayın kapısının eksikleri (publicationIssues + tür/konum kuralları), Türkçe; boş = yayına hazır");

export const AdminListSitesQuery = PageQuery.extend({
  status: z.enum(publishStatuses).optional().describe("draft ya da published"),
  city: z.string().trim().min(1).max(60).optional().describe("Şehir kimliği (slug), örn. bursa"),
  query: z.string().trim().max(100).optional().describe("Ad, şehir, ilçe, mimar; büyük/küçük harf ve aksan duyarsız"),
});
export type AdminListSitesInput = z.infer<typeof AdminListSitesQuery>;

export const AdminSiteListItem = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  kind: KindSchema.nullable().describe("Yapı türü (site_types); içe aktarılan taslakta bilinmeyebilir"),
  city: z.object({ id: z.string(), name: z.string() }),
  district: z.string().nullable(),
  status: z.enum(publishStatuses),
  tier: z.enum(siteTiers),
  trust: TrustSchema,
  coordinates: z.tuple([z.number(), z.number()]).nullable().describe("[boylam, enlem]; konumu bulunamayan taslakta null"),
  locationSource: z
    .string()
    .nullable()
    .describe("Konumun kaynağı: seed, manual, osm, overpass, nominatim, nominatim-address; nominatim-street ve nominatim-neighbourhood yaklaşıktır, yayınlanamaz"),
  coverImage: z.object({ id: z.string(), url: z.string(), alt: z.string() }).nullable(),
  issues: issuesField,
  issueCount: z.number().int(),
  updatedAt: z.iso.datetime(),
});
export type AdminSiteListItem = z.infer<typeof AdminSiteListItem>;

export const AdminSiteListResponse = pageResponse(AdminSiteListItem);

/** The public detail, but a draft may lack type and location; plus the editor's bookkeeping. */
export const AdminSiteDetail = SiteDetail.extend({
  kind: KindSchema.nullable().describe("Yapı türü (site_types); yayın için zorunlu"),
  categoryId: z.string().nullable().describe("Vakıf rolü kategorisi; türden gelir"),
  coordinates: z.tuple([z.number(), z.number()]).nullable().describe("[boylam, enlem]; yayın için zorunlu"),
  status: z.enum(publishStatuses),
  dedupeKey: z.string().describe("normalize(ad)|normalize(ilçe); aynı şehirde yinelenen kayıt denetimi"),
  locationSource: z.string().nullable().describe("Konumun kaynağı; PUT .../location 'manual' yapar"),
  importMeta: z.record(z.string(), z.unknown()).nullable().describe("İçe aktarılan envanter satırı (cilt, sayfa, ham tür, ham adres)"),
  modelMediaId: z.string().nullable().describe("Adım 1: eserin bağlı 3B modeli"),
  photoIds: z.array(z.string()).describe("Adım 3: eserin sıralı fotoğrafları (kapak dahil)"),
  sourceLinks: z
    .array(z.object({ sourceId: z.string(), locator: z.string().nullable() }))
    .describe("Eserin sıralı kaynak listesi; locator kaynak içindeki yer (örn. s. 42)"),
  issues: issuesField,
});
export type AdminSiteDetail = z.infer<typeof AdminSiteDetail>;

// ── site: step bodies ────────────────────────────────────────────────────────

/** Adım 2 (Bilgiler). Nullable alanlar `null` ile temizlenir; boş metin de temizler. */
export const SiteInfoShape = {
  name: text(200).min(1).describe("Eser adı (TR)"),
  nameEn: nullableText(200).describe("İngilizce ad"),
  typeId: KindSchema.nullable().describe("Yapı türü kimliği (site_types); yayın için zorunlu"),
  periodId: Id.nullable().describe("Dönem kimliği (periods)"),
  year: text(60).describe("Yapım yılı ya da serbest metin, örn. 1399"),
  architect: text(200),
  patron: nullableText(200).describe("Yaptıran"),
  era: nullableText(100).describe("Serbest metin dönem etiketi"),
  address: nullableText(300),
  role: z.enum(siteRoles).nullable().describe("Vakıf rolü: akar, hayrat ya da both"),
  relatedSiteId: Id.nullable().describe("İlişkili eser"),
  description: text(1000).describe("Kısa tanım (TR); yayın için zorunlu"),
  descriptionEn: nullableText(1000),
  minutes: z.number().int().min(0).max(240).describe("Anlatım süresi, dakika"),
  district: nullableText(100).describe("İlçe ya da tarihî bölge; boş = bilinmiyor"),
  tier: z.enum(siteTiers),
};

const { name: nameField, ...optionalInfoShape } = SiteInfoShape;

export const CreateSiteBody = z
  .object(optionalInfoShape)
  .partial()
  .extend({
    name: nameField,
    city: text(60).min(1).describe("Şehir kimliği (cities), örn. bursa"),
  });
export type CreateSiteInput = z.infer<typeof CreateSiteBody>;

export const SiteInfoBody = z
  .object(SiteInfoShape)
  .partial()
  .refine((body) => Object.values(body).some((v) => v !== undefined), { message: "En az bir alan gönder." });
export type SiteInfoInput = z.infer<typeof SiteInfoBody>;

export const LocationBody = z.object({ coordinates: LngLatInput });
export type LocationInput = z.infer<typeof LocationBody>;

export const ModelBody = z.object({
  mediaId: Id.nullable().describe("kind=model medya; null = modeli kaldır"),
  openingCamera: CameraPoseInput.nullable().optional().describe("Hikâyenin açılış açısı; verilmezse null olur, modelsiz eserde verilemez"),
});
export type ModelInput = z.infer<typeof ModelBody>;

export const SiteMediaBody = z.object({
  photoIds: z.array(Id).max(60).describe("kind=photo medya, gösterim sırasıyla"),
  coverPhotoId: Id.nullable().describe("photoIds içinden biri; kapak fotoğrafı"),
});
export type SiteMediaInput = z.infer<typeof SiteMediaBody>;

const SourceInput = z.object({
  id: Id.optional().describe("Var olan kaynağı günceller; yoksa verilen ya da üretilen kimlikle oluşturur"),
  title: text(300).min(1),
  kind: z.enum(sourceKinds),
  author: text(200).default(""),
  year: text(60).default(""),
  page: text(100).default(""),
  url: text(2000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), { message: "Adres http:// ya da https:// ile başlamalı." })
    .default(""),
  trust: TrustSchema,
  locator: nullableText(100).optional().describe("Kaynak içindeki yer, örn. s. 42 (bu esere özgü)"),
});

export const SiteSourcesBody = z.object({ sources: z.array(SourceInput).max(60).describe("Eserin sıralı kaynak listesi") });
export type SiteSourcesInput = z.infer<typeof SiteSourcesBody>;

const StoryInput = z.object({
  id: Id.optional().describe("Verilirse cümlenin kimliği korunur"),
  title: text(200),
  text: text(2000),
  textEn: nullableText(2000).optional(),
  simple: text(2000).describe("Sade anlatım"),
  trust: TrustSchema,
  photoId: Id.nullable().default(null).describe("kind=photo medya; yayın için zorunlu ve eserin fotoğrafı olmalı"),
  sourceId: Id.nullable().default(null).describe("Eserin kaynak listesinden biri; yayın için zorunlu"),
  showCard: z.boolean().nullable().optional(),
  cardId: Id.nullable().default(null).describe("Paylaşılan kart"),
  camera: CameraPoseInput.nullable().default(null),
  highlights: z.array(text(200).min(1)).max(50).default([]).describe("Eserin 3B modelindeki parça adları"),
  audioMediaId: Id.nullable().default(null).describe("kind=audio medya (TR)"),
  audioEnMediaId: Id.nullable().default(null).describe("kind=audio medya (EN)"),
});

export const StoriesBody = z.object({ blocks: z.array(StoryInput).max(100).describe("Hikâye cümleleri, sırasıyla") });
export type StoriesInput = z.infer<typeof StoriesBody>;

const SectionInput = z.object({
  id: Id.optional(),
  kind: z.enum(sectionKinds),
  title: text(200).min(1),
  body: text(8000),
  bodyEn: nullableText(8000).optional(),
  trust: TrustSchema,
  sourceId: Id.nullable().default(null),
});

export const SectionsBody = z.object({ sections: z.array(SectionInput).max(20).describe("Eser hakkında bölümleri, sırasıyla") });
export type SectionsInput = z.infer<typeof SectionsBody>;

const HistoryImageInput = z.object({
  id: Id.optional().describe("Verilirse görselin kimliği korunur (rota durakları buna bağlanır)"),
  mediaId: Id.describe("kind=photo; eski görsel"),
  presentMediaId: Id.nullable().default(null).describe("kind=photo; aynı açıdan bugünün görüntüsü"),
  caption: text(500).default(""),
  captionEn: nullableText(500).optional(),
  dateLabel: text(100).default(""),
  sourceId: Id.nullable().default(null),
  trust: TrustSchema,
  camera: CameraPoseInput.nullable().default(null),
});

export const HistoryImagesBody = z.object({
  images: z.array(HistoryImageInput).max(30).describe("Geçmişi Gör görselleri, sırasıyla"),
});
export type HistoryImagesInput = z.infer<typeof HistoryImagesBody>;

// ── cards ────────────────────────────────────────────────────────────────────

export const AdminCardDto = CardDto.extend({
  usageCount: z.number().int().describe("Kartı kullanan hikâye cümlesi sayısı; kart değişince hepsi güncellenir"),
  updatedAt: z.iso.datetime(),
});
export type AdminCardDto = z.infer<typeof AdminCardDto>;

export const AdminCardListQuery = PageQuery.extend({
  kind: z.enum(cardKinds).optional(),
});
export type AdminCardListInput = z.infer<typeof AdminCardListQuery>;

export const AdminCardListResponse = pageResponse(AdminCardDto);

const cardShape = {
  kind: z.enum(cardKinds),
  title: text(200).min(1),
  titleEn: nullableText(200),
  body: text(2000),
  bodyEn: nullableText(2000),
  mediaId: Id.describe("kind=photo medya"),
  sourceId: Id.nullable(),
  trust: TrustSchema,
};

export const CreateCardBody = z.object({
  ...cardShape,
  titleEn: cardShape.titleEn.optional(),
  body: cardShape.body.default(""),
  bodyEn: cardShape.bodyEn.optional(),
  sourceId: cardShape.sourceId.default(null),
});
export type CreateCardInput = z.infer<typeof CreateCardBody>;

export const UpdateCardBody = z
  .object(cardShape)
  .partial()
  .refine((body) => Object.values(body).some((v) => v !== undefined), { message: "En az bir alan gönder." });
export type UpdateCardInput = z.infer<typeof UpdateCardBody>;
