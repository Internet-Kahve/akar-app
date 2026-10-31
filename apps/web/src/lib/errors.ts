import { ApiError } from "@akar/api-client";
import { translate, type Lang } from "./i18n";

/** User-facing text for any error thrown by the client; `lang` is the site language (the panel stays Turkish). */
export function describeError(error: unknown, fallback: string, lang: Lang = "tr"): string {
  if (error instanceof ApiError && error.status === 0)
    return translate(lang, "error.network");
  return error instanceof Error && error.message ? error.message : fallback;
}

/** The action needs a signed-in user (API 401, or the client refusing a guest). */
export function needsSignIn(error: unknown): boolean {
  if (error instanceof ApiError)
    return error.status === 401 || error.code === "UNAUTHENTICATED";
  return error instanceof Error && /giriş yapmalısın/i.test(error.message);
}

/** `describeError`, with the API's per-field messages ("Konum Bursa sınırları dışında.") when it sent any. */
export function describeFieldError(error: unknown, fallback: string, lang: Lang = "tr"): string {
  if (error instanceof ApiError) {
    const fields = [...new Set(Object.values(error.fieldErrors).flat())];
    if (fields.length) return fields.join(" ");
  }
  return describeError(error, fallback, lang);
}
