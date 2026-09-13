import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { getEventClientPortalData } from "@/lib/actions/event-client.actions";
import { getEventProcessStateForPortal } from "@/lib/actions/process-runtime.actions";
import { ClientProcessStep } from "@/components/workflow/ClientProcessStep";

/**
 * Portal klienta końcowego — jedyne miejsce, gdzie para młoda / organizator
 * przyjęcia wypełnia swoje kroki procesu.
 *
 * Wejście wyłącznie przez token z linku (`generateEventClientLink`), bez konta
 * i bez sesji. `getEventClientPortalData` zwraca `null` zarówno dla tokenu
 * nieznanego, jak i wygasłego — i tak ma zostać: komunikat nie może zdradzać,
 * który z tych przypadków zaszedł.
 */

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LinkNieaktualny() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-neutral-400" />
        <h1 className="mt-4 text-lg font-semibold text-neutral-900">
          Link jest nieaktualny
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Ten link wygasł albo został unieważniony. Poproś obiekt o nowy — zajmie to chwilę.
        </p>
      </div>
    </main>
  );
}

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { token } = await params;

  const data = await getEventClientPortalData(token);
  if (!data) return <LinkNieaktualny />;

  const processState = await getEventProcessStateForPortal(token);

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          {data.organizationLogo ? (
            // Logo obiektu bywa zewnętrznym URL-em — zwykły <img>, bez optymalizacji.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.organizationLogo}
              alt=""
              className="h-8 w-auto max-w-[140px] shrink-0 object-contain"
            />
          ) : null}
          <span className="text-sm font-semibold text-neutral-800">
            {data.organizationName ?? "EventBoard"}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h1 className="text-xl font-bold text-neutral-900">{data.eventName}</h1>
          <dl className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" />
              <dd>{formatDate(data.eventDate)}</dd>
            </div>
            {data.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                <dd>{data.location}</dd>
              </div>
            )}
            {data.guestCount != null && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-neutral-400" />
                <dd>{data.guestCount} gości</dd>
              </div>
            )}
          </dl>
          {data.nextStep && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">{data.nextStep.title}</p>
              {data.nextStep.message && (
                <p className="mt-0.5 text-sm text-amber-800">{data.nextStep.message}</p>
              )}
            </div>
          )}
        </section>

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
          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600">
              Obiekt przygotowuje jeszcze ustalenia dla tego przyjęcia. Wróć tu, gdy
              dostaniesz wiadomość — wtedy pojawi się Twój pierwszy krok.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
