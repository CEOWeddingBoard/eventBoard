import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { CustomSignIn } from "@/components/auth/custom-sign-in";

/**
 * Logowanie do przestrzeni obiektu.
 *
 * Adres z linku od administratora niesie `?space=<slug>` — wtedy strona wita
 * nazwą obiektu („Restauracja Pod Lipami”), a nie ogólnym „swojej przestrzeni”.
 * Klient widzi, gdzie się loguje, zanim wpisze hasło.
 *
 * Nieznany slug celowo NIE daje błędu ani innego komunikatu — wraca zwykły
 * ekran EventBoard. Inaczej ta strona byłaby narzędziem do sprawdzania,
 * które obiekty mają u nas konto.
 *
 * Wcześniej był tu ekran wyboru z jedną kafelkową opcją prowadzącą do
 * `/sign-in` — czyli jedno kliknięcie bez żadnej decyzji.
 */

async function nazwaPrzestrzeni(slug: string | undefined): Promise<{
  nazwa: string;
  logoUrl: string | null;
} | null> {
  const czysty = (slug ?? "").trim().toLowerCase();
  if (!czysty || czysty.length > 120) return null;
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: czysty },
      select: { name: true, brandLogoUrl: true, archivedAt: true },
    });
    if (!org || org.archivedAt) return null;
    return { nazwa: org.name, logoUrl: org.brandLogoUrl ?? null };
  } catch {
    return null;
  }
}

export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ space?: string }>;
}) {
  const { locale } = await params;
  const { space } = await searchParams;

  const user = await getCurrentUser();
  if (user?.id) redirect(`/${locale}/after-auth`);

  const t = await getTranslations("Auth");
  const przestrzen = await nazwaPrzestrzeni(space);

  return (
    <div className="flex w-full min-w-0 max-w-md flex-col px-3 py-8 sm:mx-auto">
      <Link
        href={`/${locale}`}
        className="mb-8 flex items-center gap-2 self-start text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backToHome")}
      </Link>

      <div className="mb-8 w-full text-center">
        {przestrzen ? (
          <>
            {przestrzen.logoUrl ? (
              // Logo obiektu bywa zewnętrznym URL-em — zwykły <img>, bez optymalizacji.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={przestrzen.logoUrl}
                alt=""
                className="mx-auto mb-3 h-12 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0f172a] shadow-sm">
                <CalendarDays className="h-5 w-5 text-amber-100" />
              </span>
            )}
            <h1 className="font-sans text-2xl font-extrabold tracking-tight text-neutral-900">
              {przestrzen.nazwa}
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Zaloguj się, aby prowadzić przyjęcia tego obiektu
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f172a] shadow-sm">
                <CalendarDays className="h-4 w-4 text-amber-100" />
              </span>
              {/* font-sans bije globalną regułę h1{font-script} — bez kaligrafii */}
              <span className="font-sans text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                EVENT<span className="text-[#7a5f28]">BOARD</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-neutral-500">Zaloguj się do swojej przestrzeni</p>
          </>
        )}
      </div>

      <CustomSignIn
        locale={locale}
        signUpUrl={`/${locale}`}
        afterSignInUrl={`/${locale}/after-auth`}
      />

      <p className="mt-6 text-center text-xs text-neutral-400">
        Nie masz jeszcze przestrzeni? Skontaktuj się z nami — zakładamy ją po ustaleniu subskrypcji.
      </p>
    </div>
  );
}
