/**
 * Photographs at the size they are shown (2 Nov 2026): the list's 64 px thumbnails downloaded and decoded the
 * 2400 px originals (1.1–1.5 MB each, ~140 MB of decoded pixels on a phone for one list). `sized` sends a site
 * photograph through Next's image optimiser (`/_next/image`), which serves it resized and cached.
 *
 * Only the catalogue's own photographs go through it: local content (`/icerik/…`, `/tanitim/…` excepted) and the
 * catalogue's Supabase storage (next.config `images.remotePatterns`). Drawings (SVG), data and blob URLs (a photo a
 * visitor just picked) and anything else stay as they are.
 */
/** next.config: the default `imageSizes` and `deviceSizes` of Next 16; `w` must be one of them. */
export const IMAGE_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
/** Pixels per CSS pixel the sizes are made for: phones are 2–3, wide screens 1–2. */
const DENSITY = 2;
const SUPABASE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//;

export function sized(src: string | undefined, cssWidth: number, optimizerOrigin = process.env.NEXT_PUBLIC_IMAGE_ORIGIN ?? ""): string | undefined {
  if (!src || /\.svg(\?|$)/i.test(src)) return src;
  const ours = (src.startsWith("/icerik/") || SUPABASE.test(src)) && !src.startsWith("/_next/");
  if (!ours) return src;
  const want = Math.ceil(cssWidth * DENSITY);
  const w = IMAGE_WIDTHS.find((x) => x >= want) ?? IMAGE_WIDTHS.at(-1)!;
  return `${optimizerOrigin}/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}
