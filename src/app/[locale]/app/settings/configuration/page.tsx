import Link from "next/link";
import { Building2, ClipboardPaste, UtensilsCrossed } from "lucide-react";
import { listOrganizationConfiguration, listOrganizationEventsWithWorkflow, ensureDefaultWorkflow } from "@/lib/actions/organization-config.actions";
import { OrganizationConfigurationClient } from "./organization-configuration-client";

/**
 * Kroki konfiguracji obiektu. Świadomie krótka lista — agenda NIE ma tu
 * konfiguracji, bo składa się wyłącznie z procesu (jedno źródło prawdy).
 * Typy eventów są standardowe; własne pola dokłada się w razie potrzeby.
 */
const steps = [
  {
    href: "venues",
    title: "1. Obiekty i sale",
    description: "Zdefiniuj obiekt, sale i ich pojemność.",
    icon: Building2,
  },
  {
    href: "menu",
    title: "2. Warianty menu",
    description: "Generuj warianty menu i wskaż, w których eventach są widoczne.",
    icon: UtensilsCrossed,
  },
  {
    href: "menu-parser",
    title: "3. Reguły importu menu",
    description:
      "Słowa kluczowe, po których system rozpoznaje sekcje i typy dań we wklejonym menu. Ustawiasz raz dla całego obiektu.",
    icon: ClipboardPaste,
  },
];

export const metadata = { robots: { index: false, follow: false } };

export default async function ConfigurationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await ensureDefaultWorkflow().catch(() => null);
  const [configuration, events] = await Promise.all([
    listOrganizationConfiguration(),
    listOrganizationEventsWithWorkflow(),
  ]);
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-800">Konfiguracja organizacji</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ustaw raz sposób pracy, a przy tworzeniu eventu wybierz gotowy typ i proces.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.href}
            href={`/${locale}/app/settings/${step.href}`}
            className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm"
          >
            <step.icon className="h-5 w-5 text-blue-600" />
            <h2 className="mt-3 text-sm font-semibold text-neutral-800">{step.title}</h2>
            <p className="mt-1 text-xs text-neutral-500">{step.description}</p>
          </Link>
        ))}
      </div>
      <OrganizationConfigurationClient
        initialObjectTypes={configuration.objectTypes}
        initialWorkflows={configuration.workflows}
        events={events.map((e) => ({ id: e.id, name: e.name, date: e.date.toISOString(), workflowId: e.workflowId }))}
      />
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900">
        Najpierw utwórz typ eventu i przypisz mu szablon agendy. Szablon agendy buduje się na pustej kartce A4,
        przeciągając pola zmapowane z danymi eventu — to ten sam kreator co szablony dokumentów.
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-xs text-neutral-600">
        <strong className="text-neutral-800">Panel sali</strong> jest specjalistycznym modułem do rezerwacji,
        pakietów menu, dań, stołów i finansów. Z tego miejsca możesz przejść do niego przez sekcję „Sala”
        w menu głównym. Obiekty tworzone powyżej służą natomiast do budowania własnych danych i procesów.
      </div>
    </div>
  );
}
