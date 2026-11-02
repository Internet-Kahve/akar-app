import type { NextConfig } from "next";
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
  // catalogue's public Supabase storage. Widths are Next's defaults; quality 75 only.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    qualities: [75],
  },
  // The introduction is the site's main page (the bare address goes there, layout INTRO_BOOT).
  async rewrites() {
    return [{ source: "/tanitim", destination: "/tanitim/yeni/index.html" }];
  },
};
export default config;
