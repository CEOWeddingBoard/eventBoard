import type { Metadata } from "next";
import { CalendarHeart, Clock, MapPin, Users, Sparkles, ArrowRight } from "lucide-react";
import { getWeddingBoardPortalData } from "@/lib/actions/wedding-board-portal.actions";
import { getEventProcessStateForPortal } from "@/lib/actions/process-runtime.actions";
import { ClientProcessStep } from "@/components/workflow/ClientProcessStep";

/**
 * Strona pary młodej — ten sam proces co w EventBoardzie, ale w konwencji
 * Wedding Board.
 *
 * Sala definiuje proces u siebie i nic o tym nie wie: kiedy przyjęcie jest
 * oznaczone jako wesele, para dostaje link do TEJ strony zamiast do portalu
 * EventBoarda. Kroki, menu i plan dnia są dokładnie te same — inna jest tylko
 * marka i to, że para widzi tu ofertę pełnej aplikacji dla siebie.
 *
 * Trasa leży poza segmentem `[locale]`, jak `/org/[slug]`, bo adres wysyłany
 * parze ma być krótki i bez prefiksu języka. Dlatego musi być dopisana do
 * `isLocaleAgnosticPublicRoute` w `src/middleware.ts` — inaczej intlMiddleware
 * przepisze ją na `/pl/wedding/...` i link da 404.
 */

export const metadata: Metadata = {
  title: "Wasze wesele — Wedding Board",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function dataPl(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LinkNieaktualny() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f4] px-4">
      <div className="max-w-md rounded-2xl border border-[#e8ded4] bg-white p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-[#b9a68f]" />
        <h1 className="mt-4 font-sans text-lg font-semibold text-[#3d3228]">
          Ten link jest nieaktualny
        </h1>
        <p className="mt-2 text-sm text-[#6b5c4c]">
          Poproście salę o nowy — zajmie to chwilę.
        </p>
      </div>
    </main>
  );
}

export default async function WeddingBoardPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const data = await getWeddingBoardPortalData(token);
  if (!data) return <LinkNieaktualny />;

  const processState = await getEventProcessStateForPortal(token);

  const fakty = [
    { icon: CalendarHeart, label: dataPl(data.eventDate) },
    data.location ? { icon: MapPin, label: data.location } : null,
    data.guestCount ? { icon: Users, label: `${data.guestCount} gości` } : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];

  return (
    <main className="min-h-screen bg-[#faf7f4]">
      {/* Nagłówek w konwencji Wedding Board — para ma poczuć, że to strona
          dla niej, a nie panel operacyjny obiektu. */}
      <header className="border-b border-[#e8ded4] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <span className="font-sans text-sm font-bold tracking-tight text-[#3d3228]">
            WEDDING<span className="text-[#b08d57]">BOARD</span>
          </span>
          {data.organizationName && (
            <span className="flex items-center gap-2 text-xs text-[#6b5c4c]">
              {data.organizationLogo ? (
                // Logo sali bywa zewnętrznym adresem — zwykły <img>.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.organizationLogo}
                  alt=""
                  className="h-6 w-auto max-w-[110px] object-contain"
                />
              ) : null}
              {data.organizationName}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <section className="rounded-2xl border border-[#e8ded4] bg-white p-6">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[#3d3228]">
            {data.eventName}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {fakty.map((f) => (
              <span key={f.label} className="inline-flex items-center gap-1.5 text-sm text-[#6b5c4c]">
                <f.icon className="h-4 w-4 text-[#b08d57]" />
                {f.label}
              </span>
            ))}
          </div>
        </section>

        {data.schedule.length > 0 && (
          <section className="rounded-2xl border border-[#e8ded4] bg-white p-6">
            <h2 className="font-sans text-sm font-bold uppercase tracking-wide text-[#6b5c4c]">
              Plan dnia
            </h2>
            <ul className="mt-3 space-y-2">
              {data.schedule.map((s, i) => (
                <li key={`${s.time}-${i}`} className="flex gap-3 text-sm">
                  <span className="w-12 shrink-0 font-mono text-[#b08d57] tabular-nums">{s.time}</span>
                  <span className="text-[#3d3228]">
                    {s.title}
                    {s.location && <span className="text-[#8a7a68]"> · {s.location}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {processState ? (
          <ClientProcessStep
            eventId={processState.eventId}
            token={token}
            processState={processState}
            variants={data.menuVariants.map((v) => ({
              id: v.id,
              label: v.label,
              imageUrl: v.imageUrl,
              courses: v.courses.map((c) => ({ typeLabel: c.typeLabel, name: c.name })),
            }))}
            initialMenuSelection={data.menuSelection}
          />
        ) : (
          <section className="rounded-2xl border border-[#e8ded4] bg-white p-6">
            <p className="text-sm text-[#6b5c4c]">
              Sala przygotowuje jeszcze ustalenia. Wróćcie tu, gdy dostaniecie wiadomość —
              wtedy pojawi się Wasz pierwszy krok.
            </p>
          </section>
        )}

        {/* Oferta pełnej aplikacji. Świadomie POD krokami, nie nad nimi: para
            przyszła tu ustalić coś z salą, a nie oglądać reklamę. */}
        <section className="rounded-2xl border border-[#e0d3c2] bg-[#f5ece1] p-6">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold text-[#3d3228]">
            <Sparkles className="h-4 w-4 text-[#b08d57]" />
            A co z resztą wesela?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6b5c4c]">
            Tu ustalacie rzeczy z salą. Wedding Board prowadzi całą resztę: listę gości
            z potwierdzeniami, budżet z realnymi wydatkami, plan stołów i zadania
            z terminami — w jednym miejscu, wspólnie.
          </p>
          <a
            href="https://www.weddingboard.pl"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#3d3228] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#54473a]"
          >
            Zobacz Wedding Board
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>

        <p className="pb-6 text-center text-xs text-[#a8957f]">
          Ten link jest tylko dla Was. Nie udostępniajcie go dalej.
        </p>
      </div>
    </main>
  );
}
