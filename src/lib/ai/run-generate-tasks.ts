import { prisma } from "@/lib/prisma";
import {
  getTasksForMonthsUntilWeddingByType,
  dueDateFromCeremony,
  type WeddingTaskTemplate,
  type TaskRole,
} from "@/lib/ai/wedding-tasks-data";

const AI_REQUIRED_MESSAGE =
  "Aby generować zadania przez AI, ustaw w .env.local: AI_PROVIDER=openai i OPENAI_API_KEY=sk-... albo AI_PROVIDER=deepseek i DEEPSEEK_API_KEY=... (klucz z platform.deepseek.com).";

const ROLE_MAP: Record<string, TaskRole> = {
  TOGETHER: "TOGETHER",
  WSPOLNIE: "TOGETHER",
  BRIDE: "BRIDE",
  PANI_MLODA: "BRIDE",
  GROOM: "GROOM",
  PAN_MLODY: "GROOM",
};

interface AIGeneratedTask {
  title: string;
  monthsBefore: number;
  role: string;
  category: string;
  description?: string;
}

function parseRole(raw: string): TaskRole {
  const key = String(raw).toUpperCase().replace(/\s/g, "_");
  return ROLE_MAP[key] ?? "TOGETHER";
}

const CHAT_COMPLETIONS = {
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
} as const;

const DEFAULT_MODEL = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
} as const;

/** Ankieta wstępna przed generowaniem planu zadań – kontekst dla AI. */
export interface PlanQuestionnaire {
  /** Ślub kościelny czy cywilny (tylko USC). */
  weddingType: "church" | "civil";
  /** Styl wesela (klasyczny, boho, nowoczesny itd.). */
  weddingStyle: string;
  /** Opcjonalne uwagi (np. „w plenerze”, „w stodole”). */
  notes?: string;
  /** Skala wesela – wpływa na intensywność zadań. */
  guestScale?: "small" | "medium" | "large" | "huge";
  /** Poziom budżetu względem standardu. */
  budgetLevel?: "low" | "medium" | "high";
  /** Tryb organizacji: DIY vs powierzanie podwykonawcom. */
  organizationMode?: "DIY" | "MIXED" | "OUTSOURCED";
  /** Poziom szczegółowości planu: mniej / standard / bardzo szczegółowo. */
  detailLevel?: "LOW" | "MEDIUM" | "HIGH";
  /** Priorytetowe obszary dla pary (np. fotografia, muzyka). */
  priorities?: string[];
}

async function getAITasksFromProvider(
  event: { date: Date; style?: string | null; estimatedGuestCount?: number | null },
  provider: "openai" | "deepseek",
  apiKey: string,
  questionnaire?: PlanQuestionnaire | null
): Promise<WeddingTaskTemplate[]> {
  const ceremony = new Date(event.date);
  const now = new Date();
  const monthsUntil = (ceremony.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
  const style = questionnaire?.weddingStyle || event.style || "klasyczny";
  const guestCount = event.estimatedGuestCount ?? 80;
  const isChurch = questionnaire?.weddingType === "church";
  const guestScale = questionnaire?.guestScale;
  const budgetLevel = questionnaire?.budgetLevel;
  const organizationMode = questionnaire?.organizationMode;
  const detailLevel = questionnaire?.detailLevel;
  const priorities = questionnaire?.priorities ?? [];

  const churchInstruction = isChurch
    ? ` WAŻNE: Para wybrała ŚLUB KOŚCIELNY. Obowiązkowo dodaj zadania:
- "Nauki przedmałżeńskie w kościele" – zaproponuj kiedy (np. 4–6 miesięcy przed ślubem), category: Formalności, description: "Zapiszcie się w kancelarii parafialnej; zwykle cykl spotkań."
- "Kurs w poradni życia rodzinnego" – zaproponuj kiedy (np. 3–5 miesięcy przed), category: Formalności, description: "Kurs przedmałżeński w poradni – wymagany do ślubu kościelnego."
Dopasuj monthsBefore do liczby miesięcy do ślubu.`
    : " Ślub CYWILNY (tylko USC) – uwzględnij rezerwację terminu w USC, bez nauk kościelnych ani poradni.";

  const checklistSections = `Checklista musi pokrywać WSZYSTKIE poniższe obszary (wzór: lista 147 rzeczy do zrobienia przed ślubem):

1. Pierwsze decyzje: poinformować bliskich, termin (rok/miesiąc), budżet, liczba gości, świadkowie, rodzaj ślubu (cywilny/kościelny), rejon wesela, impreza 1- czy 2-dniowa.
2. Sala: lista sal, oferty, oglądanie, wybór, umowa i zaliczka, degustacja i menu, harmonogram z obsługą, dekoracje sali.
3. Kościół (TYLKO przy ślubie kościelnym): wybór kościoła, rezerwacja, potwierdzenie z rokiem liturgicznym, koszty, dokumenty (~6 miesięcy przed), protokół przedślubny, ksiądz, organista, ustalenia z księdzem (muzyka, czytania, dekoracje, sypanie, kto prowadzi pannę młodą, dzieci).
4. DJ/Zespół: lista, oferty, spotkania, ZAIKS/oświetlenie, umowa i zaliczka, lista piosenek (wejście, pierwszy taniec, zakazane), harmonogram (tort, podziękowania, oczepiny), forma oczepin.
5. Fotograf i kamerzysta: lista, oferty, spotkania, umowy; fotograf: sesja poślubna, sesja narzeczeńska, albumy, odbiór; kamerzysta: długość filmu, podkład muzyczny, odbiór.
6. Tort i słodki stół: lista usługodawców, oferty, degustacja, umowa; ustalenie z salą: dostawa, przechowywanie, wystawienie, sprzątanie.
7. Dekoracje: kolor przewodni, motyw, samodzielnie vs dekoratorka, zamówienie/wynajem, dekoracja kościoła i sali.
8. Kwiaty: florystka vs DIY; bukiet, butonierki, dekoracja sali/kościoła/samochodu; przy DIY: plan, zakup na giełdzie, kompozycje dzień przed.
9. Oprawa muzyczna ślubu (kościół): instrumenty (harfa, skrzypce, fortepian), muzycy, repertuar, harmonogram z księdzem/organistą.
10. Ubiór – Panna Młoda: suknia (salony, przymiarka, umowa), buty, bielizna, welon, biżuteria, szlafrok, rajstopy, okrycie, buty/sukienka na przebranie, drugi dzień, coś niebieskiego/starego/pożyczonego.
11. Ubiór – Pan Młody: garnitur, koszule (2), buty, krawat/mucha, poszetka, spinki, bielizna, drugi dzień.
12. Obrączki: model, grawer, zamówienie, pudełko, kto trzyma w dniu ślubu.
13. Samochód: wybór, umowa, dekoracja auta.
14. Noclegi i transport dla gości: baza noclegowa, informacja dla gości, rezerwacje; transport: usługodawca, rezerwacja, punkty zbiórki.
15. Zaproszenia i papeteria: zamówienie zaproszeń, roznoszenie, zbieranie RSVP; winietki, numery stołów, menu, harmonogram, etykiety na alkohol, księga gości, pudełko na koperty, tablice rejestracyjne, drogowskazy, pudełka na ciasto.
16. Usadzenie gości: rodzaj stołów, plan usadzenia, plany stołów, numerki, winietki, menu/program na stole.
17. Fryzjer i makijażystka: wybór, miejsce (salon/dom/sala), umowa, zaliczka, próba; inne: brwi, depilacja, manicure, pedicure, wybielanie; plan urodowy.
18. Alkohol: rodzaj i ilość, zamówienie, przechowywanie na sali, podawanie, etykiety.
19. Pierwszy taniec: tak/nie, piosenka, nauka (szkoła tańca lub samodzielnie).
20. Dodatkowe atrakcje: zimne ognie, fontanna czekoladowa, fotobudka, animator, Instax, bańki, budka z lodami itd.
21. Prezenty: dla gości (np. krówki), dla rodziców, dla dziadków/chrzestnych/świadków.
22. Końcowe ustalenia: miejsce przygotowań i błogosławieństwa, koszyczki ratunkowe do łazienek, brama (drobne, słodycze, alkohol), wieczór panieński/kawalerski, harmonogram dnia ślubu, kto za co odpowiada, konfetti, podróż poślubna.`;

  const systemPrompt = `Jesteś ekspertem od planowania wesel. Twoim zadaniem jest wygenerowanie PEŁNEJ CHECKLISTY zadań, które KAŻDA młoda para musi wykonać przed ślubem – od pierwszych decyzji po dzień wesela.

Zwracasz TYLKO poprawny JSON, bez markdown, bez komentarzy.
Format: { "tasks": [ { "title": "string", "monthsBefore": number, "role": "TOGETHER"|"BRIDE"|"GROOM", "category": "string", "description": "string" (opcjonalnie) } ] }

Zasady:
- title: konkretne, jednozdaniowe zadanie (np. "Zarezerwuj salę weselną", "Zamów obrączki").
- monthsBefore: ile miesięcy PRZED datą ślubu. Całkowite: 18, 12, 6, 3, 1. Ułamki (dni przed): 0.5 = 14 dni (2 tyg.), 0.25 = 7 dni (1 tyg.), 0.1 = 3 dni, 0.03 = 1 dzień, 0 = dzień ślubu.
- role: TOGETHER (wspólnie), BRIDE (tylko Pani Młoda), GROOM (tylko Pan Młody). Przydziel zgodnie z naturą zadania.
- category: jedna z: Planowanie, Budżet, Sala, Kościół, Usługodawcy, Goście, Zaproszenia, Papeteria, Ubiór, Uroda, Catering, Formalności, Dekoracje, Kwiaty, Transport, Logistyka, Muzyka, Atrakcje, Prezenty, Finanse, Relaks, Dzień ślubu.
- description: krótka wskazówka (opcjonalnie).

Zasady czasowe (obowiązkowe):
- Suknia, buty ślubne, biżuteria: zamówienie wcześniej, GOTOWE ok. 6 miesięcy przed (odbiór z salonu). Zaproszenia: zamówić wcześnie, rozwieźć/wysłać ok. 3 miesiące przed.
- Wszystkie sprawy organizacyjne (płatności, niezbędnik, harmonogram, koszyczki ratunkowe, brama, konfetti, plany stołów itd.) mają być gotowe MAX 2 tygodnie przed ślubem (monthsBefore 0.5).
- Ostatni tydzień (0.25) i ostatnie dni: TYLKO odpoczynek i pielęgnacja: "Odpocznij – dzień bez planowania", "Maseczka / pielęgnacja twarzy", "Ostatnia randka jako narzeczeństwo", "Wyśpij się", "Relaks: masaż lub kino – zakaz rozmów o ślubie". Barbero 0.1 (3 dni przed).
- Przy krótszym czasie do ślubu (np. 3 miesiące): generuj TYLKO zadania z monthsBefore <= dostępne miesiące i rozłóż je proporcjonalnie (wczesne zadania na początek, relaks na końcu).

${checklistSections}

Dla każdego obszaru wygeneruj po kilka konkretnych zadań. Nie pomijaj żadnego obszaru (dla ślubu cywilnego pomiń Kościół i oprawę muzyczną). Na końcu listy zawsze dodaj zadania relaksowe (odpocznij, maseczka, ostatnia randka, wyśpij się, relaks dzień przed).${churchInstruction}`;

  const userPrompt = `Wygeneruj PEŁNĄ checklistę zadań przed ślubem dla pary młodej.

Kontekst:
- Data ślubu: ${ceremony.toISOString().slice(0, 10)}
- Do ślubu zostało ok. ${Math.round(monthsUntil)} miesięcy
- Typ ślubu: ${isChurch ? "kościelny" : "cywilny (tylko USC)"}
- Styl wesela: ${style}
- Szacowana liczba gości: ${guestCount}
${guestScale ? `- Skala wesela: ${guestScale} (small=do 50, medium=50–100, large=100–150, huge=150+)` : ""}
${budgetLevel ? `- Poziom budżetu: ${budgetLevel} (low=oszczędnie, medium=standard, high=premium)` : ""}
${organizationMode ? `- Tryb organizacji: ${organizationMode} (DIY=większość robimy sami, MIXED=mieszany, OUTSOURCED=powierzamy usługodawcom)` : ""}
${detailLevel ? `- Poziom szczegółowości planu: ${detailLevel} (LOW=tylko kluczowe kroki, MEDIUM=standard, HIGH=dużo małych kroków)` : ""}
${priorities.length ? `- Priorytety pary: ${priorities.join(", ")}` : ""}
${questionnaire?.notes?.trim() ? `- Uwagi: ${questionnaire.notes.trim()}` : ""}

Wymagania:
1. Lista ma zawierać WSZYSTKIE typowe zadania – od wczesnego planowania po dzień wesela. Suknia/buty/biżuteria gotowe ok. 6 m przed; zaproszenia rozwiezione ok. 3 m przed.
2. Uwzględnij TYLKO zadania z monthsBefore <= ${Math.ceil(monthsUntil)} (przy krótkim czasie do ślubu skaluj: nie dodawaj zadań na okres, który już minął).
3. Wszystko organizacyjne max 2 tygodnie przed (monthsBefore 0.5). Ostatni tydzień (0.25) i dni (0.1, 0.03): tylko odpoczynek, maseczka, ostatnia randka, wyśpij się, relaks.
4. Jeśli budgetLevel=low, mocniej skup się na zadaniach optymalizujących koszty (negocjacje, porównywanie ofert); przy budgetLevel=high – większy nacisk na jakość i dodatkowe atrakcje.
5. Jeśli organizationMode=DIY, rozbij zadania na mniejsze kroki (detailLevel=HIGH). Jeśli organizationMode=OUTSOURCED, skup się na wyborze i kontroli dostawców zamiast mikro-zadań DIY.
6. Jeśli detailLevel=LOW, staraj się nie przekraczać ~40–50 zadań; przy HIGH możesz zrobić 80+ małych kroków.
7. Przydziel role (TOGETHER / BRIDE / GROOM) i kategorie. Każde zadanie = jedna konkretna czynność.
8. Zwróć wyłącznie JSON z polem "tasks" (tablica obiektów). Minimum kilkanaście–kilkadziesiąt zadań, zależnie od tego, ile miesięcy do ślubu oraz detailLevel.`;

  const url = CHAT_COMPLETIONS[provider];
  const model =
    provider === "openai"
      ? (process.env.OPENAI_TASKS_MODEL || DEFAULT_MODEL.openai)
      : (process.env.DEEPSEEK_TASKS_MODEL || DEFAULT_MODEL.deepseek);

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

  if (!res.ok) {
    const errText = await res.text();
    let parsed: { error?: { type?: string; message?: string } };
    try {
      parsed = JSON.parse(errText) as { error?: { type?: string; message?: string } };
    } catch {
      throw new Error(`${provider}: ${res.status} ${errText}`);
    }
    if (res.status === 429 && parsed.error?.type === "insufficient_quota") {
      const providerName = provider === "openai" ? "OpenAI" : "DeepSeek";
      throw new Error(
        `Wyczerpany limit ${providerName}. Obecnie: AI_PROVIDER=${provider}. Edytuj .env.local: ustaw AI_PROVIDER=deepseek i DEEPSEEK_API_KEY=... albo AI_PROVIDER=mock (bez API).`
      );
    }
    const msg = parsed.error?.message ?? errText;
    throw new Error(msg || `${provider}: ${res.status}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error(`Brak odpowiedzi ${provider}`);

  let parsed: { tasks?: AIGeneratedTask[] };
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    parsed = JSON.parse(cleaned) as { tasks?: AIGeneratedTask[] };
  } catch {
    throw new Error(`AI (${provider}) zwróciło nieprawidłowy JSON`);
  }
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  return tasks.map((t) => ({
    title: t.title,
    monthsBefore: Number(t.monthsBefore),
    role: parseRole(t.role),
    category: t.category || "Planowanie",
    description: t.description,
  })) as WeddingTaskTemplate[];
}

export async function runGenerateTasks(
  eventId: string,
  questionnaire?: PlanQuestionnaire | null
): Promise<{ count: number } | { error: string }> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { error: "Nie znaleziono wydarzenia. Utwórz wydarzenie w panelu głównym." };
  }
  if (!event.date) {
    return { error: "Uzupełnij datę ślubu w ustawieniach wydarzenia." };
  }

  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();

  const effectiveModel =
    provider === "openai"
      ? (process.env.OPENAI_TASKS_MODEL || DEFAULT_MODEL.openai)
      : provider === "deepseek"
        ? (process.env.DEEPSEEK_TASKS_MODEL || DEFAULT_MODEL.deepseek)
        : "—";
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(
      "[AI] Generowanie zadań: provider=%s, model=%s (openai key: %s, deepseek key: %s)",
      provider,
      effectiveModel,
      openaiKey ? "ustawiony" : "brak",
      deepseekKey ? "ustawiony" : "brak"
    );
  }

  const ceremony = new Date(event.date);
  const now = new Date();
  const monthsUntil = (ceremony.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
  const capped = Math.max(0.5, Math.min(24, monthsUntil));
  const weddingType = questionnaire?.weddingType ?? "civil";

  const getFallbackTasks = () => getTasksForMonthsUntilWeddingByType(capped, weddingType);

  let tasks: WeddingTaskTemplate[];
  if (provider === "openai" && openaiKey) {
    try {
      tasks = await getAITasksFromProvider(
        {
          date: event.date,
          style: event.style,
          estimatedGuestCount: event.estimatedGuestCount,
        },
        "openai",
        openaiKey,
        questionnaire
      );
      if (tasks.length === 0) tasks = getFallbackTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OpenAI error";
      return { error: msg };
    }
  } else if (provider === "deepseek" && deepseekKey) {
    try {
      tasks = await getAITasksFromProvider(
        {
          date: event.date,
          style: event.style,
          estimatedGuestCount: event.estimatedGuestCount,
        },
        "deepseek",
        deepseekKey,
        questionnaire
      );
      if (tasks.length === 0) tasks = getFallbackTasks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "DeepSeek error";
      return { error: msg };
    }
  } else {
    if ((provider === "openai" && !openaiKey) || (provider === "deepseek" && !deepseekKey)) {
      return { error: AI_REQUIRED_MESSAGE };
    }
    tasks = getFallbackTasks();
  }

  const data = tasks
    .filter((t) => t.title?.trim() && typeof t.monthsBefore === "number" && !Number.isNaN(t.monthsBefore))
    .map((t) => ({
      eventId,
      title: String(t.title).trim(),
      description: t.description ?? null,
      dueDate: dueDateFromCeremony(ceremony, t.monthsBefore),
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      category: (t.category && String(t.category).trim()) || "Planowanie",
      assigneeRole: t.role,
    }));

  if (data.length === 0) {
    return { error: "Nie udało się wygenerować żadnych zadań. Sprawdź datę wesela (powinna być w przyszłości) lub spróbuj ponownie." };
  }

  await prisma.task.deleteMany({ where: { eventId } });
  await prisma.task.createMany({ data });
  return { count: data.length };
}
