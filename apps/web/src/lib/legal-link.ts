import type { LegalKind } from "../components/legal-dialog";

/**
 * A legal text opened from a link (5 Nov 2026): the intro page's footer points at `/#view=map&belge=kvkk` or
 * `belge=lisanslar`, so the static page and the app show the same text (`lib/legal-content.ts`), never a stale copy.
 */
export function legalFromHash(hash: string): LegalKind | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("belge");
  if (value === "kvkk") return "kvkk";
  if (value === "lisanslar" || value === "licenses") return "licenses";
  return null;
}

/** The same hash without `belge`, for when the text is closed. */
export function withoutLegal(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  params.delete("belge");
  const rest = params.toString();
  return rest ? `#${rest}` : "";
}
