import { getCurrentUser } from "@/lib/auth/utils";
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
  let loggedIn = false;
  try {
    const user = await getCurrentUser();
    loggedIn = !!user?.id;
  } catch {
    loggedIn = false;
  }
  const u = (p: string) => `/${locale}${p}`;
  const dashboardUrl = loggedIn ? u("/app/dashboard") : u("/auth");

  return (
    <div className={`landing-clean ${inter.className} min-h-screen bg-[#faf9f7] text-stone-600 antialiased`}>
      <LandingHeader homeUrl={u("/")} dashboardUrl={dashboardUrl} loggedIn={loggedIn} />
      <main>
        <LandingHero />
        <LandingBeforeAfter />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingRoi />
        <LandingPricing dashboardUrl={dashboardUrl} loggedIn={loggedIn} />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
