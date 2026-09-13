import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { hasAcceptedCurrentTerms } from "@/lib/actions/legal.actions";
import { ACCEPT_DOCS, TERMS_VERSION } from "@/lib/legal";
import { AcceptTermsForm } from "@/components/legal/AcceptTermsForm";

export default async function AcceptTermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);
  if (await hasAcceptedCurrentTerms()) redirect(`/${locale}/app/dashboard`);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-bold text-neutral-900">Zanim przejdziesz dalej</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Zaktualizowaliśmy dokumenty. Zapoznaj się i zaakceptuj, aby korzystać z systemu.
      </p>
      <ul className="mt-5 space-y-2">
        {ACCEPT_DOCS.map((d) => (
          <li key={d.slug}>
            <a href={`/${locale}/legal/${d.slug}`} target="_blank" rel="noreferrer"
               className="text-sm font-semibold text-[#7a5f28] hover:underline">
              {d.title} ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-neutral-400">Wersja dokumentów: {TERMS_VERSION}</p>
      <AcceptTermsForm locale={locale} />
    </div>
  );
}
