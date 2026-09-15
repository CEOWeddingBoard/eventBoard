import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "../globals.css";

/**
 * Strona pary młodej leży poza segmentem `[locale]`, żeby adres wysyłany parze
 * był krótki i bez prefiksu języka. Skutek uboczny jest taki sam jak przy
 * `/org`: bez własnego layoutu strona nie dostaje ani `<html>`/`<body>`, ani
 * arkusza stylów, i renderuje się jako goły HTML.
 *
 * Klasa `wedding-page` wyłącza globalny krój kaligraficzny w nagłówkach —
 * ta strona ma własną typografię, a nie domyślną z czasów WeddingBoarda.
 */

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={montserrat.variable} suppressHydrationWarning>
      <body className="wedding-page min-h-screen bg-[#faf7f4] font-sans antialiased text-[#3d3228]">
        {children}
      </body>
    </html>
  );
}
