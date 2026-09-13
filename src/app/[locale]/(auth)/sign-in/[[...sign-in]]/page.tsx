import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "../../auth-page-shell";
import { CustomSignIn } from "@/components/auth/custom-sign-in";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";
import { safeReturnUrl } from "@/lib/safe-return-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SignIn" });

  return buildPrivatePageMetadata({
    locale,
    path: "/sign-in",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const t = await getTranslations("SignIn");
  const authT = await getTranslations("Auth");

  const safeReturn = safeReturnUrl(returnTo, locale);
  const afterAuthQuery = safeReturn
    ? `returnTo=${encodeURIComponent(safeReturn)}`
    : "";

  if (userId) redirect(`/${locale}/after-auth?${afterAuthQuery}`);

  return (
    <AuthPageShell
      locale={locale}
      backLabel={authT("backToRoleChoice")}
      backHref={`/${locale}/auth`}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <CustomSignIn
        locale={locale}
        signUpUrl={
          safeReturn
            ? `/${locale}/sign-up?returnTo=${encodeURIComponent(safeReturn)}`
            : `/${locale}/sign-up`
        }
        afterSignInUrl={`/${locale}/after-auth?${afterAuthQuery}`}
      />
    </AuthPageShell>
  );
}
