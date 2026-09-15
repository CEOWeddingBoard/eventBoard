import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils";
import { hasAcceptedCurrentTerms } from "@/lib/actions/legal.actions";
import { ACCEPT_DOCS, TERMS_VERSION } from "@/lib/legal";
import { AcceptTermsForm } from "@/components/legal/AcceptTermsForm";

/**
 * Bramka akceptacji dokumentów.
 *
 * To jedyny ekran między zalogowaniem a panelem, więc ma wyglądać jak część
 * produktu, a nie jak surowy formularz: karta na środku, ta sama typografia
 * i paleta co w panelu. Wcześniej treść wisiała w lewym górnym rogu, nagłówek
 * szedł krojem kaligraficznym, a linki do dokumentów były złote — żaden inny
 * ekran aplikacji tak nie wygląda.
 */
export default async function AcceptTermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);
  if (await hasAcceptedCurrentTerms()) redirect(`/${locale}/app/dashboard`);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <p className="text-center text-sm font-bold tracking-tight text-neutral-900">
          EVENT<span className="text-[#7a5f28]">BOARD</span>
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-5">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Zanim przejdziesz dalej
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              Zaktualizowaliśmy dokumenty. Zapoznaj się z nimi i zaakceptuj, aby korzystać
              z systemu.
            </p>
          </div>

          <ul className="divide-y divide-neutral-100">
            {ACCEPT_DOCS.map((d) => (
              <li key={d.slug}>
                <a
                  href={`/${locale}/legal/${d.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-neutral-50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                  <span className="flex-1 text-sm font-medium text-neutral-800">{d.title}</span>
                  <span className="text-xs text-neutral-400">otwórz ↗</span>
                </a>
              </li>
            ))}
          </ul>

          <AcceptTermsForm locale={locale} />
        </div>

        <p className="mt-3 text-center text-xs text-neutral-400">
          Wersja dokumentów: {TERMS_VERSION}
        </p>
      </div>
    </main>
  );
}
