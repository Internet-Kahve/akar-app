import type { NextConfig } from "next";
import { IMAGE_WIDTHS } from "./src/lib/image-size";

/** Below 640 matches Next's `imageSizes`; the rest are `deviceSizes`. The optimiser accepts only this list. */
const imageSizes = IMAGE_WIDTHS.filter((w) => w < 640);
const deviceSizes = IMAGE_WIDTHS.filter((w) => w >= 640);

const config: NextConfig = {
  transpilePackages: [
    "@akar/domain",
    "@akar/api-client",
    "@akar/design-tokens",
  ],
  // `npm run dev:api` runs a second dev server next to the demo one; each needs its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  devIndicators: false,
  // Site photographs are served at the size they are shown (lib/image-size.ts `sized`): the content's own files and the
  // catalogue's public Supabase storage. Quality 75 and WebP only, so one source is not stored again per format.
  // Published storage URLs contain a media id and are not overwritten; Vercel keys a local file by its bytes. Either
  // way a variant can stay fresh for 31 days instead of being transformed again every 4 hours.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    localPatterns: [{ pathname: "/icerik/**" }],
    qualities: [75],
    formats: ["image/webp"],
    imageSizes,
    deviceSizes,
    minimumCacheTTL: 2_678_400,
  },
  // The introduction is the site's main page (the bare address goes there, layout INTRO_BOOT).
  async rewrites() {
    return [{ source: "/tanitim", destination: "/tanitim2/index.html" }];
  },
};
export default config;
