import { z } from "zod";
import { MAX_EVENTS_PER_BATCH, usageEventNames } from "@akar/domain";

const Id = z.string().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/);

export const UsageEvent = z.object({
  event: z.enum(usageEventNames).describe("Olay adı; liste ve kuralları `USAGE_EVENTS` (§11.72)"),
  siteId: Id.optional().describe("Eser olaylarında zorunlu, diğerlerinde verilmez"),
  ref: z.string().min(1).max(120).optional().describe(
    "Olayın ayrıntısı: `story.sentence` 0 tabanlı cümle sırası, `narration.play` `tr`/`en`, `part_card.open` parça kartı kimliği, `task.complete` görev kimliği, `route.open` rota kimliği, `account.sign_in` `new`/`returning`; diğerlerinde verilmez",
  ),
});
export type UsageEvent = z.infer<typeof UsageEvent>;

export const UsageBatch = z.object({
  events: z.array(UsageEvent).min(1).max(MAX_EVENTS_PER_BATCH),
});

export const UsageAccepted = z.object({
  accepted: z.number().int().nonnegative().describe("Sayılan olay sayısı; kuralı tutmayan ya da bilinmeyen esere/rotaya ait olaylar sayılmaz"),
});

const Day = z.iso.date();
export const StatsQuery = z.object({
  from: Day.optional().describe("İlk gün (dahil, İstanbul saati); verilmezse `to`'dan 29 gün önce"),
  to: Day.optional().describe("Son gün (dahil); verilmezse bugün"),
});

const Split = { guest: z.number().int().nonnegative(), signedIn: z.number().int().nonnegative() };

export const StatsCount = z.object({ event: z.enum(usageEventNames), ...Split });

export const StatsResponse = z.object({
  from: Day,
  to: Day,
  totals: z.array(StatsCount).describe("Dönemdeki her olayın misafir/giriş yapmış toplamı; sayısı 0 olan olay listede yoktur"),
  daily: z.array(StatsCount.extend({ day: Day })).describe("Gün ve olaya göre sayılar, güne göre sıralı"),
  sites: z.array(z.object({
    siteId: z.string(),
    name: z.string().nullable().describe("Eser adı; eser silinmişse null"),
    counts: z.array(StatsCount),
  })).describe("Eser olaylarının eser başına toplamı, görüntülemeye göre çoktan aza"),
  routes: z.array(z.object({
    routeId: z.string(),
    name: z.string().nullable(),
    ...Split,
  })).describe("`route.open` rota başına, çoktan aza"),
});
export type StatsResponse = z.infer<typeof StatsResponse>;

export const SiteStatsResponse = z.object({
  from: Day,
  to: Day,
  siteId: z.string(),
  name: z.string().nullable(),
  rows: z.array(StatsCount.extend({
    ref: z.string().describe("Olay ayrıntısı; yoksa boş metin"),
    label: z.string().nullable().describe("Parça kartı ya da görev başlığı; diğerlerinde null"),
  })).describe("Bu eserin olayları ayrıntıya göre: hikâye cümlesi sırası (bırakma eğrisi), parça kartı, görev, seslendirme dili"),
});
export type SiteStatsResponse = z.infer<typeof SiteStatsResponse>;
