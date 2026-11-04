/**
 * Usage events the apps may count (§11.72). `site`: the event needs a site id; `ref`: what its detail is.
 * A new event is one line here plus the call in the web app; no migration.
 */
export type RefKind = "none" | "route" | "sentence" | "partCard" | "task" | "lang" | "signIn";

export const USAGE_EVENTS = {
  "app.open": { site: false, ref: "none", label: "Uygulama açılışı" },
  "search": { site: false, ref: "none", label: "Arama" },
  "site.view": { site: true, ref: "none", label: "Eser görüntüleme" },
  "story.start": { site: true, ref: "none", label: "Hikâye başlatma" },
  "story.sentence": { site: true, ref: "sentence", label: "Hikâye cümlesine ulaşma" },
  "story.complete": { site: true, ref: "none", label: "Hikâye bitirme" },
  "narration.play": { site: true, ref: "lang", label: "Seslendirme dinleme" },
  "about.open": { site: true, ref: "none", label: "«Eser hakkında» açma" },
  "history.open": { site: true, ref: "none", label: "«Geçmişi gör» açma" },
  "part_card.open": { site: true, ref: "partCard", label: "Parça kartı açma" },
  "task.complete": { site: true, ref: "task", label: "Görev tamamlama" },
  "my_route.add": { site: true, ref: "none", label: "Rotama ekleme" },
  "route.open": { site: false, ref: "route", label: "Rota açma" },
  "account.sign_in": { site: false, ref: "signIn", label: "Giriş" },
} as const satisfies Record<string, { site: boolean; ref: RefKind; label: string }>;

export type UsageEventName = keyof typeof USAGE_EVENTS;
export const usageEventNames = Object.keys(USAGE_EVENTS) as [UsageEventName, ...UsageEventName[]];

/** Highest story sentence index accepted (0-based). */
export const MAX_SENTENCE_INDEX = 499;
/** Events per request. */
export const MAX_EVENTS_PER_BATCH = 50;
/** Longest `from`–`to` range the stats endpoints answer, days (both ends included). */
export const MAX_STATS_DAYS = 366;
export const DEFAULT_STATS_DAYS = 30;
