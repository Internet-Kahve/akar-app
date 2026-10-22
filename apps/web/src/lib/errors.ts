import { ApiError } from "@akar/api-client";

/** Turkish, user-facing text for any error thrown by the client. */
export function describeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 0)
    return "Sunucuya ulaşılamadı. Bağlantını kontrol edip yeniden dene.";
  return error instanceof Error && error.message ? error.message : fallback;
}

/** The action needs a signed-in user (API 401, or the client refusing a guest). */
export function needsSignIn(error: unknown): boolean {
  if (error instanceof ApiError)
    return error.status === 401 || error.code === "UNAUTHENTICATED";
  return error instanceof Error && /giriş yapmalısın/i.test(error.message);
}
