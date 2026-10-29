import { z } from "zod";
import { SiteBadgeDto } from "../catalog/schemas.ts";

export const TaskIdParams = z.object({ id: z.string().min(1).max(100) });

export const AnswerBody = z.object({
  choice: z.number().int().min(0).max(20).describe("Seçilen seçeneğin indeksi (0'dan başlar); seçenek sayısını aşarsa 400"),
});

export const AnswerResponse = z.object({
  correct: z.boolean(),
  correctText: z.string().nullable().describe("Doğru cevap metni; yalnız doğru cevapta, yoksa null"),
  wrongText: z.string().nullable().describe("Yanlış cevap metni; yalnız yanlış cevapta, yoksa null. Yanlış cevabın cezası yoktur, tekrar denenebilir"),
  earnedBadges: z.array(SiteBadgeDto).describe("Bu istekle yeni kazanılan rozetler; misafirde ve tekrarda boş"),
});

export const CompleteBody = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("onSite"),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracyM: z.number().min(0).optional().describe("Cihazın bildirdiği konum hassasiyeti (metre); 100'den büyükse 422, yoksa 0 sayılır"),
  }),
  z.object({ mode: z.literal("fromHome"), part: z.string().min(1).max(200).describe("Dokunulan 3B model parça adı") }),
]);

export const CompleteResponse = z.object({
  doneText: z.string().describe("Görev tamamlanınca gösterilen metin"),
  onSite: z.boolean().describe("Yerinde (GPS ile) mi tamamlandı"),
  earnedBadges: z.array(SiteBadgeDto).describe("Bu istekle yeni kazanılan rozetler; misafirde ve tekrarda boş"),
});

export const SiteProgressResponse = z.object({
  tasks: z.array(z.object({ taskId: z.string(), siteId: z.string(), onSite: z.boolean(), completedAt: z.iso.datetime() })),
  badges: z.array(z.object({ badgeId: z.string(), siteId: z.string(), onSite: z.boolean(), earnedAt: z.iso.datetime() })),
});
export type SiteProgressResponse = z.infer<typeof SiteProgressResponse>;
