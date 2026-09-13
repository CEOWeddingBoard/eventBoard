import type { Metadata } from "next";
import { Great_Vibes, Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlausibleAnalytics } from "@/components/analytics/plausible-analytics";
import { EventBoardBackground } from "@/components/EventBoardBackground";
import { PwaRegistration } from "@/components/ui/PwaRegistration";
import { JsonLd } from "@/components/seo/json-ld";
import { assertProductionConfig } from "@/lib/env";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { organizationSchema, webSiteSchema } from "@/lib/seo/json-ld";
import { SessionProvider } from "@/components/auth/session-provider";
import { getSessionUser } from "@/lib/auth/session-user";
import "../globals.css";

export const metadata: Metadata = buildRootMetadata();

assertProductionConfig();

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-reading",
});

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const sessionUser = await getSessionUser().catch(() => null);

  return (
    <html lang={locale} className={`${greatVibes.variable} ${playfair.variable} ${montserrat.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9a8554" />
      </head>
      <body className="font-sans antialiased text-ink min-h-screen relative bg-transparent">
        <SessionProvider user={sessionUser}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <JsonLd data={[organizationSchema(), webSiteSchema(locale)]} />
          <EventBoardBackground />
          <div className="relative z-10 min-h-screen">
            {children}
          </div>
          <Toaster richColors position="top-center" />
          <PlausibleAnalytics />
          <PwaRegistration />
        </NextIntlClientProvider>
        </TooltipProvider>
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
