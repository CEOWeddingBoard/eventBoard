import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { ensureEventP1Columns } from "@/lib/events/event-schema-migration";
import {
  EventBoardCalendar,
  type CalendarEventItem,
  type BlockedDayItem,
} from "@/components/eventboard/event-board-calendar";

export const metadata = { robots: { index: false, follow: false } };

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month: monthParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const membership = await getActiveMembership(user.id);
  if (!membership) redirect(`/${locale}/app/dashboard`);
  await ensureEventP1Columns();

  const [blockedDates, categories] = await Promise.all([
    prisma.orgBlockedDate.findMany({
      where: { organizationId: membership.organizationId },
      select: { id: true, date: true, reason: true },
    }),
    prisma.eventCategory.findMany({
      where: { organizationId: membership.organizationId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const now = new Date();
  const parsed =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam)
      ? new Date(`${monthParam}-01T00:00:00`)
      : now;
  const year = parsed.getFullYear();
  const month = parsed.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  const gridEnd = new Date(year, month + 1, 0);
  gridEnd.setHours(23, 59, 59, 999);

  const events = await prisma.event.findMany({
    where: {
      organizationId: membership.organizationId,
      date: { gte: gridStart, lte: gridEnd },
    },
    select: {
      id: true,
      name: true,
      date: true,
      isWedding: true,
      hall: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  const eventsByDay: Record<string, CalendarEventItem[]> = {};
  for (const event of events) {
    const key = event.date.toISOString().slice(0, 10);
    (eventsByDay[key] ??= []).push({
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      isWedding: event.isWedding,
      hallName: event.hall?.name ?? null,
    });
  }

  // Siatka liczy tylko tyle tygodni, ile miesiąc naprawdę zajmuje —
  // sztywne 42 komórki rysowały pusty szósty wiersz w krótszych miesiącach.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const days: (string | null)[] = [];
  for (let i = 0; i < cellCount; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d.getMonth() === month ? d.toISOString().slice(0, 10) : null);
  }

  // Miesiące z wpisami w bieżącym i następnym roku — bez tego kalendarz
  // otwierał pusty miesiąc i trzeba było klikać strzałkami na oślep.
  const yearStart = new Date(year - 1, 0, 1);
  const yearEnd = new Date(year + 2, 0, 1);
  const [allEvents, allBlocked] = await Promise.all([
    prisma.event.findMany({
      where: {
        organizationId: membership.organizationId,
        date: { gte: yearStart, lt: yearEnd },
      },
      select: { date: true },
    }),
    prisma.orgBlockedDate.findMany({
      where: {
        organizationId: membership.organizationId,
        date: { gte: yearStart, lt: yearEnd },
      },
      select: { date: true },
    }),
  ]);
  const monthsWithEntries = [
    ...new Set([
      ...allEvents.map((e) => e.date.toISOString().slice(0, 7)),
      ...allBlocked.map((b) => b.date.toISOString().slice(0, 7)),
    ]),
  ].sort();

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const monthLabel = firstOfMonth.toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });

  return (
    <EventBoardCalendar
      locale={locale}
      monthLabel={monthLabel}
      prevHref={`/${locale}/app/calendar?month=${monthKey(prev)}`}
      nextHref={`/${locale}/app/calendar?month=${monthKey(next)}`}
      days={days}
      eventsByDay={eventsByDay}
      blockedDates={blockedDates.map((b) => ({
        id: b.id,
        date: b.date.toISOString(),
        reason: b.reason,
      })) satisfies BlockedDayItem[]}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      monthsWithEntries={monthsWithEntries}
      currentMonth={monthKey(firstOfMonth)}
    />
  );
}
