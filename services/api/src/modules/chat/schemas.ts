import { z } from "zod";

export const MAX_MESSAGE_CHARS = 500;
export const MAX_HISTORY_TURNS = 10;
export const MAX_TURN_CHARS = 2000;

export const ChatRequest = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS).describe("Kullanıcının sorusu"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().trim().min(1).max(MAX_TURN_CHARS) }))
    .max(MAX_HISTORY_TURNS)
    .default([])
    .describe("Önceki mesajlar, eskiden yeniye; sunucu sohbet saklamaz, bağlamı istemci yollar"),
  siteId: z.string().min(1).max(120).optional().describe("Kullanıcı bir eser sayfasındaysa o eser; yoksa yayındaki eserlerin özeti kullanılır"),
  lang: z.enum(["tr", "en"]).default("tr").describe("Yanıt dili"),
});
export type ChatRequest = z.infer<typeof ChatRequest>;

export const ChatSource = z.object({
  kind: z.enum(["site", "story", "about", "part_card"]).describe("site = eser tanıtımı, story = hikâye cümlesi, about = «Eser hakkında» paragrafı, part_card = 3B parça kartı"),
  siteId: z.string(),
  title: z.string().describe("Gösterilecek etiket: eser adı, paragraf ya da kart başlığı"),
  source: z.object({ title: z.string(), page: z.string() }).nullable().describe("Bloğun bağlı olduğu kaynak (eser, sayfa); yoksa null"),
});
export type ChatSource = z.infer<typeof ChatSource>;

export const ChatResponse = z.object({
  answer: z.string(),
  sources: z.array(ChatSource).describe("Yanıtın dayandığı içerik blokları, tekrarsız, en fazla 5"),
  general: z.boolean().describe("true = yanıt içeriğimizin dışında genel bilgiye de dayanıyor; istemci «genel bilgi» diye işaretler"),
});
export type ChatResponse = z.infer<typeof ChatResponse>;
