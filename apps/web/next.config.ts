import type { NextConfig } from "next";
const mobile = process.env.AKAR_MOBILE_BUILD === "1";
const config: NextConfig = {
  ...(mobile && { output: "export" }),
  transpilePackages: ["@akar/domain", "@akar/api-client", "@akar/design-tokens"],
  // Next intermediate files and static mobile output must be built sequentially.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  devIndicators: false,
  env: {
    NEXT_PUBLIC_MOBILE_BUILD: mobile ? "1" : "0",
    // A bundled WebView has no Next image server. Reuse the live web optimiser.
    NEXT_PUBLIC_IMAGE_ORIGIN: mobile ? "https://akar.tamerakdeniz.com" : "",
  },
  images: {
    ...(mobile && { unoptimized: true }),
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    qualities: [75],
  },
  ...(!mobile && {
    async rewrites() {
      return [{ source: "/tanitim", destination: "/tanitim2/index.html" }];
    },
  }),
};
export default config;
