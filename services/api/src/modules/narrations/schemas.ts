import { z } from "zod";

export const NarrateBody = z
  .object({
    storyBlockId: z.string().min(1).max(100).optional().describe("Yalnız bu hikâye cümlesi; verilmezse eserin tüm cümleleri"),
  })
  .nullish();

export const NarrateResponse = z.object({
  generated: z.number().int().describe("Bu istekte üretilen kayıt sayısı (yeni ve yenilenen)"),
  skipped: z.number().int().describe("Metni değişmediği için dokunulmayan güncel kayıt sayısı"),
  stale: z.number().int().describe("Metni değiştiği için bayatlamış, bu istekte yenilenip eski dosyası silinen kayıt sayısı (generated içinde sayılır)"),
});

export const TranslateResponse = z.object({
  translated: z.number().int().describe("İngilizcesi boş olduğu için makine çevirisiyle doldurulan hikâye cümlesi sayısı"),
  skipped: z.number().int().describe("Dokunulmayan cümle sayısı: İngilizcesi dolu ya da Türkçesi boş"),
});
