"use server"

import { generateAIResponse } from "@/lib/ai"
import type { OnboardingAnswers, PersonalizedPlan } from "./onboarding-types"

function buildMockPlan(answers: OnboardingAnswers): PersonalizedPlan {
  const monthsUntil = Math.max(
    1,
    Math.ceil(
      (new Date(answers.weddingDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24 * 30)
    )
  )

  const budget = answers.budget
  const guestCount = answers.guestCount

  return {
    timeline: [
      {
        title: "Rezerwacja sali weselnej",
        category: "Lokalizacja",
        deadline: `Za ${Math.max(1, monthsUntil - 6)} mies.`,
        notes: "Zarezerwuj salę odpowiednią dla liczby gości. Sprawdź dostępność w wybranym terminie.",
      },
      {
        title: "Wybór fotografa i kamerzysty",
        category: "Dostawcy",
        deadline: `Za ${Math.max(1, monthsUntil - 4)} mies.`,
        notes: "Najlepsi fotografowie są rezerwowani z dużym wyprzedzeniem.",
      },
      {
        title: "Zamówienie zespołu muzycznego / DJ",
        category: "Rozrywka",
        deadline: `Za ${Math.max(1, monthsUntil - 5)} mies.`,
        notes: "Ustal repertuar i godziny występów.",
      },
      {
        title: "Wybór sukni ślubnej i garnituru",
        category: "Stroje",
        deadline: `Za ${Math.max(1, monthsUntil - 6)} mies.`,
        notes: "Zamów z wyprzedzeniem — poprawki krawieckie zajmują czas.",
      },
      {
        title: "Degustacja menu i wybór cateringu",
        category: "Catering",
        deadline: `Za ${Math.max(1, monthsUntil - 4)} mies.`,
        notes: "Uwzględnij diety gości (wege, bezglutenowe).",
      },
      {
        title: "Wybór tortu weselnego",
        category: "Catering",
        deadline: `Za ${Math.max(1, monthsUntil - 3)} mies.`,
        notes: "Zamów tort dopasowany stylem do motywu wesela.",
      },
      {
        title: "Wysłanie zaproszeń / Save the Date",
        category: "Goście",
        deadline: `Za ${Math.max(1, monthsUntil - 5)} mies.`,
        notes: "Zbierz adresy i wyślij zaproszenia z wyprzedzeniem.",
      },
      {
        title: "Wybór dekoracji i kwiatów",
        category: "Dekoracje",
        deadline: `Za ${Math.max(1, monthsUntil - 3)} mies.`,
        notes: "Dopasuj dekoracje do stylu: ${answers.style}.",
      },
      {
        title: "Ustalenie harmonogramu dnia wesela",
        category: "Planowanie",
        deadline: `Za ${Math.max(1, monthsUntil - 2)} mies.`,
        notes: "Rozpisz szczegółowy plan od przygotowań do oczepin.",
      },
      {
        title: "Próba generalna i ostatnie poprawki",
        category: "Planowanie",
        deadline: `Za 1 mies.`,
        notes: "Potwierdź wszystkich dostawców i sprawdź szczegóły.",
      },
    ],
    budgetBreakdown: [
      {
        category: "Sala + catering",
        recommended: Math.round(budget * 0.4),
        tip: "To zwykle największy koszt — negocjuj cenę za osobę.",
      },
      {
        category: "Fotograf + film",
        recommended: Math.round(budget * 0.12),
        tip: "Zainwestuj w jakość — zdjęcia zostaną na całe życie.",
      },
      {
        category: "Muzyka / DJ",
        recommended: Math.round(budget * 0.08),
        tip: "Dobry DJ potrafi utrzymać gości na parkiecie.",
      },
      {
        category: "Stroje + dodatki",
        recommended: Math.round(budget * 0.1),
        tip: "Suknia, garnitur, buty, biżuteria — nie zapomnij o budżecie na poprawki.",
      },
      {
        category: "Dekoracje + kwiaty",
        recommended: Math.round(budget * 0.1),
        tip: "Kwiaty sezonowe są tańsze i często piękniejsze.",
      },
      {
        category: "Tort + słodki stół",
        recommended: Math.round(budget * 0.04),
        tip: "Zamów tort na ok. 60-70% gości — nie każdy je deser.",
      },
      {
        category: "Zaproszenia + papeteria",
        recommended: Math.round(budget * 0.02),
        tip: "Papeteria cyfrowa (e-zaproszenia) może znacząco obniżyć koszty.",
      },
      {
        category: "Transport",
        recommended: Math.round(budget * 0.04),
        tip: "Uwzględnij transport dla gości z daleka i dla Pary Młodej.",
      },
      {
        category: "Rezerwa awaryjna",
        recommended: Math.round(budget * 0.1),
        tip: "Zawsze zostaw 10% budżetu na nieprzewidziane wydatki.",
      },
    ],
    vendorSuggestions: [
      "Fotograf: szukaj w serwisach takich jak WymarzoneWesele.pl, Wedding.pl",
      "Zespół muzyczny / DJ: sprawdź opinie na Facebooku i Instagramie",
      "Kwiaciarnia: polecamy lokalne pracownie florystyczne z portfolio ślubnym",
      "Sala: rozważ sale z pakietem all-inclusive (catering + obsługa + dekoracje)",
      "Konsultant ślubny / Wedding Planner: rozważ, jeśli budżet na to pozwala",
    ],
    personalizedTips: [
      answers.guestCount > 150
        ? `Przy ${guestCount} gościach rozważ salę z dużą przestrzenią i sprawną obsługą kelnerską.`
        : `Przy ${guestCount} gościach możesz pozwolić sobie na bardziej kameralne i eleganckie przyjęcie.`,
      answers.budget > 100000
        ? "Duży budżet daje elastyczność — zainwestuj w wyjątkowe atrakcje (fotobudka, pokaz sztucznych ogni)."
        : "Ograniczony budżet? Priorytetyzuj: sala, jedzenie i muzyka to podstawa. Resztę można uprościć.",
      `Styl "${answers.style}" — dopasuj dekoracje, kwiaty i papeterię do spójnego motywu.`,
      `Formalność "${answers.formality}" — ${answers.formality === "formal" ? "postaw na elegancję, dress code black tie, wykwintne menu." : answers.formality === "casual" ? "luz i swoboda — możesz zrezygnować z części formalności." : "balans między elegancją a swobodą to bezpieczny wybór."}`,
      `Sala typu "${answers.venueType}" — ${answers.venueType.includes("plener") ? "zabezpiecz plan B na wypadek deszczu." : "sprawdź pojemność i dostępność parkingu."}`,
    ],
  }
}

export async function generatePersonalizedPlan(
  answers: OnboardingAnswers
): Promise<PersonalizedPlan> {
  try {
    const prompt = `Jesteś ekspertem od planowania wesel w Polsce. Wygeneruj spersonalizowany plan wesela w formacie JSON na podstawie poniższych danych.

Dane wesela:
- Data ślubu: ${answers.weddingDate}
- Budżet: ${answers.budget} PLN
- Liczba gości: ${answers.guestCount}
- Styl: ${answers.style}
- Formalność: ${answers.formality}
- Priorytety: ${answers.priorities.join(", ")}
- Typ sali: ${answers.venueType}

Zwróć DOKŁADNIE poniższy JSON (bez dodatkowych wyjaśnień):
{
  "timeline": [
    { "title": "...", "category": "...", "deadline": "...", "notes": "..." }
  ],
  "budgetBreakdown": [
    { "category": "...", "recommended": 12345, "tip": "..." }
  ],
  "vendorSuggestions": ["...", "..."],
  "personalizedTips": ["...", "..."]
}

Timeline: 8-10 realistycznych zadań po polsku z kategoriami (Lokalizacja, Dostawcy, Rozrywka, Stroje, Catering, Dekoracje, Goście, Planowanie).
BudgetBreakdown: 6-8 kategorii z kwotami sumującymi się do ok. ${answers.budget}.
Wszystkie treści MUSZĄ być w języku polskim.`

    const response = await generateAIResponse(prompt, { jsonMode: true })
    const parsed = JSON.parse(response.content) as PersonalizedPlan
    return parsed
  } catch {
    return buildMockPlan(answers)
  }
}
