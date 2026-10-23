import { z } from "zod";
import {
  cardKinds,
  mediaKinds,
  sectionKinds,
  siteRoles,
  siteTiers,
  sourceKinds,
  trustLevels,
} from "../../db/schema/index.ts";
import { PageQuery, pageResponse } from "../../platform/pagination.ts";

/** Site type id from the `site_types` lookup table (e.g. cami, han, turbe). */
export const KindSchema = z.string().min(1).max(40).describe("Yapı türü kimliği (site_types), örn. cami");
export const TrustSchema = z.enum(trustLevels);

export const BboxSchema = z
  .string()
  .describe("minLng,minLat,maxLng,maxLat (WGS84)")
  .transform((value, ctx) => {
    const parts = value.split(",").map((p) => Number(p.trim()));
    const [minLng, minLat, maxLng, maxLat] = parts;
    const valid =
      parts.length === 4 &&
      parts.every(Number.isFinite) &&
      minLng! >= -180 &&
      maxLng! <= 180 &&
      minLat! >= -90 &&
      maxLat! <= 90 &&
      minLng! <= maxLng! &&
      minLat! <= maxLat!;
    if (!valid) {
      ctx.addIssue({ code: "custom", message: "bbox minLng,minLat,maxLng,maxLat biçiminde geçerli bir kutu olmalı." });
      return z.NEVER;
    }
    return [minLng!, minLat!, maxLng!, maxLat!] as [number, number, number, number];
  });

/** Content flags of the `has` filter / `SiteSummary.has`; each one is an EXISTS over the site's content. */
export const contentFlags = ["model", "audio", "history"] as const;
export type ContentFlag = (typeof contentFlags)[number];
const isContentFlag = (value: string): value is ContentFlag => (contentFlags as readonly string[]).includes(value);

export const HasSchema = z
  .string()
  .max(100)
  .describe("Virgülle ayrılmış içerik bayrakları, hepsi sağlanmalı: model (3B model), audio (sesli anlatım), history (geçmiş görselleri)")
  .transform((value, ctx) => {
    const flags = [...new Set(value.split(",").map((f) => f.trim()).filter(Boolean))];
    const unknown = flags.filter((f) => !isContentFlag(f));
    if (unknown.length) {
      ctx.addIssue({
        code: "custom",
        message: `Bilinmeyen içerik bayrağı: ${unknown.join(", ")}. Geçerli değerler: ${contentFlags.join(", ")}.`,
      });
      return z.NEVER;
    }
    return flags.filter(isContentFlag);
  });

export const NearSchema = z
  .string()
  .max(60)
  .describe("boylam,enlem (WGS84); verilirse her eserde distanceMeters döner, sort=distance için zorunludur")
  .transform((value, ctx) => {
    const parts = value.split(",").map((p) => p.trim());
    const [lng, lat] = parts.map(Number);
    const valid =
      parts.length === 2 &&
      parts.every((p) => p !== "") &&
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      Math.abs(lng!) <= 180 &&
      Math.abs(lat!) <= 90;
    if (!valid) {
      ctx.addIssue({ code: "custom", message: "near boylam,enlem biçiminde geçerli bir nokta olmalı." });
      return z.NEVER;
    }
    return [lng!, lat!] as [number, number];
  });

export const siteSorts = ["name", "distance"] as const;

export const ListSitesQuery = PageQuery.extend({
  query: z.string().trim().max(100).optional().describe("Ad, şehir, ilçe, mimar; büyük/küçük harf ve aksan duyarsız"),
  kind: KindSchema.optional(),
  category: z.string().trim().min(1).max(40).optional().describe("Vakıf rolü kategorisi kimliği (role_categories): dini, su, egitim, akar"),
  period: z.string().trim().min(1).max(40).optional().describe("Dönem kimliği (periods), örn. erken-osmanli"),
  has: HasSchema.optional(),
  city: z.string().trim().min(1).max(60).optional().describe("Şehir kimliği (slug), örn. bursa"),
  bbox: BboxSchema.optional(),
  near: NearSchema.optional(),
  sort: z.enum(siteSorts).default("name").describe("name: ada göre (varsayılan); distance: near noktasına yakından uzağa, near zorunlu"),
});

export const IdParams = z.object({ id: z.string().min(1).max(100) });

const Image = z.object({ id: z.string(), url: z.string(), alt: z.string() });

/** Saved 3D camera pose ("Açı"): azimuth/elevation in degrees, distance in metres. */
export const CameraPoseDto = z
  .object({
    label: z.string().optional(),
    azimuthDeg: z.number(),
    elevationDeg: z.number(),
    distanceM: z.number(),
  })
  .describe("Kamera açısı: azimut ve yükseklik derece, uzaklık metre");

export const SiteSummary = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  kind: KindSchema,
  categoryId: z.string().describe("Vakıf rolü kategorisi (role_categories); türden gelir: dini, su, egitim, akar"),
  periodId: z.string().nullable().describe("Dönem kimliği (periods); bilinmiyorsa null"),
  city: z.object({ id: z.string(), name: z.string() }),
  district: z.string().nullable().describe("İlçe; içe aktarılan bazı kayıtlarda bilinmiyor"),
  year: z.string(),
  coordinates: z.tuple([z.number(), z.number()]).describe("[boylam, enlem]"),
  minutes: z.number().int(),
  tier: z.enum(siteTiers),
  trust: TrustSchema,
  description: z.string(),
  coverImage: Image.nullable(),
  sourceCount: z.number().int(),
  has: z
    .object({ model: z.boolean(), audio: z.boolean(), history: z.boolean() })
    .describe("Eserde bulunan içerik: 3B model, sesli anlatım (TR ya da EN), geçmiş görselleri"),
  distanceMeters: z
    .number()
    .int()
    .nullable()
    .describe("Listede near verilmişse eserin o noktaya jeodezik uzaklığı (metre); aksi halde null"),
});
export type SiteSummary = z.infer<typeof SiteSummary>;

export const SiteListResponse = pageResponse(SiteSummary);

export const StoryBlockDto = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  textEn: z.string().nullable(),
  simple: z.string(),
  trust: TrustSchema,
  photoId: z.string().nullable(),
  sourceId: z.string().nullable(),
  showCard: z.boolean().nullable(),
  cardId: z.string().nullable().describe("Cümlede modelin üstünde gösterilen kart (SiteDetail.cards)"),
  camera: CameraPoseDto.nullable().describe("Cümlenin kamera açısı; null = önceki cümlenin açısı korunur"),
  highlights: z.array(z.string()),
  audioMediaId: z.string().nullable().describe("Türkçe ses kaydı (SiteDetail.media, kind=audio)"),
  audioEnMediaId: z.string().nullable().describe("İngilizce ses kaydı (SiteDetail.media, kind=audio)"),
});

export const MediaDto = z.object({
  id: z.string(),
  kind: z.enum(mediaKinds),
  mime: z.string(),
  url: z.string(),
  alt: z.string(),
  title: z.string(),
  titleEn: z.string().nullable(),
  description: z.string(),
  license: z.string(),
  sourceId: z.string().nullable(),
  trust: TrustSchema,
  parts: z.array(z.string()),
});

export const SourceDto = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(sourceKinds),
  author: z.string(),
  year: z.string(),
  page: z.string(),
  url: z.string(),
  trust: TrustSchema,
});

export const SectionDto = z.object({
  id: z.string(),
  kind: z.enum(sectionKinds),
  title: z.string(),
  body: z.string(),
  bodyEn: z.string().nullable(),
  trust: TrustSchema,
  sourceId: z.string().nullable(),
});

export const CardDto = z.object({
  id: z.string(),
  kind: z.enum(cardKinds),
  title: z.string(),
  titleEn: z.string().nullable(),
  body: z.string(),
  bodyEn: z.string().nullable(),
  mediaId: z.string(),
  sourceId: z.string().nullable(),
  trust: TrustSchema,
});

export const HistoryImageDto = z.object({
  id: z.string(),
  mediaId: z.string().describe("Eski görsel"),
  presentMediaId: z.string().nullable().describe("Aynı açıdan bugünün görüntüsü"),
  caption: z.string(),
  captionEn: z.string().nullable(),
  dateLabel: z.string().describe("Kaynaktaki serbest tarih, örn. 1890'lar"),
  sourceId: z.string().nullable(),
  trust: TrustSchema,
  camera: CameraPoseDto.nullable().describe("Bugünün görüntüsüyle hizalama açısı"),
});

export const SiteDetail = SiteSummary.extend({
  descriptionEn: z.string().nullable(),
  architect: z.string(),
  patron: z.string().nullable(),
  era: z.string().nullable(),
  address: z.string().nullable(),
  role: z.enum(siteRoles).nullable(),
  relatedSiteId: z.string().nullable(),
  sourceSummary: z.string().describe("Geriye uyumlu tek satırlık kaynak özeti"),
  editorVersion: z.literal(2).nullable(),
  coverMediaId: z.string().nullable(),
  openingCamera: CameraPoseDto.nullable().describe("3B hikâyenin açılış açısı"),
  updatedAt: z.iso.datetime(),
  stories: z.array(StoryBlockDto),
  sections: z.array(SectionDto).describe("Eser hakkında bölümler (Tarihçe, Mimari, Vakıf ve akar), sıralı"),
  cards: z.array(CardDto).describe("Hikâye cümlelerinin kullandığı kartlar; ilk kullanım sırasıyla, tekrarsız"),
  historyImages: z.array(HistoryImageDto).describe("Geçmişi Gör görselleri, sıralı"),
  photoIds: z.array(z.string()).describe("Eser galerisinin sıralı fotoğraf kimlikleri; kart ve geçmiş ilişkilerinden bağımsız"),
  media: z
    .array(MediaDto)
    .describe("Eserin medya listesi, ardından kapak, hikâye, kart ve geçmiş görsellerinin başvurduğu diğer medya; tekrarsız"),
  sources: z
    .array(SourceDto)
    .describe("Eserin kaynak listesi, ardından hikâye, bölüm, kart, geçmiş görseli ve medyanın başvurduğu diğer kaynaklar; tekrarsız"),
});
export type SiteDetail = z.infer<typeof SiteDetail>;

export const SiteDetailListResponse = pageResponse(SiteDetail);

export const CityDto = z.object({
  id: z.string(),
  name: z.string(),
  siteCount: z.number().int().describe("Yayındaki eser sayısı"),
  routeCount: z.number().int().describe("Yayındaki rota sayısı"),
});
export type CityDto = z.infer<typeof CityDto>;

export const CityListResponse = z.object({ items: z.array(CityDto) });

export const LookupsResponse = z.object({
  siteTypes: z.array(z.object({ id: z.string(), name: z.string(), nameEn: z.string(), categoryId: z.string() })),
  roleCategories: z.array(z.object({ id: z.string(), name: z.string(), nameEn: z.string(), waqfRole: z.enum(siteRoles) })),
  periods: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      nameEn: z.string(),
      startYear: z.number().int().nullable(),
      endYear: z.number().int().nullable(),
    }),
  ),
});
export type LookupsResponse = z.infer<typeof LookupsResponse>;
