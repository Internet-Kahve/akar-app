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
export const metadata: Metadata = {
  title: "AKAR · Şehrin hikâyesine karış",
  description:
    "Geçmişi gör. Hikâyesini dinle. İzini bırak. Bursa’nın kültürel mirasını keşfet.",
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
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
