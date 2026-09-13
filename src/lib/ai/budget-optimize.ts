export type BudgetSuggestion = { type: string; title: string; description: string; action: string };

interface BudgetItemLike {
  name: string;
  category: string | null;
  plannedAmount: number;
  actualAmount?: number | null;
}

export function getRuleBasedSuggestions(items: BudgetItemLike[]): BudgetSuggestion[] {
  const safe = items || [];
  const totalPlanned = safe.reduce((s, i) => s + Number(i.plannedAmount) || 0, 0);
  const totalActual = safe.reduce((s, i) => s + Number(i.actualAmount) || 0, 0);
  const out: BudgetSuggestion[] = [];

  if (totalActual > totalPlanned) {
    out.push({
      type: "warning",
      title: "Przekroczenie budżetu",
      description: `Wydatki przekraczają plan o ${(totalActual - totalPlanned).toFixed(2)} zł.`,
      action: "Zredukuj wydatki w kategoriach z największymi przekroczeniami.",
    });
  }
  const unused = totalPlanned - totalActual;
  if (totalPlanned > 0 && unused > totalPlanned * 0.2) {
    out.push({
      type: "info",
      title: "Wolny budżet",
      description: `${unused.toFixed(2)} zł pozostało do wykorzystania.`,
      action: "Możesz rozważyć ulepszenia lub odłożyć na rezerwę.",
    });
  }
  const byCategory = safe.reduce((acc, item) => {
    const cat = item.category || "Inne";
    const val = Number(item.actualAmount) || Number(item.plannedAmount) || 0;
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {} as Record<string, number>);
  const top = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
  if (top && totalActual > 0 && top[1] > totalActual * 0.3) {
    out.push({
      type: "suggestion",
      title: "Dominująca kategoria",
      description: `"${top[0]}" stanowi ${((top[1] / totalActual) * 100).toFixed(1)}% wydatków.`,
      action: "Sprawdź, czy są tańsze alternatywy.",
    });
  }
  return out;
}

const CHAT_URL = {
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
} as const;

export async function getAIBudgetSuggestions(
  items: BudgetItemLike[],
  eventName?: string
): Promise<BudgetSuggestion[] | null> {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const apiKey =
    provider === "deepseek"
      ? process.env.DEEPSEEK_API_KEY?.trim()
      : process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const totalPlanned = items.reduce((s, i) => s + Number(i.plannedAmount) || 0, 0);
  const totalActual = items.reduce((s, i) => s + Number(i.actualAmount) || 0, 0);
  const byCategory = items.reduce((acc, i) => {
    const cat = i.category || "Inne";
    const val = Number(i.actualAmount) || Number(i.plannedAmount) || 0;
    acc[cat] = (acc[cat] || 0) + val;
    return acc;
  }, {} as Record<string, number>);
  const summary = Object.entries(byCategory)
    .map(([k, v]) => `${k}: ${v.toFixed(0)} zł`)
    .join(", ");

  const url = CHAT_URL[provider as keyof typeof CHAT_URL] || CHAT_URL.openai;
  const model =
    provider === "deepseek"
      ? (process.env.DEEPSEEK_TASKS_MODEL || "deepseek-chat")
      : (process.env.OPENAI_TASKS_MODEL || "gpt-4o-mini");

  const systemPrompt = `Jesteś ekspertem od budżetu weselnego. Odpowiadasz TYLKO poprawnym JSON bez markdown.
Format: { "suggestions": [ { "type": "warning"|"info"|"suggestion", "title": "string", "description": "string", "action": "string" } ] }
Podaj 2-4 krótkie sugestie po polsku: gdzie można zaoszczędzić, na co uważać, jak rozłożyć wydatki. type: warning = problem (przekroczenie), info = informacja (wolna kwota), suggestion = rada (np. dominująca kategoria).`;

  const userPrompt = `Wydarzenie: ${eventName || "Wesele"}. Planowano łącznie: ${totalPlanned.toFixed(0)} zł, wydano: ${totalActual.toFixed(0)} zł. Kategorie: ${summary}. Podaj sugestie optymalizacji w JSON.`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { suggestions?: BudgetSuggestion[] };
    if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) return parsed.suggestions;
  } catch {
    // ignore
  }
  return null;
}
