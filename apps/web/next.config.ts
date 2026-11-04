import type { NextConfig } from "next";
const mobile = process.env.AKAR_MOBILE_BUILD === "1";
const config: NextConfig = {
  ...(mobile && { output: "export", images: { unoptimized: true } }),
  transpilePackages: [
    "@akar/domain",
    "@akar/api-client",
    "@akar/design-tokens",
  ],
  // `npm run dev:api` runs a second dev server next to the demo one; each needs its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  devIndicators: false,
  ...(!mobile && {
    async rewrites() {
      return [{ source: "/tanitim", destination: "/tanitim/index.html" }];
    },
  }),
};
export default config;
