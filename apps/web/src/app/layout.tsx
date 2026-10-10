import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-ext-700.css";
import "@akar/design-tokens/tokens.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "AKAR · Şehrin hikâyesine karış",
  description:
    "Geçmişi gör. Hikâyesini dinle. İzini bırak. İstanbul’un kültürel mirasını keşfet.",
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
