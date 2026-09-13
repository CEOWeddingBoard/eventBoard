import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils";
import { getUserOrganizations } from "@/lib/actions/organization.actions";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Konto bez przypisanej przestrzeni. W modelu wdrożeniowym przestrzeń zakłada
 * administrator platformy, więc zamiast kreatora pokazujemy, co dalej —
 * inaczej użytkownik krążyłby między logowaniem a pulpitem.
 */
export default async function NoWorkspacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const orgs = await getUserOrganizations().catch(() => []);
  if (orgs.length > 0) redirect(`/${locale}/app/dashboard`);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
        <Building2 className="h-5 w-5 text-neutral-500" />
      </span>
      <h1 className="mt-5 text-xl font-bold text-neutral-900">Brak przypisanej przestrzeni</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        Twoje konto ({user.email}) nie jest jeszcze przypisane do żadnego obiektu.
        Przestrzeń roboczą zakładamy po stronie wdrożenia — napisz do nas, a uruchomimy ją i przekażemy dostęp.
      </p>
      <a
        href="mailto:kontakt@kodalabs.pl?subject=Dostęp do przestrzeni EventBoard"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e293b]"
      >
        <Mail className="h-4 w-4" />
        Napisz do nas
      </a>
      <Link href={`/${locale}`} className="mt-4 text-xs text-neutral-500 hover:text-neutral-800">
        Wróć na stronę główną
      </Link>
    </div>
  );
}
