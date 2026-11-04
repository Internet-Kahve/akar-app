import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tamerakdeniz.akar",
  appName: "AKAR",
  webDir: "../web/.next-mobile",
  backgroundColor: "#EDEEEA",
  // Ship the web bundle with the app. Never point a release at a remote server.url.
  server: { hostname: "localhost", androidScheme: "https" },
  ios: { contentInset: "never" },
  plugins: {
    SystemBars: {
      insetsHandling: "native",
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;
