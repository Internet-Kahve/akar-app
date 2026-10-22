import { z } from "zod";
import { SiteDetail, SiteSummary } from "../catalog/schemas.ts";

export const ListRoutesQuery = z.object({
  city: z.string().trim().min(1).max(60).optional().describe("Şehir kimliği (slug), örn. bursa"),
});

export const RouteStop = z.object({
  position: z.number().int().describe("Duraktaki sıra, 0'dan başlar"),
  site: SiteSummary,
  quizId: z.string().nullable().describe("Durağın bulmacası; bulmacanın eseri yayında değilse null"),
  historyImageId: z.string().nullable().describe("Durağın \"Geçmişi Gör\" görseli"),
});

export const RouteBadge = z.object({
  title: z.string(),
  mediaId: z.string().nullable().describe("Rozet görselinin medya kimliği"),
  url: z.string().nullable().describe("Rozet görselinin adresi; görsel tanımlı değilse null"),
  alt: z.string().nullable().describe("Rozet görselinin alternatif metni; görsel tanımlı değilse null"),
});

export const RouteDto = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  description: z.string(),
  city: z.object({ id: z.string(), name: z.string() }),
  minutes: z.number().int().describe("Hesaplanır: yürüme (4,5 km/sa) + durakların anlatım süresi"),
  distance: z.string().describe("Hesaplanır: yayındaki durak zincirinin uzunluğu, örn. 1,2 km"),
  distanceMeters: z.number().int(),
  theme: z.string(),
  badge: RouteBadge.nullable().describe("Rotayı bitirene verilen rozet; tanımlı değilse null"),
  stops: z.array(RouteStop).describe("Yalnızca yayındaki eserler, sıralı"),
});
export type RouteDto = z.infer<typeof RouteDto>;

export const RouteListResponse = z.object({ items: z.array(RouteDto) });

/** Mirrors `PlayableQuiz` (quizzes.ts): the public quiz shape, never the answer key. */
export const PlayableQuizDto = z.object({
  id: z.string(),
  siteId: z.string(),
  question: z.string(),
  questionEn: z.string().nullable(),
  options: z.array(z.string()).describe("Üç şık; doğru şıkkın indeksi hiçbir yanıtta yer almaz"),
  optionsEn: z.array(z.string()).nullable(),
  hint: z.string().nullable(),
});

export const RouteBundle = z.object({
  route: RouteDto,
  sites: z.array(SiteDetail).describe("Rotanın yayındaki durak eserleri, durak sırasıyla"),
  quizzes: z.array(PlayableQuizDto).describe("Durakların oynanabilir bulmacaları, durak sırasıyla; cevapsız"),
  assets: z.array(z.string()).describe("Çevrimdışı önbelleğe alınacak medya adresleri: eserlerin tüm medyası ve rozet, tekrarsız"),
});
export type RouteBundle = z.infer<typeof RouteBundle>;
