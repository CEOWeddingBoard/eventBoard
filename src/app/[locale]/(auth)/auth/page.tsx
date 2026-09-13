import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Building2, ArrowLeft, LogIn, CalendarDays } from "lucide-react";

export default async function AuthChoicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const t = await getTranslations("Auth");
  if (userId) redirect(`/${locale}/after-auth`);

  return (
    <div className="flex w-full min-w-0 max-w-lg flex-col items-center px-3 py-8 sm:mx-auto">
      <Link href={`/${locale}`} className="self-start flex items-center gap-2 text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors mb-8">
        <ArrowLeft className="h-3.5 w-3.5" />{t("backToHome")}
      </Link>

      <div className="text-center mb-10 w-full">
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
      </div>

      <div className="grid w-full gap-3">
        <Link href={`/${locale}/sign-in`} className="group flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5 hover:border-neutral-400 transition-all">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
            <Building2 className="h-5 w-5 text-neutral-600" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <h2 className="font-sans text-base font-semibold text-neutral-900">Zaloguj do EventBoard</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Zarządzaj eventami, klientami i procesami organizacji.</p>
          </div>
          <LogIn className="h-4 w-4 text-neutral-300 group-hover:text-neutral-600 transition-colors shrink-0" />
        </Link>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">
        Nie masz jeszcze przestrzeni? Skontaktuj się z nami — zakładamy ją po ustaleniu subskrypcji.
      </p>
    </div>
  );
}
