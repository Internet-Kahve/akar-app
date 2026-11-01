import { z } from "zod";

export const NarrateBody = z
  .object({
    storyBlockId: z.string().min(1).max(100).optional().describe("Yalnız bu hikâye cümlesi; partCardId ile birlikte verilemez"),
    partCardId: z.string().min(1).max(100).optional().describe("Yalnız bu 3B parça kartı; storyBlockId ile birlikte verilemez. İkisi de verilmezse eserin tüm hikâye cümleleri ve parça kartları"),
  })
  .refine((body) => !(body.storyBlockId !== undefined && body.partCardId !== undefined), { message: "storyBlockId ve partCardId birlikte verilemez.", path: ["partCardId"] })
  .nullish();

/** The one subject a request is limited to; absent = the whole site (stories and part cards). */
export type NarrateTarget = { storyBlockId?: string | undefined; partCardId?: string | undefined };

export const NarrateResponse = z.object({
  generated: z.number().int().describe("Bu istekte üretilen kayıt sayısı (yeni ve yenilenen)"),
  skipped: z.number().int().describe("Metni değişmediği için dokunulmayan güncel kayıt sayısı"),
  stale: z.number().int().describe("Metni değiştiği için bayatlamış, bu istekte yenilenip eski dosyası silinen kayıt sayısı (generated içinde sayılır)"),
});

export const TranslateResponse = z.object({
  translated: z.number().int().describe("İngilizcesi boş olduğu için makine çevirisiyle doldurulan hikâye cümlesi ve parça kartı sayısı"),
  skipped: z.number().int().describe("Dokunulmayan cümle ya da kart sayısı: İngilizcesi dolu ya da Türkçesi boş"),
});
