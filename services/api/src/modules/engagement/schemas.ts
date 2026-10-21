import { z } from "zod";
import { pageResponse } from "../../platform/pagination.ts";
import { SiteSummary, TrustSchema } from "../catalog/schemas.ts";
import { PlayableQuizDto } from "../routes/schemas.ts";
import { RECEIPT_ACTIONS, RECEIPT_REJECTIONS } from "./receipts.ts";

const IsoTime = z.iso.datetime();

export const SiteIdParams = z.object({ siteId: z.string().min(1).max(100) });

/** Guest identity: a UUID the client generates once and keeps on the device. */
export const DeviceId = z.guid();

export const DeviceHeaders = z.object({
  "x-device-id": DeviceId.optional().describe(
    "Misafir kimliği: istemcinin ürettiği cihaz UUID'si. Oturum açmamış isteklerde zorunlu, oturumlu isteklerde yok sayılır.",
  ),
});

// ── saved ────────────────────────────────────────────────────────────────────

export const SavedState = z.object({
  siteId: z.string(),
  saved: z.boolean().describe("İstekten sonraki durum: PUT true, DELETE false"),
});

export const SavedListResponse = pageResponse(SiteSummary);

// ── progress ─────────────────────────────────────────────────────────────────

export const ProgressBody = z.object({
  lastBlock: z
    .number()
    .int()
    .min(0)
    .describe("Ulaşılan hikâye bloğu (0'dan başlar). Kayıtlı değerden küçükse yok sayılır; hikâyenin uzunluğunu aşamaz"),
});

export const ProgressEntry = z.object({
  siteId: z.string(),
  lastBlock: z.number().int().describe("Ulaşılan en uzak blok, 0'dan başlar; “Devam et · 5/9” için lastBlock + 1 / total"),
  total: z.number().int().describe("Hikâyedeki blok sayısı"),
  completed: z.boolean().describe("Hikâye tamamlandı (POST /v1/stories/:siteId/complete)"),
  updatedAt: IsoTime,
});
export type ProgressEntry = z.infer<typeof ProgressEntry>;

export const ProgressItem = ProgressEntry.extend({ site: SiteSummary });
export const ProgressListResponse = pageResponse(ProgressItem);

// ── stories ──────────────────────────────────────────────────────────────────

export const CompleteResponse = z.object({
  awarded: z.number().int().describe("Bu istekle eklenen puan; tekrarında ve misafirde 0 (misafirin puanı makbuzla hesaba geçer)"),
  receipt: z.string().optional().describe("Yalnız misafire: girişte POST /v1/me/receipts ile bozdurulur"),
});

// ── quizzes ──────────────────────────────────────────────────────────────────

/** The public quiz plus this player's state. Built from `PlayableQuiz`: the answer key is not part of it. */
export const QuizState = PlayableQuizDto.extend({
  hint: z.string().nullable().describe("İpucu metni; yalnız bu oyuncu en az bir yanlış cevap verdiyse ve bulmacada ipucu varsa dolu"),
  hintAvailable: z.boolean().describe("İpucu bu oyuncuya açıldı; true iken hint doludur"),
  revealed: z.boolean().describe("Oyuncu “Cevabı göster”e bastı; bu bulmacadan artık puan alamaz"),
  solved: z.boolean().describe("Oyuncu doğru cevabı verdi"),
});

export const SubmitBody = z.object({
  choice: z.number().int().min(0).max(2).describe("Seçilen şıkkın indeksi (0–2)"),
});

export const SubmitResponse = z.object({
  correct: z.boolean(),
  awarded: z
    .number()
    .int()
    .describe("Bu istekle eklenen puan; yanlış cevapta, tekrarda, cevap gösterildikten sonra ve misafirde 0"),
  hint: z.string().optional().describe("Yalnız yanlış cevaptan sonra ve bulmacada ipucu varsa"),
  receipt: z.string().optional().describe("Yalnız misafire ve puan kazandıran ilk doğru cevapta"),
  explanation: z
    .object({
      text: z.string(),
      sourceId: z.string().nullable(),
      trust: TrustSchema,
    })
    .optional()
    .describe("Yalnız doğru cevapta; kaynağı ve güven etiketiyle"),
});

export const RevealResponse = z.object({
  correctOption: z.string().describe("Doğru şıkkın metni. Doğru cevap yalnız bu uçta, oyuncu istediğinde gönderilir"),
});

// ── visits ───────────────────────────────────────────────────────────────────

export const VerifyVisitBody = z.object({
  siteId: z.string().min(1).max(100),
  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .describe("[boylam, enlem] (WGS84). Yalnız bu istekte doğrulama için kullanılır; saklanmaz, loglanmaz, yanıtta dönmez"),
  accuracyM: z.number().min(0).describe("Cihazın bildirdiği konum hassasiyeti (metre); 100'den büyükse 422"),
});

export const VerifyVisitResponse = z.object({
  verified: z.boolean(),
  distanceBand: z
    .enum(["near", "far"])
    .describe("near: esere doğrulama yarıçapı içinde (hassasiyet payı düşüldükten sonra), far: dışında. Tam mesafe verilmez"),
  awarded: z.number().int().describe("Bu istekle eklenen puan; tekrar ziyarette ve misafirde 0"),
  receipt: z.string().optional().describe("Yalnız misafire ve doğrulanan ziyarette"),
});

// ── receipts ─────────────────────────────────────────────────────────────────

export const ReceiptsBody = z.object({
  receipts: z.array(z.string().max(4096)).max(100).describe("Misafirken alınan makbuzlar, en çok 100"),
});

export const ReceiptResult = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    action: z.enum(RECEIPT_ACTIONS),
    subjectId: z.string(),
    awarded: z.number().int().describe("Bu makbuzla eklenen puan; hesapta zaten varsa 0"),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(RECEIPT_REJECTIONS),
  }),
]);
export type ReceiptResult = z.infer<typeof ReceiptResult>;

export const ReceiptsResponse = z.object({
  results: z.array(ReceiptResult).describe("İstekteki makbuzlarla aynı sırada, makbuz başına bir sonuç"),
  awarded: z.number().int().describe("Bu istekle eklenen toplam puan"),
  points: z.number().int().describe("Hesabın istekten sonraki toplam puanı"),
});
export type ReceiptsResponse = z.infer<typeof ReceiptsResponse>;

// ── passport ─────────────────────────────────────────────────────────────────

export const PassportBadge = z.object({
  routeId: z.string(),
  title: z.string(),
  mediaId: z.string().nullable().describe("Rozet görselinin medya kimliği"),
  url: z.string().nullable().describe("Rozet görselinin adresi; görsel tanımlı değilse null"),
  alt: z.string().nullable(),
  earnedAt: IsoTime,
});

export const PassportResponse = z.object({
  points: z.number().int().describe("Puan defterinin toplamı (sunucuda hesaplanır)"),
  saved: z.array(z.string()).describe("Kaydedilen yayındaki eserler, en yeni önce"),
  read: z.array(z.string()).describe("Hikâyesi tamamlanan eserler (story.complete), en yeni önce"),
  visited: z.array(z.string()).describe("Konumu doğrulanan eserler (visit.verified), en yeni önce"),
  quizzesSolved: z.array(z.string()).describe("Puan kazanılan bulmacalar (quiz.correct), en yeni önce"),
  badges: z.array(PassportBadge).describe("Kazanılan rota rozetleri, en yeni önce"),
  progress: z.array(ProgressEntry).describe("Hikâye ilerlemeleri, son okunan önce (en çok 100; tamamı GET /v1/me/progress'te)"),
});
export type PassportResponse = z.infer<typeof PassportResponse>;
