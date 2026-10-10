import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: [
    "@akar/domain",
    "@akar/api-client",
    "@akar/design-tokens",
  ],
  devIndicators: false,
};
export default config;
