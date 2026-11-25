/**
 * Photographs at the size they are shown (2 Nov 2026): the list's 64 px thumbnails downloaded and decoded the
 * 2400 px originals (1.1–1.5 MB each, ~140 MB of decoded pixels on a phone for one list). `sized` sends a site
 * photograph through Next's image optimiser (`/_next/image`), which serves it resized and cached.
 *
 * Only the catalogue's own photographs go through it: local content (`/icerik/…`, `/tanitim/…` excepted) and the
 * catalogue's Supabase storage (next.config `images.remotePatterns`). Drawings (SVG), data and blob URLs (a photo a
 * visitor just picked) and anything else stay as they are.
 *
 * `IMAGE_WIDTHS` is also the optimiser allowlist (`next.config` `imageSizes` / `deviceSizes`). A width that nothing
 * on screen asks for is left out, because each width of one source is its own transformation. Slots that show the
 * same file share a width: the 44 px history button uses the 256 px thumbnail, and a model angle uses the gallery's
 * 1200. The largest slot is the 1200 CSS photograph at 2×; 2560 is the next step up from that, where the default
 * ladder used to jump from 2048 to 3840.
 */
export const IMAGE_WIDTHS = [96, 256, 384, 640, 750, 828, 1200, 2560];
/** Pixels per CSS pixel the sizes are made for: phones are 2–3, wide screens 1–2. */
const DENSITY = 2;
const SUPABASE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//;

export function sized(src: string | undefined, cssWidth: number): string | undefined {
  if (!src || /\.svg(\?|$)/i.test(src)) return src;
  const ours = (src.startsWith("/icerik/") || SUPABASE.test(src)) && !src.startsWith("/_next/");
  if (!ours) return src;
  const want = Math.ceil(cssWidth * DENSITY);
  const w = IMAGE_WIDTHS.find((x) => x >= want) ?? IMAGE_WIDTHS.at(-1)!;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}
