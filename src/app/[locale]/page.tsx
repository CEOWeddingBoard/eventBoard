import type { Metadata } from "next";
import { inter } from "@/components/landing/landing-fonts";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingBeforeAfter } from "@/components/landing/LandingBeforeAfter";
import { LandingDlaKogo } from "@/components/landing/LandingDlaKogo";
import { LandingDlaKlienta } from "@/components/landing/LandingDlaKlienta";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingRoi } from "@/components/landing/LandingRoi";
import { LandingOnboarding } from "@/components/landing/LandingOnboarding";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Metadane ustawione na samej stronie sprzedażowej, a nie w marce globalnej.
 *
 * `SERVICE_NAME` to nadal „Wedding Board”, bo pod `/magazyn` żyje magazyn
 * ślubny i on tak się nazywa. Strona główna sprzedaje jednak EventBoard —
 * bez tego nadpisania karta przeglądarki i wynik w Google mówiły
 * „magazyn ślubny i aplikacja do planowania wesela”, czyli reklamowały
 * poprzedni produkt zamiast systemu dla sal.
 */
export const metadata: Metadata = {
  title: "EventBoard — system do obsługi przyjęć dla sal i restauracji",
  description:
    "Ustal raz, jak wygląda obsługa przyjęcia. Klient uzupełnia swoje kroki przez link, a agenda dla kuchni i obsługi składa się automatycznie. Bez przepisywania z Excela.",
  openGraph: {
    title: "EventBoard — system do obsługi przyjęć",
    description:
      "Proces obsługi z rolami, portal klienta bez zakładania konta i agenda, która składa się sama.",
    type: "website",
  },
};

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Strona sprzedażowa nie sprawdza sesji: nie ma na niej nic, co zależałoby od
  // zalogowania. Wejście do przestrzeni daje wyłącznie adres od administratora.
  const u = (p: string) => `/${locale}${p}`;

  return (
    <div className={`landing-clean ${inter.className} min-h-screen bg-white text-slate-600 antialiased`}>
      <LandingHeader homeUrl={u("/")} />
      <main>
        <LandingHero />
        <LandingDlaKogo />
        <LandingBeforeAfter />
        <LandingHowItWorks />
        <LandingDlaKlienta />
        <LandingFeatures />
        <LandingRoi />
        <LandingOnboarding />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
