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
  // The introduction is the site's main page (the bare address goes there, layout INTRO_BOOT).
  async rewrites() {
    return [{ source: "/tanitim", destination: "/tanitim/yeni/index.html" }];
  },
};
export default config;
