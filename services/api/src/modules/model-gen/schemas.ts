import { z } from "zod";
import { modelGenStatuses } from "../../db/schema/index.ts";
import { RUNNER_EVENT_TYPES } from "../../platform/model-runner.ts";

export const MAX_PROMPT_CHARS = 4000;

export const SiteJobsParams = z.object({ siteId: z.string().min(1).max(100) });
export const JobParams = z.object({ id: z.uuid() });

export const CreateJobBody = z.object({
  prompt: z.string().trim().min(1).max(MAX_PROMPT_CHARS).describe("Modelde ne değişecek; Türkçe serbest metin"),
  newSession: z.boolean().optional().describe("true = önceki konuşma bağlamı olmadan yeni oturum"),
});
export type CreateJobBody = z.infer<typeof CreateJobBody>;

export const ModelGenStatusResponse = z.object({
  enabled: z.boolean().describe("false = MODEL_RUNNER_URL ya da MODEL_RUNNER_SECRET tanımlı değil; öbür uçlar 503 MODEL_GEN_DISABLED döner"),
  loggedIn: z.boolean().describe("Çalıştırıcıdaki Claude hesabı oturum açmış mı"),
  plan: z.string().nullable(),
  expiresAt: z.string().nullable(),
});
export type ModelGenStatusResponse = z.infer<typeof ModelGenStatusResponse>;

const ModelGenFileDto = z.object({
  name: z.string(),
  bytes: z.number(),
  url: z.string().nullable().describe("Çalıştırıcının imzalı, 15 dakika geçerli mutlak bağlantısı; yalnız iş ayrıntısında ve çalıştırıcı hâlâ biliyorsa dolu"),
});

const ModelGenEventDto = z.object({
  t: z.number().int().describe("Olay zamanı, Unix epoch milisaniye"),
  type: z.enum(RUNNER_EVENT_TYPES),
  text: z.string().nullable(),
  name: z.string().nullable(),
  summary: z.string().nullable(),
});

export const ModelGenJobDto = z.object({
  id: z.string(),
  siteId: z.string(),
  prompt: z.string(),
  status: z.enum(modelGenStatuses).describe("lost = çalıştırıcı işi artık tanımıyor (yeniden başlamış olabilir)"),
  reply: z.string().nullable(),
  error: z.string().nullable(),
  version: z.string().nullable(),
  files: z.array(ModelGenFileDto),
  warnings: z.array(z.string()),
  usage: z.object({ turns: z.number(), durationMs: z.number(), costUsd: z.number() }).nullable(),
  events: z.array(ModelGenEventDto).describe("Canlı akış; saklanmaz, yalnız iş ayrıntısında ve çalıştırıcı biliyorsa dolu"),
  createdBy: z.string().describe("İşi başlatan yöneticinin hesap kimliği"),
  createdAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
});
export type ModelGenJobDto = z.infer<typeof ModelGenJobDto>;
