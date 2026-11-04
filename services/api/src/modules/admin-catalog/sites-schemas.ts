import { z } from "zod";
import { aboutLimits } from "@akar/domain";
import { cardKinds, historyAngleMatches, publishStatuses, sectionKinds, siteBadgeConditions, siteRoles, siteTiers, sourceKinds } from "../../db/schema/index.ts";
import { PageQuery, pageResponse } from "../../platform/pagination.ts";
import { CardDto, KindSchema, MapPlacementDto, SiteDetail, SiteTaskDto, TrustSchema } from "../catalog/schemas.ts";

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
    target: text(200).nullable().default(null),
    azimuthDeg: z.number().min(-360).max(360),
    elevationDeg: z.number().min(-90).max(90),
    distance: z.number().min(0.05).max(4),
    exact: z.boolean().optional().describe("Panelde elle kondu: kamera tam oraya gelir, önünde duvar olsa da yer değiştirmez"),
  })
  .describe("Kamera açısı: hedef parça (null = modelin ortası), azimut ve yükseklik derece, uzaklık modele göre (1 = bütün model kadrajda)");
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

/**
 * The task as the editor sees it: the public one plus what only staff may read, the answer key and the texts the player
 * only gets after answering (the public detail never carries them, `taskDto`).
 */
export const AdminSiteTaskDto = SiteTaskDto.extend({
  quiz: SiteTaskDto.shape.quiz
    .unwrap()
    .extend({
      correctIndex: z.number().int().nullable().describe("Doğru seçeneğin sırası (0'dan); cevap anahtarı kaydı yoksa null"),
      correctText: z.string().describe("Doğru cevapta gösterilen metin"),
      correctTextEn: z.string().nullable(),
    })
    .optional()
    .describe("Yalnız kind = quiz"),
  field: SiteTaskDto.shape.field
    .unwrap()
    .extend({
      doneText: z.string().describe("Görev tamamlanınca gösterilen metin"),
      doneTextEn: z.string().nullable(),
    })
    .optional()
    .describe("Yalnız kind = field"),
});
export type AdminSiteTaskDto = z.infer<typeof AdminSiteTaskDto>;

/** The public detail, but a draft may lack type and location; plus the editor's bookkeeping. */
export const AdminSiteDetail = SiteDetail.extend({
  tasks: z.array(AdminSiteTaskDto).describe("Eser görevleri, sıralı; cevap anahtarı ve doğru cevap / tamamlama metinleri yalnız bu panel görünümünde"),
  kind: KindSchema.nullable().describe("Yapı türü (site_types); yayın için zorunlu"),
  categoryId: z.string().nullable().describe("Vakıf rolü kategorisi; türden gelir"),
  coordinates: z.tuple([z.number(), z.number()]).nullable().describe("[boylam, enlem]; yayın için zorunlu"),
  status: z.enum(publishStatuses),
  dedupeKey: z.string().describe("normalize(ad)|normalize(ilçe); aynı şehirde yinelenen kayıt denetimi"),
  locationSource: z.string().nullable().describe("Konumun kaynağı; PUT .../location 'manual' yapar"),
  importMeta: z.record(z.string(), z.unknown()).nullable().describe("İçe aktarılan envanter satırı (cilt, sayfa, ham tür, ham adres)"),
  modelMediaId: z.string().nullable().describe("Adım 1: eserin bağlı 3B modeli"),
  mapPlacement: MapPlacementDto.extend({
    lng: z.number().nullable().describe("Yerleşimde konum verilmemişse eserin konumu; o da yoksa null"),
    lat: z.number().nullable().describe("Yerleşimde konum verilmemişse eserin konumu; o da yoksa null"),
    visible: z.boolean().describe("false = kayıtlı ama ziyaretçi haritasında çizilmez"),
    updatedAt: z.iso.datetime(),
  })
    .nullable()
    .describe("Kayıtlı harita yerleşimi; `visible` kapalı olsa da, modeli kaldırılmış eserde de döner. Ziyaretçiye giden hâli `placement`"),
  photoIds: z.array(z.string()).describe("Adım 3: eserin sıralı fotoğrafları (kapak dahil)"),
  sourceLinks: z
    .array(z.object({ sourceId: z.string(), locator: z.string().nullable() }))
    .describe("Eserin sıralı kaynak listesi; locator kaynak içindeki yer (örn. s. 42)"),
  issues: issuesField,
});
export type AdminSiteDetail = z.infer<typeof AdminSiteDetail>;

export const AdminSiteDetailListResponse = pageResponse(AdminSiteDetail);

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
const cityField = text(60).min(1).describe("Şehir kimliği (cities) ya da adı, örn. bursa / Bursa");

export const CreateSiteBody = z
  .object(optionalInfoShape)
  .partial()
  .extend({
    name: nameField,
    city: cityField,
  });
export type CreateSiteInput = z.infer<typeof CreateSiteBody>;

export const SiteInfoBody = z
  .object({
    ...SiteInfoShape,
    city: cityField.describe("Eseri başka şehre taşır; ilçe yeni şehirde aranır, rotalarda durak olan eser taşınamaz"),
  })
  .partial()
  .refine((body) => Object.values(body).some((v) => v !== undefined), { message: "En az bir alan gönder." });
export type SiteInfoInput = z.infer<typeof SiteInfoBody>;

export const LocationBody = z.object({ coordinates: LngLatInput });
export type LocationInput = z.infer<typeof LocationBody>;

const MapPointInput = z.object({ lng: z.number().min(-180).max(180), lat: z.number().min(-90).max(90) });

export const MapPlacementBody = z
  .object({
    lng: z.number().min(-180).max(180).nullable().optional().describe("Modelin boylamı; lat ile birlikte verilir. Yoksa ya da null ise eserin konumu"),
    lat: z.number().min(-90).max(90).nullable().optional().describe("Modelin enlemi; lng ile birlikte verilir"),
    headingDeg: z.number().min(0).lt(360).describe("Kuzeyden saat yönünde derece, 0 ≤ x < 360"),
    frontDeg: z.number().min(0).lt(360).nullable().optional().describe("Ön cephenin (ana girişin) baktığı yön, kuzeyden saat yönünde derece, 0 ≤ x < 360; yoksa ya da null = bilinmiyor"),
    scale: z.number().min(0.1).max(10).describe("0,1–10; 1 = model birimi bir metre"),
    altitudeM: z.number().min(-50).max(200).describe("Zemine oturmuş modelin üstüne eklenen yükseklik, metre"),
    anchorNode: nullableText(200).describe("Taban noktasının hesaplandığı parça adı; null ya da boş = tüm parçalar"),
    hiddenPoints: z.array(MapPointInput).max(50).describe("Elle gizlenen OSM binalarından birer nokta; eserin şehrinde olmalı"),
    keptPoints: z.array(MapPointInput).max(50).describe("Otomatik gizlenip geri istenen OSM binalarından birer nokta; eserin şehrinde olmalı"),
    visible: z.boolean().describe("false = kaydet ama ziyaretçi haritasında gösterme"),
  })
  .superRefine((body, ctx) => {
    if ((body.lng === undefined || body.lng === null) !== (body.lat === undefined || body.lat === null)) {
      ctx.addIssue({ code: "custom", path: [body.lng == null ? "lng" : "lat"], message: "Boylam ve enlem birlikte verilmeli ya da ikisi de boş bırakılmalı." });
    }
  });
export type MapPlacementInput = z.infer<typeof MapPlacementBody>;

export const ModelBody = z.object({
  mediaId: Id.nullable().describe("kind=model medya; null = modeli kaldır"),
  openingCamera: CameraPoseInput.nullable().optional().describe("Hikâyenin açılış açısı; verilmezse null olur, modelsiz eserde verilemez"),
});
export type ModelInput = z.infer<typeof ModelBody>;

export const NightModelBody = z.object({
  mediaId: Id.nullable().describe("kind=model medya, gündüz modeliyle aynı parça adlarıyla; null = gece de gündüz modeli"),
});
export type NightModelInput = z.infer<typeof NightModelBody>;

export const PhotoCameraInput = CameraPoseInput.extend({
  interior: z.boolean().optional().describe("true = bu açıda model açılır, içeriden çekilmiş fotoğraf"),
});
export type PhotoCameraInput = z.infer<typeof PhotoCameraInput>;

export const SiteMediaBody = z.object({
  photoIds: z.array(Id).max(60).describe("kind=photo medya, gösterim sırasıyla"),
  coverPhotoId: Id.nullable().describe("photoIds içinden biri; kapak fotoğrafı"),
  cameras: z
    .record(Id, PhotoCameraInput.nullable())
    .optional()
    .describe("Fotoğraf başına 3B açı (photoIds içinden); null = açıyı sil. Verilmeyen fotoğrafın açısı korunur"),
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
  textEn: nullableText(2000).optional().describe("İngilizce metin; kaydedilen İngilizce metin 'reviewed' (gözden geçirilmiş) olur, değişmediyse önceki durumu korur"),
  simpleEn: nullableText(2000).optional().describe("İngilizce sade anlatım; verilmezse kayıtlı değer ve durumu korunur, null ya da boş metin siler"),
  simple: text(2000).describe("Sade anlatım"),
  trust: TrustSchema,
  photoId: Id.nullable().default(null).describe("kind=photo medya; yayın için zorunlu ve eserin fotoğrafı olmalı"),
  sourceId: Id.nullable().default(null).describe("Eserin kaynak listesinden biri; yayın için zorunlu"),
  showCard: z.boolean().nullable().optional(),
  cardId: Id.nullable().default(null).describe("Paylaşılan kart"),
  camera: CameraPoseInput.nullable().default(null),
  interior: z.boolean().default(false).describe("«İç mekân (3D)»: bu cümlede modelin örtü grupları kalkar"),
  routeOnly: z.boolean().default(false).describe("«Yalnız rotada»: yalnız eser rotadan açılınca okunur"),
  flow: z
    .object({
      fromSiteId: Id,
      toSiteId: Id.nullable(),
      toPoint: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]).nullable(),
      toName: text(200),
      label: text(200),
      source: text(500),
      trust: TrustSchema,
    })
    .nullable()
    .default(null)
    .describe("«Akar akışı»: bu cümlede haritada çizilen gelir yolu"),
  highlights: z.array(text(200).min(1)).max(50).default([]).describe("Eserin 3B modelindeki parça adları"),
});

export const StoriesBody = z.object({ blocks: z.array(StoryInput).max(100).describe("Hikâye cümleleri, sırasıyla") });
export type StoriesInput = z.infer<typeof StoriesBody>;

const SectionInput = z.object({
  id: Id.optional().describe("Verilirse paragrafın kimliği korunur (kitap fotoğrafları ve sesli okuması kalır); yoksa sunucu üretir"),
  kind: z.enum(sectionKinds),
  title: text(aboutLimits.title).min(1),
  titleEn: nullableText(aboutLimits.title).optional().describe("İngilizce başlık; kaydedilen İngilizce metinler 'reviewed' olur, hiçbiri değişmediyse önceki durum korunur; verilmezse kayıtlı değer korunur, null ya da boş metin siler"),
  body: text(aboutLimits.body).min(1),
  bodyEn: nullableText(aboutLimits.body).optional().describe("İngilizce metin; titleEn ile aynı kurallar"),
  trust: TrustSchema,
  sourceId: Id.nullable().default(null),
});

/** The reading texts of a chapter, in Turkish and (item for item) in English. */
const readingShape = {
  summary: z.array(text(1000).min(1)).max(20).describe("Metinden seçilen özet cümleleri"),
  figures: z.array(z.object({ value: text(40).min(1), label: text(120).min(1), evidence: text(500).min(1) })).max(12).describe("Sayı kartları"),
  quotes: z.array(z.object({ text: text(600).min(1), by: nullableText(120).default(null) })).max(10),
  timeline: z.array(z.object({ year: text(40).min(1), evidence: text(500).min(1) })).max(30),
  terms: z.array(z.object({ word: text(120).min(1), definition: text(600).min(1) })).max(40).describe("Dokununca tanımı açılan sözcükler"),
};
const readingLists = Object.keys(readingShape) as (keyof typeof readingShape)[];

const ChapterInput = z
  .object({
    id: Id.optional().describe("Verilirse bölümün kimliği korunur (kamera açısı, sesli okuma ve paragraflar bağlı kalır); yoksa sunucu üretir. Başka eserin bölüm kimliği 409 verir"),
    title: text(aboutLimits.title).min(1),
    titleEn: nullableText(aboutLimits.title).optional().describe("İngilizce başlık; kaydedilen İngilizce metinler 'reviewed' olur, hiçbiri değişmediyse önceki durum korunur; verilmezse kayıtlı değer korunur, null ya da boş metin siler"),
    kind: z.enum(sectionKinds),
    ...readingShape,
    readingEn: z
      .object(readingShape)
      .nullable()
      .optional()
      .describe("Okuma metinlerinin İngilizcesi; her liste Türkçesiyle aynı uzunlukta ve eksiksiz; null siler, verilmezse kayıtlı değer korunur (listelerin uzunluğu hâlâ uyuyorsa). Kamera açısı, iç görünüm ve vurgulu parçalar gönderilmez: sunucuda olduğu gibi kalır"),
    sections: z.array(SectionInput).describe("Bölümün paragrafları, sırasıyla"),
  })
  .superRefine((c, ctx) => {
    if (!c.readingEn) return;
    for (const key of readingLists)
      if (c.readingEn[key].length !== c[key].length)
        ctx.addIssue({ code: "custom", path: ["readingEn", key], message: "İngilizce liste Türkçe ile aynı uzunlukta olmalı." });
  });

export const AboutBody = z
  .object({
    chapters: z.array(ChapterInput).max(aboutLimits.chapters).describe("Eser hakkında bölümleri, sırasıyla; her biri kendi paragraflarıyla; listede olmayan bölüm ve paragraf (kitap fotoğrafları ve sesli okumalarıyla birlikte) silinir"),
    looseSections: z.array(SectionInput).describe("Hiçbir bölüme bağlı olmayan paragraflar, sırasıyla (bölümlerden sonra gösterilir)"),
  })
  .superRefine((body, ctx) => {
    const sections = [...body.chapters.flatMap((c) => c.sections), ...body.looseSections];
    if (sections.length > aboutLimits.paragraphs) ctx.addIssue({ code: "custom", path: ["looseSections"], message: `En çok ${aboutLimits.paragraphs} paragraf gönderilebilir.` });
  });
export type AboutInput = z.infer<typeof AboutBody>;

const HistoryImageInput = z.object({
  id: Id.optional().describe("Verilirse görselin kimliği korunur (rota durakları buna bağlanır)"),
  mediaId: Id.describe("kind=photo; eski görsel"),
  presentMediaId: Id.nullable().default(null).describe("kind=photo; aynı açıdan bugünün görüntüsü"),
  presentAngleMatch: z
    .enum(historyAngleMatches)
    .nullable()
    .default(null)
    .describe("Bugünkü görüntünün açı benzerliği (same = aynı nokta ve yön, near = yakın açı); yalnız presentMediaId varken verilebilir"),
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

const PartCardInput = z.object({
  id: Id.optional().describe("Verilirse kartın kimliği korunur; yoksa sunucu üretir"),
  parts: z.array(text(200).min(1)).min(1).max(50).describe("Kartı açan model parça adları (eserin modelinde olmalı); dokununca hepsi birlikte vurgulanır"),
  title: text(200).min(1),
  body: text(4000),
  titleEn: nullableText(200).optional().describe("İngilizce başlık; kaydedilen İngilizce metin 'reviewed' (gözden geçirilmiş) olur, değişmediyse önceki durumu korur; verilmezse kayıtlı değer ve durumu korunur, null ya da boş metin siler"),
  bodyEn: nullableText(4000).optional().describe("İngilizce metin; titleEn ile aynı kurallar"),
  photoIds: z.array(Id).max(20).default([]).describe("kind=photo medya, şerit sırasıyla (ilki kapak); eserin medya listesinde olmalı"),
  trust: TrustSchema,
  sourceId: Id.nullable().default(null).describe("Eserin kaynaklarından biri"),
});

export const PartCardsBody = z.object({ cards: z.array(PartCardInput).max(100).describe("3B parça kartları, sırasıyla") });
export type PartCardsInput = z.infer<typeof PartCardsBody>;

/** A string array of English texts is either all written or all blank (blank = none); the length must match its Turkish list. */
const englishList = (what: string) => z.array(text(1000)).max(10).nullable().optional().describe(`${what} İngilizcesi, Türkçe liste ile aynı uzunlukta ve sırada; tümü boş ya da null = yok; verilmezse kayıtlı değer korunur`);

const QuizInput = z
  .object({
    options: z.array(text(300).min(1)).min(2).max(6).describe("Seçenekler (2–6); sıraları cevabın yeridir, sırayı değiştirince correctIndex de değişir"),
    optionsEn: englishList("Seçeneklerin"),
    hints: z.array(text(500).min(1)).max(10).default([]).describe("İpuçları, sırayla istendikçe açılır"),
    hintsEn: englishList("İpuçlarının"),
    correctIndex: z.number().int().min(0).describe("Doğru seçeneğin sırası (0'dan); cevap anahtarı, herkese açık yanıtlarda yoktur"),
    correctText: text(1000).default("").describe("Doğru cevapta gösterilen metin"),
    correctTextEn: nullableText(1000).optional(),
    wrongText: text(1000).default("").describe("Yanlış cevapta gösterilen metin"),
    wrongTextEn: nullableText(1000).optional(),
    fromHome: z.boolean().describe("Evden çözülebilir mi"),
  })
  .superRefine((q, ctx) => {
    if (q.correctIndex >= q.options.length) ctx.addIssue({ code: "custom", path: ["correctIndex"], message: "Doğru seçenek, seçeneklerden biri olmalı." });
    for (const [key, list, tr] of [["optionsEn", q.optionsEn, q.options], ["hintsEn", q.hintsEn, q.hints]] as const) {
      if (!list) continue;
      if (list.length !== tr.length) ctx.addIssue({ code: "custom", path: [key], message: "İngilizce liste Türkçe ile aynı uzunlukta olmalı." });
      else if (list.some((s) => !s) && list.some((s) => s)) ctx.addIssue({ code: "custom", path: [key], message: "Her öğenin İngilizcesi yazılmalı ya da hepsi boş bırakılmalı." });
    }
  });

const FieldInput = z.object({
  onSite: z.object({
    text: text(1000).min(1).describe("Yerinde yapılacak görev metni"),
    textEn: nullableText(1000).optional(),
    radiusM: z.number().int().min(10).max(5000).describe("Eserin noktasından en çok bu kadar metre uzakta (konum hassasiyeti payıyla)"),
  }),
  fromHome: z
    .object({
      text: text(1000).min(1),
      textEn: nullableText(1000).optional(),
      part: text(200).min(1).describe("Dokunulacak model parça adı (eserin modelinde olmalı)"),
    })
    .nullable()
    .default(null)
    .describe("Evden karşılığı; null = yalnız yerinde"),
  doneText: text(1000).default("").describe("Görev tamamlanınca gösterilen metin"),
  doneTextEn: nullableText(1000).optional(),
});

const taskBase = {
  id: Id.optional().describe("Verilirse görevin kimliği korunur (oyuncuların tamamlamaları ve rozetleri kalır; rozet buna bağlanır); yoksa sunucu üretir"),
  title: text(200).min(1),
  prompt: text(2000).min(1).describe("Soru ya da görev metni"),
  titleEn: nullableText(200).optional().describe("İngilizce başlık; kaydedilen İngilizce metinler 'reviewed' (gözden geçirilmiş) olur, hiçbiri değişmediyse önceki durum korunur; verilmezse kayıtlı değer korunur, null ya da boş metin siler"),
  promptEn: nullableText(2000).optional().describe("İngilizce soru / görev metni; titleEn ile aynı kurallar"),
  photoId: Id.nullable().default(null).describe("kind=photo medya; eserin medya listesinde olmalı"),
  part: text(200).min(1).nullable().default(null).describe("Görevin konusu olan model parça adı (eserin modelinde olmalı); null = yok"),
  source: nullableText(500).default(null).describe("Kaynak satırı (serbest metin); boş = yok"),
  trust: TrustSchema,
};

const TaskInput = z.discriminatedUnion("kind", [
  z.object({ ...taskBase, kind: z.literal("quiz"), quiz: QuizInput }),
  z.object({ ...taskBase, kind: z.literal("field"), field: FieldInput }),
]);

const BadgeInput = z
  .object({
    id: Id.optional().describe("Verilirse rozetin kimliği korunur (kazanan oyuncular kalır); yoksa sunucu üretir"),
    title: text(200).min(1),
    text: text(1000).min(1),
    titleEn: nullableText(200).optional().describe("İngilizce başlık; kaydedilen İngilizce metinler 'reviewed' olur, değişmediyse önceki durum korunur; verilmezse kayıtlı değer korunur, null ya da boş metin siler"),
    textEn: nullableText(1000).optional().describe("İngilizce metin; titleEn ile aynı kurallar"),
    condition: z.enum(siteBadgeConditions).describe("story = hikâyeyi bitirince, task = taskId görevini yapınca"),
    taskId: Id.nullable().default(null).describe("condition = task ise aynı gövdedeki görevlerden birinin kimliği (görev `id` ile gönderilmiş olmalı); story için null"),
    onSiteLabel: z.boolean().default(false).describe("Yerinde (GPS ile) kazanılınca «Yerinde» etiketi gösterilir"),
  })
  .superRefine((b, ctx) => {
    if ((b.condition === "task") !== (b.taskId !== null)) ctx.addIssue({ code: "custom", path: ["taskId"], message: "Görev rozetinde görev seçilmeli; hikâye rozetinde seçilmemeli." });
  });

export const TasksBody = z.object({
  tasks: z.array(TaskInput).max(50).describe("Eser görevleri, sırasıyla; listede olmayan görev (oyuncu tamamlamalarıyla birlikte) silinir"),
  badges: z.array(BadgeInput).max(50).describe("Eser rozetleri, sırasıyla; listede olmayan rozet (kazananlarla birlikte) silinir"),
});
export type TasksInput = z.infer<typeof TasksBody>;

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
