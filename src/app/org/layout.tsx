import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "../globals.css";

/**
 * Publiczny profil obiektu leży poza segmentem `[locale]`, bo omija i18n
 * (adres `/org/<slug>` bez prefiksu języka trafia wprost do klientów).
 *
 * Skutek uboczny był taki, że strona nie dostawała NICZEGO z layoutu `[locale]`:
 * ani `<html>`/`<body>`, ani arkusza stylów. Renderowała się jako goły HTML bez
 * Tailwinda — czyli dokładnie „bez stylów i rozjechana”. Ten layout domyka
 * dokument dla całej gałęzi `/org`.
 */

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={montserrat.variable} suppressHydrationWarning>
      <body className="org-public min-h-screen bg-[#faf9f7] font-sans antialiased text-neutral-800">
        {children}
      </body>
    </html>
  );
}
