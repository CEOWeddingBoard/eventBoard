import { inter } from "@/components/landing/landing-fonts";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingBeforeAfter } from "@/components/landing/LandingBeforeAfter";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingRoi } from "@/components/landing/LandingRoi";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Strona sprzedażowa nie sprawdza sesji: nie ma na niej nic, co zależałoby od
  // zalogowania. Wejście do przestrzeni daje wyłącznie adres od administratora.
  const u = (p: string) => `/${locale}${p}`;

  return (
    <div className={`landing-clean ${inter.className} min-h-screen bg-[#faf9f7] text-stone-600 antialiased`}>
      <LandingHeader homeUrl={u("/")} />
      <main>
        <LandingHero />
        <LandingBeforeAfter />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingRoi />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
