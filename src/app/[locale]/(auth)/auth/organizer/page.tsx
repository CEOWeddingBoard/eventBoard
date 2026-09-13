import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Building2, LogIn, UserPlus, ArrowLeft } from "lucide-react";

export default async function AuthOrganizerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const t = await getTranslations("Auth");
  if (userId) redirect(`/${locale}/after-auth?context=venue`);

  return (
    <div className="flex w-full min-w-0 max-w-lg flex-col items-center px-3 py-4 sm:mx-auto sm:py-8">
      <Link href={`/${locale}/auth`} className="self-start flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" />{t("backToRoleChoice")}
      </Link>

      <div className="text-center mb-10 w-full">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100">
          <Building2 className="h-5 w-5 text-neutral-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t("organizerTitle")}</h1>
        <p className="mt-2 text-sm text-neutral-500">{t("organizerDesc")}</p>
        <p className="mt-1.5 text-sm font-medium text-emerald-600">{t("organizerPrice")}</p>
      </div>

      <div className="grid w-full gap-3 sm:grid-cols-2">
        <Link href={`/${locale}/venue/sign-up`} className="flex flex-col items-center rounded-xl border border-neutral-200 bg-neutral-50 p-6 hover:border-neutral-400 hover:bg-neutral-100 transition-all">
          <UserPlus className="h-5 w-5 text-neutral-600 mb-2" />
          <span className="font-medium text-neutral-900">{t("organizerSignUp")}</span>
        </Link>
        <Link href={`/${locale}/venue/sign-in`} className="flex flex-col items-center rounded-xl border border-neutral-200 p-6 hover:border-neutral-400 hover:bg-neutral-50 transition-all">
          <LogIn className="h-5 w-5 text-neutral-600 mb-2" />
          <span className="font-medium text-neutral-900">{t("organizerSignIn")}</span>
        </Link>
      </div>
    </div>
  );
}
