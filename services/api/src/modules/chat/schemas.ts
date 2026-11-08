import { z } from "zod";

export const MAX_MESSAGE_CHARS = 500;
export const MAX_HISTORY_TURNS = 10;
export const MAX_TURN_CHARS = 2000;

export const ChatRequest = z.object({
  message: z
    .string()
    .trim()
    .min(1)
    .max(MAX_MESSAGE_CHARS)
    .describe("Kullanıcının sorusu"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().trim().min(1).max(MAX_TURN_CHARS),
      }),
    )
    .max(MAX_HISTORY_TURNS)
    .default([])
    .describe(
      "Önceki mesajlar, eskiden yeniye; sunucu sohbet saklamaz, bağlamı istemci yollar",
    ),
  siteId: z
    .string()
    .min(1)
    .max(120)
    .optional()
    .describe(
      "Kullanıcı bir eser sayfasındaysa o eser; yoksa yayındaki eserlerin soruyla ilgili ayrıntıları kullanılır",
    ),
  lang: z.enum(["tr", "en"]).default("tr").describe("Yanıt dili"),
});
export type ChatRequest = z.infer<typeof ChatRequest>;

export const ChatSource = z.object({
  kind: z
    .enum([
      "site",
      "story",
      "about",
      "part_card",
      "inventory",
      "card",
      "history",
      "web",
    ])
    .describe(
      "Eser içeriği, envanter kaydı veya arama sağlayıcısının doğruladığı web kaynağı",
    ),
  siteId: z.string().nullable(),
  title: z
    .string()
    .describe("Gösterilecek etiket: eser adı, paragraf ya da kart başlığı"),
  source: z
    .object({ title: z.string(), page: z.string(), url: z.url().optional() })
    .nullable()
    .describe("Bloğun bağlı olduğu kaynak (eser, sayfa); yoksa null"),
  url: z
    .url()
    .optional()
    .describe(
      "Web kaynağının HTTPS bağlantısı; model metninden değil arama metaverisinden gelir",
    ),
});
export type ChatSource = z.infer<typeof ChatSource>;

export const ChatResponse = z.object({
  answer: z.string(),
  sources: z
    .array(ChatSource)
    .describe("Yanıtın dayandığı yerel içerikler ve web kaynakları, tekrarsız"),
  general: z
    .boolean()
    .describe(
      "true = yanıt içeriğimizin dışında genel bilgiye de dayanıyor; istemci «genel bilgi» diye işaretler",
    ),
  searchSuggestions: z
    .string()
    .max(50_000)
    .optional()
    .describe(
      "Google arama önerileri HTML; yalnız yalıtılmış, scriptsiz iframe içinde gösterilir",
    ),
  webUnavailable: z
    .boolean()
    .optional()
    .describe("Yerel yanıt hazır fakat ek web doğrulaması başarısız oldu"),
});
export type ChatResponse = z.infer<typeof ChatResponse>;
