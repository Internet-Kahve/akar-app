import type { Metadata, Viewport } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-ext-600.css";
import "@akar/design-tokens/tokens.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "./design.css";
import "./theme.css";
import { INTRO_BOOT, THEME_BOOT } from "../lib/theme-boot";
export const metadata: Metadata = {
  title: "AKAR · Şehrin hikâyesine karış",
  description:
    "Geçmişi gör. Hikâyesini dinle. İzini bırak. Türkiye’nin vakıf eserlerini keşfet.",
  icons: {
    icon: [
      { url: "/logo/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/logo/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  themeColor: "#EDEEEA",
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        {/* The map's tiles, fonts and sprite come from OpenFreeMap: the connection is opened while the app loads,
            not after the map's code has arrived (half a second on a phone's 4G). */}
        <link rel="preconnect" href="https://tiles.openfreemap.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://tiles.openfreemap.org" />
      </head>
      <body>{children}</body>
    </html>
  );
}
