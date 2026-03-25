import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Inter,
  Source_Serif_4,
  DM_Mono,
  Google_Sans_Code,
  Instrument_Serif,
  Source_Code_Pro,
  JetBrains_Mono,
  Cardo,
} from "next/font/google";

import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
  display: "swap",
});

const cardo = Cardo({
  subsets: ["latin"],
  variable: "--font-cardo",
  weight: ["400", "700"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});


const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intrinsic Labs | Asher Pope, Engineer",
  description:
    "Systems-focused software engineering portfolio. Architecture-first, production-grade implementation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetBrainsMono.variable} ${cardo.variable}`}
    >
      <body className="site-shell">
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
