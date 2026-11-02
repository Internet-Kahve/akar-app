import { z } from "zod";

export const NarrateBody = z
  .object({
    storyBlockId: z.string().min(1).max(100).optional().describe("Yalnız bu hikâye cümlesi"),
    partCardId: z.string().min(1).max(100).optional().describe("Yalnız bu 3B parça kartı"),
    aboutChapterId: z.string().min(1).max(100).optional().describe("Yalnız bu «Eser hakkında» bölüm başlığı (yalnız seslendirme)"),
    aboutSectionId: z.string().min(1).max(100).optional().describe("Yalnız bu «Eser hakkında» paragrafı (yalnız seslendirme)"),
  })
  .refine((body) => [body.storyBlockId, body.partCardId, body.aboutChapterId, body.aboutSectionId].filter((id) => id !== undefined).length <= 1, {
    message: "storyBlockId, partCardId, aboutChapterId ve aboutSectionId'den en fazla biri verilebilir. Hiçbiri verilmezse eserin tüm hikâye cümleleri, parça kartları, bölüm başlıkları ve paragrafları.",
  })
  .nullish();

/** The one subject a request is limited to; absent = the whole site. */
export type NarrateTarget = {
  storyBlockId?: string | undefined;
  partCardId?: string | undefined;
  aboutChapterId?: string | undefined;
  aboutSectionId?: string | undefined;
};

export const NarrateResponse = z.object({
  generated: z.number().int().describe("Bu istekte üretilen kayıt sayısı (yeni ve yenilenen)"),
  skipped: z.number().int().describe("Metni değişmediği için dokunulmayan güncel kayıt sayısı"),
  stale: z.number().int().describe("Metni değiştiği için bayatlamış, bu istekte yenilenip eski dosyası silinen kayıt sayısı (generated içinde sayılır)"),
});

export const TranslateResponse = z.object({
  translated: z.number().int().describe("İngilizcesi boş olduğu için makine çevirisiyle doldurulan hikâye cümlesi ve parça kartı sayısı"),
  skipped: z.number().int().describe("Dokunulmayan cümle ya da kart sayısı: İngilizcesi dolu ya da Türkçesi boş"),
});
