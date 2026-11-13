import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Spectral } from "next/font/google";
import "./globals.css";
import { SkipLink } from "@/components/skip-link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionSpy } from "@/components/ui/section-spy";
import { SiteMotion } from "@/components/ui/site-motion";
import { site } from "@/lib/site";

// Shared typography for UI, editorial reading, tables and headings.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

// Editorial serif for titles, standfirsts and large figures. Archivo stays the reading and interface face.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

// Fixed-width typography for actual record IDs and technical/code notation.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.shortName}` },
  description: site.description,
  metadataBase: new URL(site.url),
  applicationName: site.name,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spectral.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <SkipLink />
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <SiteMotion />
          <SectionSpy />
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
