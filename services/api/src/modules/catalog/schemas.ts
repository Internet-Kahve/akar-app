import { z } from "zod";
import {
  cardKinds,
  historyAngleMatches,
  mediaKinds,
  sectionKinds,
  siteBadgeConditions,
  siteRoles,
  siteTaskKinds,
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

/** Saved 3D camera pose ("Açı"): around a model part, distance relative to the model's size. */
export const CameraPoseDto = z
  .object({
    label: z.string().optional(),
    target: z.string().nullable().describe("Kameranın baktığı model parçası; null = modelin ortası"),
    azimuthDeg: z.number().describe("0 = kuzeyden bakış, saat yönünde"),
    elevationDeg: z.number(),
    distance: z.number().describe("Modele göre uzaklık: 1 = bütün model kadrajda, 0,5 = yarı uzaklık"),
  })
  .describe("Kamera açısı: hedef parça, azimut ve yükseklik derece, modele göre uzaklık");

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
  displayOrder: z
    .number()
    .int()
    .min(1)
    .nullable()
    .describe("Eserin haritadaki çizim önceliği (eser.json `sira`, §11.48): küçük olan önce çizilir ve etiketlenir; null = sırasız, sıralı eserlerden sonra"),
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
  interior: z.boolean().describe("«İç mekân (3D)»: bu cümlede modelin örtü grupları kalkar"),
  routeOnly: z.boolean().describe("«Yalnız rotada»: yalnız eser rotadan açılınca okunur"),
  flow: z
    .object({
      fromSiteId: z.string(),
      toSiteId: z.string().nullable(),
      toPoint: z.tuple([z.number(), z.number()]).nullable().describe("Uygulamada eser olmayan hedefin [boylam, enlem] konumu"),
      toName: z.string(),
      label: z.string(),
      source: z.string(),
      trust: TrustSchema,
    })
    .nullable()
    .describe("«Akar akışı»: bu cümlede haritada çizilen gelir yolu"),
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
  triangles: z.number().int().nullable().describe("3B modelin üçgen sayısı (GLB'nin JSON bölümünden sayılır); model olmayan ya da henüz sayılmamış kayıtta null"),
  coverGroups: z
    .array(z.array(z.string()))
    .describe("«İçini göster»: yukarıdan aşağı kalkan parça grupları, ilk grup önce kalkar; boş = düğme yok (yalnız kind=model)"),
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

export const SectionPhotoDto = z.object({
  mediaId: z.string().describe("Fotoğraf (SiteDetail.media, kind=photo)"),
  aspect: z.number().nullable().describe("Fotoğrafın kitaptaki en/boy oranı; bilinmiyorsa null"),
  alt: z.string(),
});
export type SectionPhotoDto = z.infer<typeof SectionPhotoDto>;

export const ChapterDto = z
  .object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(sectionKinds),
    summary: z.array(z.string()).describe("Bölümün metninden seçilmiş özet cümleleri, kelimesi kelimesine"),
    figures: z
      .array(z.object({ value: z.string(), label: z.string(), evidence: z.string().describe("Metinde geçen ifade") }))
      .describe("Rakam kartları"),
    quotes: z.array(z.object({ text: z.string(), by: z.string().nullable() })).describe("Büyük alıntılar; by = söyleyen, bilinmiyorsa null"),
    timeline: z.array(z.object({ year: z.string(), evidence: z.string().describe("Metinde geçen ifade") })).describe("Zaman çizelgesi"),
    terms: z
      .array(z.object({ word: z.string(), definition: z.string() }))
      .describe("Bölüm metninde geçen, dokununca tanımı açılan terimler"),
    camera: CameraPoseDto.nullable().describe("Bölüm okunurken masaüstünde 3B modelin açısı; null = model olduğu gibi kalır"),
    interior: z.boolean().describe("Bölüm okunurken modelin örtü grupları kalkar"),
    focusParts: z.array(z.string()).describe("Bölüm okunurken vurgulanan model parçaları; boş = bütün yapı"),
  })
  .describe("«Eser hakkında» okuma bölümü; metni SiteDetail.sections içinde chapterId ile ona bağlıdır");
export type ChapterDto = z.infer<typeof ChapterDto>;

export const SectionDto = z.object({
  id: z.string(),
  kind: z.enum(sectionKinds),
  title: z.string(),
  body: z.string(),
  bodyEn: z.string().nullable(),
  trust: TrustSchema,
  sourceId: z.string().nullable(),
  chapterId: z.string().nullable().describe("Paragrafın ait olduğu okuma bölümü (SiteDetail.chapters); null = hiçbir bölüme bağlı değil"),
  photos: z.array(SectionPhotoDto).describe("Paragrafın arkasında gösterilen kitap fotoğrafları, sıralı; galeriye girmez"),
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
  viewpoint: z
    .object({ lng: z.number(), lat: z.number(), bearingDeg: z.number(), fieldDeg: z.number(), interior: z.boolean() })
    .nullable()
    .describe("Çekim noktası ve görüş konisi; null = bilinmiyor"),
  presentAngleMatch: z
    .enum(historyAngleMatches)
    .nullable()
    .describe("Bugünkü görüntünün eskisiyle açı benzerliği: same = aynı nokta ve yön, near = yakın açı (birebir aynı noktadan çekilmedi); bugünkü görüntü yoksa null"),
});

export const SampleTraceDto = z
  .object({
    id: z.string(),
    author: z.string().describe("Ekibin yazdığı katkı sahibi adı, örn. «AKAR ekibi»; bir hesap değildir"),
    text: z.string(),
    mediaId: z.string().describe("Fotoğraf (SiteDetail.media); kaynak satırı ve lisansı medyanın description ve license alanlarındadır"),
    historyImageId: z.string().nullable().describe("Aynı görünümü gösterdiği eski görsel (SiteDetail.historyImages); yoksa null"),
    angleMatch: z
      .enum(historyAngleMatches)
      .nullable()
      .describe("Eski görselle açı benzerliği: same = aynı nokta ve yön, near = yakın açı; historyImageId yoksa genellikle null"),
    addedOn: z.string().describe("Eklendiği gün, YYYY-MM-DD; eski görselin bugünkü fotoğrafı yoksa en yenisi onun yerine geçer"),
  })
  .describe(
    "İz Bırak örneği (§11.47): ekibin hazırladığı örnek katkı; ziyaretçi anısı değildir (moderasyon, kota ve puanla ilgisi yok), arayüzde «Örnek» etiketiyle gösterilir",
  );
export type SampleTraceDto = z.infer<typeof SampleTraceDto>;

export const PartCardDto = z.object({
  id: z.string(),
  parts: z.array(z.string()).describe("Kartı açan model parça adları; dokununca hepsi birlikte vurgulanır"),
  title: z.string(),
  body: z.string(),
  photoIds: z.array(z.string()).describe("Kartın fotoğraf şeridi, sıralı; ilki kapak (SiteDetail.media)"),
  sourceId: z.string().nullable(),
  trust: TrustSchema,
});

export const SiteTaskDto = z
  .object({
    id: z.string(),
    kind: z.enum(siteTaskKinds).describe("quiz = soru, field = saha görevi"),
    title: z.string(),
    prompt: z.string().describe("Soru ya da görev metni"),
    photoId: z.string().nullable().describe("Görevin fotoğrafı: eserin fotoğraflarından biri (SiteDetail.photoIds / media); yoksa null"),
    part: z.string().nullable().describe("Görevin konusu olan model parça adı; yoksa null"),
    source: z.string().nullable().describe("Kaynak satırı (serbest metin, örn. «E cilt-1 PDF s.27»); yoksa null"),
    trust: TrustSchema,
    quiz: z
      .object({
        options: z.array(z.string()).describe("Seçenekler (2–6), cevap anahtarı yok; /v1/site-tasks/:id/answer ile sunucuda denetlenir"),
        hints: z.array(z.string()).describe("İpuçları, sırayla istendikçe açılır"),
        wrongText: z.string().describe("Yanlış cevapta gösterilen metin"),
        fromHome: z.boolean().describe("Evden çözülebilir mi"),
      })
      .optional()
      .describe("Yalnız kind = quiz. Doğru cevap metni (correctText) yoktur: yalnız doğru cevapta yanıtla gelir"),
    field: z
      .object({
        onSite: z.object({ text: z.string(), radiusM: z.number().int().describe("Eserin noktasından en çok bu kadar metre uzakta (konum hassasiyeti payıyla)") }),
        fromHome: z.object({ text: z.string(), part: z.string().describe("Dokunulacak model parça adı") }).nullable().describe("Evden karşılığı; yoksa null"),
      })
      .optional()
      .describe("Yalnız kind = field. Tamamlama metni (doneText) yoktur: yalnız tamamlanınca yanıtla gelir"),
  })
  .describe("Eser görevi (soru ya da saha görevi). Puan, süre ve yanlış cevap cezası yoktur");
export type SiteTaskDto = z.infer<typeof SiteTaskDto>;

export const SiteBadgeDto = z
  .object({
    id: z.string(),
    title: z.string(),
    text: z.string(),
    condition: z.enum(siteBadgeConditions).describe("story = hikâyeyi bitirince, task = taskId görevini yapınca"),
    taskId: z.string().nullable().describe("condition = task ise görevin kimliği (SiteDetail.tasks), yoksa null"),
    onSiteLabel: z.boolean().describe("Yerinde (GPS ile) kazanılınca «Yerinde» etiketi gösterilir"),
  })
  .describe("Eser rozeti. Rozet kaydı yalnız üyeye tutulur; puanla ilgisi yoktur");
export type SiteBadgeDto = z.infer<typeof SiteBadgeDto>;

export const MapPointDto = z.object({ lng: z.number(), lat: z.number() });

export const MapPlacementDto = z.object({
  lng: z.number().describe("Modelin boylamı; yerleşimde konum verilmemişse eserin konumu"),
  lat: z.number().describe("Modelin enlemi; yerleşimde konum verilmemişse eserin konumu"),
  headingDeg: z.number().describe("Kuzeyden saat yönünde derece, 0 ≤ x < 360"),
  scale: z.number().describe("0,1–10; 1 = model birimi bir metre"),
  altitudeM: z.number().describe("Modelin zemine oturmuş hâlinin üstüne eklenen yükseklik, metre (−50–200)"),
  anchorNode: z.string().nullable().describe("Taban noktasının hesaplandığı modeldeki parça adı; null = presentasyon parçaları dışındaki tüm parçalar"),
  hiddenPoints: z.array(MapPointDto).describe("Elle gizlenen OSM binalarından birer nokta (en çok 50)"),
  keptPoints: z.array(MapPointDto).describe("Otomatik gizlenip geri istenen OSM binalarından birer nokta (en çok 50)"),
});
export type MapPlacementDto = z.infer<typeof MapPlacementDto>;

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
  aboutCoverMediaId: z.string().nullable().describe("«Eser hakkında» sayfasının kapak fotoğrafı (SiteDetail.media); null = galerinin kapağı"),
  openingCamera: CameraPoseDto.nullable().describe("3B hikâyenin açılış açısı"),
  updatedAt: z.iso.datetime(),
  stories: z.array(StoryBlockDto),
  sections: z.array(SectionDto).describe("Eser hakkında paragraflar (Tarihçe, Mimari, Vakıf ve akar), sıralı"),
  chapters: z.array(ChapterDto).describe("Eser hakkında okuma bölümleri, sıralı; boş = paragraflar başlıklarıyla düz gösterilir"),
  cards: z.array(CardDto).describe("Hikâye cümlelerinin kullandığı kartlar; ilk kullanım sırasıyla, tekrarsız"),
  historyImages: z.array(HistoryImageDto).describe("Geçmişi Gör görselleri, sıralı"),
  sampleTraces: z.array(SampleTraceDto).describe("İz Bırak örnekleri, sıralı; boş = örnek yok (§11.47)"),
  partCards: z
    .array(PartCardDto)
    .describe("3B parça kartları, sıralı. Kart varsa yalnız kartı olan parçalar tıklanır; boşsa her parça adıyla tıklanır"),
  tasks: z.array(SiteTaskDto).describe("Eser görevleri, sıralı; boş = görev yok"),
  badges: z.array(SiteBadgeDto).describe("Eser rozetleri, sıralı"),
  placement: MapPlacementDto.nullable().describe(
    "Modelin haritadaki yerleşimi. Eserin modeli varsa ve yerleşim gösterilmek üzere kaydedilmişse dolu; aksi halde null (alan hiçbir zaman eksik olmaz)",
  ),
  photoIds: z.array(z.string()).describe("Eser galerisinin sıralı fotoğraf kimlikleri; kart ve geçmiş ilişkilerinden bağımsız"),
  media: z
    .array(MediaDto)
    .describe("Eserin medya listesi, ardından kapak, hakkında kapağı, hikâye, kart, parça kartı, görev, paragraf fotoğrafı, geçmiş görseli (ve bugünkü eşi) ve örnek izlerin başvurduğu diğer medya; tekrarsız"),
  sources: z
    .array(SourceDto)
    .describe("Eserin kaynak listesi, ardından hikâye, bölüm, kart, parça kartı, geçmiş görseli ve medyanın başvurduğu diğer kaynaklar; tekrarsız"),
});
export type SiteDetail = z.infer<typeof SiteDetail>;

export const SiteDetailListResponse = pageResponse(SiteDetail);

export const CitySceneDto = z
  .object({
    light: z.object({
      ambient: z.number().describe("Ortam (yarıküre) ışığı"),
      sun: z.number().describe("Güneş ışığı"),
      fill: z.number().describe("Karşı (dolgu) ışık"),
      azimuthDeg: z.number().describe("Güneş yönü, kuzeyden saat yönünde derece"),
      elevationDeg: z.number().describe("Güneşin ufuktan yüksekliği, derece"),
      saturation: z.number().describe("Malzeme renklerinin doygunluk çarpanı"),
      groundShadow: z.number().describe("Modelin altındaki yumuşak yer gölgesinin opaklığı (0 = yok)"),
    }),
    backgroundTop: z.string().describe("Eser 3B sahnesi zemini, üst renk (#RRGGBB)"),
    backgroundBottom: z.string().describe("Eser 3B sahnesi zemini, alt renk (#RRGGBB)"),
  })
  .describe("Haritadaki ve eser sayfasındaki 3B modellerin ışığı ve sahne zemini (§11.42)");

export const CityIdentityDto = z
  .object({
    accent: z.string().describe("Şehrin rengi (#RRGGBB; veri/sehir kimlik.zemin): açılış ekranında şehir adı, açık zeminde desen"),
    pattern: z.string().describe("Desen karosunun dosya adı (kimlik.desen), web uygulamasının /desenler/ klasöründe; örn. desen-bursa-sekiz-yildiz.svg"),
    patternColour: z.string().describe("Desenin şehir renginin üstündeki rengi (#RRGGBB; kimlik.desen_renk)"),
  })
  .describe("Açılış ekranının ve 3B yükleme kartının şehirden aldığı görünüm (§11.49)");

export const CityDto = z.object({
  id: z.string(),
  name: z.string(),
  siteCount: z.number().int().describe("Yayındaki eser sayısı"),
  routeCount: z.number().int().describe("Yayındaki rota sayısı"),
  scene: CitySceneDto.nullable().describe("null = istemci varsayılan ışığı ve zemini kullanır"),
  identity: CityIdentityDto.nullable().describe("null = açılış ekranı ve yükleme kartı şehir rengi ve deseni olmadan, nötr çizilir"),
  isDefault: z.boolean().describe("Harita bu şehirde açılır (en çok bir şehir)"),
  map: z
    .object({
      center: z.tuple([z.number(), z.number()]).describe("[boylam, enlem]"),
      zoom: z.number(),
      zoomDesktop: z.number().nullable().describe("Geniş ekranda açılış yakınlığı; null = zoom"),
    })
    .nullable()
    .describe("Haritanın bu şehirde açıldığı nokta, küre görünümündeki şehir işareti; null = kürede yok (§11.45)"),
  inventory: z
    .object({
      name: z.string().nullable(),
      publisher: z.string().nullable(),
      year: z.number().int().nullable(),
      siteCount: z.number().int().nullable().describe("Envanterde belgelenen eser sayısı (uygulamadaki değil)"),
    })
    .nullable()
    .describe("Şehrin Vakıf Eserleri Envanteri; eseri olmayan şehirde «Yakında» bilgisi"),
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
