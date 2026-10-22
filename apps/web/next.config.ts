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
};
export default config;
