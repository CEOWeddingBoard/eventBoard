import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DashboardShortcuts } from "@/components/dashboard/dashboard-shortcuts";
import { eventStatusLabel } from "@/lib/event-status";
import { PierwszeKroki } from "@/components/dashboard/PierwszeKroki";

/** Miesiąc w formie „sie 2026” — same numery nie mówiły, o który rok chodzi. */
function monthLabel(key: string): string {
  const [rok, mies] = key.split("-");
  const nazwy = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
  return `${nazwy[Number(mies) - 1] ?? mies} ${rok}`;
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) return <p className="text-sm text-neutral-400">Brak użytkownika.</p>;

  const membership = await getActiveMembership(user.id);
  if (!membership) return <p className="text-sm text-neutral-400">Brak organizacji.</p>;

  const org = await prisma.organization.findUnique({ where: { id: membership.organizationId } });
  if (!org) return <p className="text-sm text-neutral-400">Brak organizacji.</p>;

  const [events, payments, memberCount] = await Promise.all([
    prisma.event.findMany({
      where: { organizationId: org.id },
      select: {
        id: true,
        name: true,
        date: true,
        estimatedGuestCount: true,
        status: true,
        workflowStageId: true,
        clientWorkflowStatus: true,
        workflow: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.eventPayment.aggregate({
      where: { event: { organizationId: org.id }, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.organizationMember.count({ where: { organizationId: org.id } }),
  ]);

  // Stan „pierwszych kroków" — świeża przestrzeń nie może witać pustką.
  const [workflowCount, eventsZLinkiem] = await Promise.all([
    prisma.organizationWorkflow.count({ where: { organizationId: org.id } }),
    prisma.event.count({
      where: { organizationId: org.id, clientLinkTokenHash: { not: null } },
    }).catch(() => 0),
  ]);

  const pendingDecisions = events.filter((e) => e.clientWorkflowStatus === "MENU_SUBMITTED");
  const revenue = payments._sum.amount ?? 0;

  // Pipeline po krokach procesu. Wcześniej etap odczytywano z przestarzałego
  // stagesJson, które nowy builder zapisuje jako puste — przez co każdy event,
  // także ten z uruchomionym procesem, lądował w koszu „Brak procesu”.
  const processStates = await prisma.eventProcessState.findMany({
    where: { event: { organizationId: org.id } },
    select: { eventId: true, currentNodeId: true },
  });
  const nodes = processStates.length
    ? await prisma.workflowNode.findMany({
        where: { id: { in: [...new Set(processStates.map((s) => s.currentNodeId))] } },
        select: { id: true, name: true },
      })
    : [];
  const nodeName = new Map(nodes.map((n) => [n.id, n.name]));
  const stageByEvent = new Map(
    processStates.map((s) => [s.eventId, nodeName.get(s.currentNodeId) ?? null]),
  );

  const pipeline: Record<string, number> = {};
  for (const e of events) {
    const s = stageByEvent.get(e.id) ?? "Bez procesu";
    pipeline[s] = (pipeline[s] ?? 0) + 1;
  }
  const pipelineSorted = Object.entries(pipeline).sort((a, b) => b[1] - a[1]);
  const pipelineMax = Math.max(1, ...pipelineSorted.map(([, v]) => v));

  // Obciążenie miesięczne (liczba osób)
  const monthly: Record<string, { count: number; guests: number }> = {};
  for (const e of events) {
    const key = new Date(e.date).toISOString().slice(0, 7);
    monthly[key] = monthly[key] ?? { count: 0, guests: 0 };
    monthly[key].count += 1;
    monthly[key].guests += e.estimatedGuestCount ?? 0;
  }
  const monthlySorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
  const monthlyMax = Math.max(1, ...monthlySorted.map(([, v]) => v.guests));

  const now = new Date();
  const upcoming = events.filter((e) => e.date >= now).slice(0, 6);

  let shortcuts: Array<{ label: string; href: string }> = [];
  try {
    shortcuts = org.dashboardShortcutsJson ? JSON.parse(org.dashboardShortcutsJson) : [];
  } catch {}

  const money = (n: number) => n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Plan widnieje już w górnym pasku — druga plakietka tylko dublowała. */}
      <h1>{org.name}</h1>

      <PierwszeKroki
        locale={locale}
        stan={{
          maProces: workflowCount > 0,
          maEvent: events.length > 0,
          maLinkDlaKlienta: eventsZLinkiem > 0,
        }}
      />

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-400">Eventy</p>
          <p className="mt-1 text-2xl font-bold text-neutral-800">{events.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-400">Zespół</p>
          <p className="mt-1 text-2xl font-bold text-neutral-800">{memberCount}</p>
        </div>
        {/* Kolor ostrzegawczy dopiero, gdy jest się czym zająć — świecący
            na żółto kafel z zerem fałszywie wołał o uwagę. */}
        <div
          className={
            pendingDecisions.length > 0
              ? "rounded-lg border border-amber-200 bg-amber-50 p-4"
              : "rounded-lg border border-neutral-200 bg-white p-4"
          }
        >
          <p className={pendingDecisions.length > 0 ? "text-xs text-amber-600" : "text-xs text-neutral-500"}>
            Czeka na decyzję
          </p>
          <p
            className={
              pendingDecisions.length > 0
                ? "mt-1 text-2xl font-bold text-amber-700"
                : "mt-1 text-2xl font-bold text-neutral-800"
            }
          >
            {pendingDecisions.length}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-600">Przychody (opłacone)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{money(revenue)} zł</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pipeline etapów */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Pipeline etapów</h3>
          {pipelineSorted.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">Brak eventów z procesem.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {pipelineSorted.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-xs text-neutral-600">{name}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-neutral-100">
                    <div className="flex h-full items-center justify-end bg-blue-500 pr-1.5" style={{ width: `${(count / pipelineMax) * 100}%` }}>
                      <span className="text-[10px] font-semibold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Obciążenie miesięczne */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Obciążenie miesięczne (osoby)</h3>
          {monthlySorted.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">Brak eventów.</p>
          ) : (
            // Kolumna musi mieć własną wysokość, żeby procent na słupku miał się
            // do czego odnieść. Przy wysokości automatycznej przeglądarka
            // ignorowała `height` i wszystkie słupki wychodziły równe.
            // Kolumny mają górny limit szerokości — przy jednym miesiącu
            // słupek rozlewał się na całą kartę i wyglądał jak plama, a nie wykres.
            <div className="mt-3 flex h-36 items-stretch justify-start gap-3">
              {monthlySorted.map(([month, v]) => (
                <div key={month} className="flex w-full max-w-[72px] flex-1 flex-col items-center">
                  <div className="flex w-full flex-1 flex-col justify-end">
                    <span className="mb-1 text-center text-[10px] font-medium text-neutral-600">{v.guests}</span>
                    <div
                      className="w-full rounded-t bg-blue-500"
                      style={{ height: `${Math.max(4, (v.guests / monthlyMax) * 100)}%` }}
                      title={`${monthLabel(month)}: ${v.guests} os. w ${v.count} ${v.count === 1 ? "evencie" : "eventach"}`}
                    />
                  </div>
                  <span className="mt-1 whitespace-nowrap text-[10px] text-neutral-500">{monthLabel(month)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nadchodzące eventy */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Nadchodzące eventy</h3>
        </div>
        <div className="divide-y divide-neutral-100">
          {upcoming.length === 0 ? (
            <p className="px-4 py-4 text-sm text-neutral-400">Brak nadchodzących eventów.</p>
          ) : (
            upcoming.map((e) => {
              const stage = stageByEvent.get(e.id) ?? null;
              return (
                <Link key={e.id} href={`/app/events/${e.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50">
                  <span className="text-xs text-neutral-400">{new Date(e.date).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                  <span className="flex-1 truncate text-sm text-neutral-800">{e.name}</span>
                  {e.estimatedGuestCount != null && <span className="text-xs text-neutral-400">{e.estimatedGuestCount} os.</span>}
                  {e.clientWorkflowStatus === "MENU_SUBMITTED" ? (
                    <Badge className="bg-amber-100 text-amber-700">Czeka na decyzję</Badge>
                  ) : stage ? (
                    <Badge variant="secondary" className="text-[10px]">{stage}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">{eventStatusLabel(e.status)}</Badge>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Skróty */}
      <DashboardShortcuts initial={shortcuts} locale={locale} />
    </div>
  );
}
