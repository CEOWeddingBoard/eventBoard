/**
 * Buduje kontekst wesela dla asystenta AI (chatbot na stronie).
 * Używane w API /api/ai/chat.
 */

export interface WeddingChatContext {
  eventName: string;
  eventDate: string;
  brideName: string | null;
  groomName: string | null;
  style: string | null;
  targetBudget: number | null;
  budgetCurrency: string | null;
  guestCount: number;
  guestConfirmed: number;
  tasksTotal: number;
  tasksDone: number;
  tasksDueSoon: Array<{ title: string; dueDate: string }>;
  budgetPlannedTotal: number | null;
  budgetActualTotal: number | null;
  guestsPending: number;
  nextScheduleItems: Array<{ title: string; time: string; location?: string | null }>;
}

export function buildWeddingContextSummary(ctx: WeddingChatContext): string {
  const lines: string[] = [
    `Wesele: ${ctx.eventName}`,
    `Data: ${ctx.eventDate}`,
    ctx.brideName || ctx.groomName ? `Para: ${[ctx.brideName, ctx.groomName].filter(Boolean).join(" i ")}` : "",
    ctx.style ? `Styl: ${ctx.style}` : "",
  ].filter(Boolean);

  if (ctx.targetBudget != null) {
    const planned = ctx.budgetPlannedTotal ?? ctx.targetBudget;
    const actual = ctx.budgetActualTotal;
    const currency = ctx.budgetCurrency ?? "PLN";
    const plannedLine = `Budżet planowany: ${planned.toLocaleString("pl-PL")} ${currency}`;
    const actualLine =
      actual != null ? `Budżet wydany: ${actual.toLocaleString("pl-PL")} ${currency}` : null;
    lines.push(plannedLine);
    if (actualLine) {
      lines.push(actualLine);
    }
  }

  lines.push(
    `Goście: ${ctx.guestConfirmed} potwierdzonych / ${ctx.guestCount} zaproszonych (ok. ${ctx.guestsPending} bez odpowiedzi)`,
    `Zadania: ${ctx.tasksDone} zrobionych / ${ctx.tasksTotal} łącznie`,
  );

  if (ctx.tasksDueSoon.length > 0) {
    lines.push("Zadania nadchodzące (do tygodnia):");
    ctx.tasksDueSoon.slice(0, 10).forEach((t) => {
      lines.push(`- ${t.title} (${t.dueDate})`);
    });
  }

  if (ctx.nextScheduleItems.length > 0) {
    lines.push("Najbliższe punkty harmonogramu:");
    ctx.nextScheduleItems.slice(0, 5).forEach((item) => {
      const where = item.location ? ` – ${item.location}` : "";
      lines.push(`- ${item.time}: ${item.title}${where}`);
    });
  }

  return lines.join("\n");
}
