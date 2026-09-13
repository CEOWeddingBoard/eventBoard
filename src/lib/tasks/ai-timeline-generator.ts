"use server";

import { prisma } from "@/lib/prisma";

interface AiTimelineTask {
  title: string;
  description: string;
  category: string;
  assigneeRole: string;
  daysBeforeWedding: number;
  priority: string;
  isMandatory: boolean;
}

interface AiTimelineInput {
  weddingDate: string;
  budget: number | null;
  guestCount: number | null;
  style: string | null;
  season: "spring" | "summer" | "autumn" | "winter" | "any";
  priorities: string[];
  venueType: string | null;
  childrenAttending: boolean;
}

function parseSeason(date: string): "spring" | "summer" | "autumn" | "winter" {
  const month = new Date(date).getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export async function generateAiTimeline(input: AiTimelineInput): Promise<AiTimelineTask[]> {
  const season = input.season === "any" ? parseSeason(input.weddingDate) : input.season;

  const taskDefinitions: AiTimelineTask[] = [
    {
      title: "Ustal budżet weselny",
      description: `Określ całkowity budżet weselny. ${input.budget ? `Twój deklarowany budżet: ${input.budget} PLN.` : "Podziel budżet na kategorie: sala, catering, muzyka, fotografia, dekoracje."}`,
      category: "Budżet",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 500,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Stwórz wstępną listę gości",
      description: `Zacznij od listy najbliższej rodziny i przyjaciół. ${input.guestCount ? `Szacowana liczba gości: ${input.guestCount}.` : "Podziel gości na grupy: rodzina Pani, rodzina Pana, znajomi."}`,
      category: "Goście",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 480,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: `Wybierz styl wesela — ${input.style || "określ motyw przewodni"}`,
      description: input.style
        ? `Wybraliście styl "${input.style}". Znajdź inspiracje dekoracji, kwiatów i papeterii pasujące do tego stylu.`
        : "Określ styl wesela (rustykalny, elegancki, boho, nowoczesny, glamour). To podstawa dla dekoracji, zaproszeń i strojów.",
      category: "Dekoracje",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 450,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Rezerwacja sali weselnej",
      description: season === "summer"
        ? "Lato to szczyt sezonu — najlepsze sale są zarezerwowane z rocznym wyprzedzeniem. Nie zwlekaj!"
        : season === "winter"
          ? "Zimą łatwiej o dostępność, ale okres karnawałowy i sylwestrowy to wyjątki."
          : "Sprawdź dostępność na wybraną datę i podpisz umowę.",
      category: "Sala",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 420,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Rezerwacja fotografa i videografa",
      description: "Najlepsi fotografowie mają kalendarze pełne na 1-2 lata do przodu. Przejrzyj portfolio, porównaj oferty i style.",
      category: "Usługodawcy",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 400,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Rezerwacja DJ-a lub zespołu muzycznego",
      description: season === "summer"
        ? "W sezonie letnim najlepsi DJ-e i zespoły grają prawie co weekend. Zarezerwuj z wyprzedzeniem."
        : "Umów spotkanie, posłuchaj demo, ustal repertuar. Muzyka to 80% udanej zabawy.",
      category: "Muzyka",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 365,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Wybór sukni ślubnej — rezerwacja salonu i przymiarki",
      description: "Suknia potrzebuje 6-8 miesięcy na realizację zamówienia + 2-3 miesiące na poprawki krawieckie.",
      category: "Ubiór",
      assigneeRole: "BRIDE",
      daysBeforeWedding: 340,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Wybór garnituru — Pan Młody",
      description: "Garnitur na miarę potrzebuje 3-4 miesięcy. Gotowy — minimum 2 miesiące przed ślubem z poprawkami.",
      category: "Ubiór",
      assigneeRole: "GROOM",
      daysBeforeWedding: 320,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Zamów zaproszenia ślubne i papeterię",
      description: "Użyj kreatora papeterii w aplikacji do stworzenia spersonalizowanych zaproszeń, winietek, numerów stołów. Zaplanuj wysyłkę 8 tygodni przed ślubem.",
      category: "Zaproszenia",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 300,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Degustacja menu i wybór cateringu",
      description: `Umów degustację w wybranej sali. ${input.guestCount ? `Menu dla ${input.guestCount} gości.` : ""}${input.childrenAttending ? " Pamiętaj o menu dziecięcym!" : ""}`,
      category: "Catering",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 280,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Wybór florysty i stylu dekoracji kwiatowych",
      description: season === "winter"
        ? "Zimą świeże kwiaty są droższe — rozważ dekoracje z suszonych kwiatów lub zimowe aranżacje z gałązek i szyszek."
        : season === "autumn"
          ? "Jesień oferuje piękne, ciepłe barwy — dalie, chryzantemy, wrzosy."
          : "Wybierz kwiaty sezonowe — będą świeższe i tańsze.",
      category: "Kwiaty",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 250,
      priority: "MEDIUM",
      isMandatory: true,
    },
    {
      title: "Kup obrączki ślubne",
      description: "Zamów obrączki minimum 2-3 miesiące przed ślubem. Grawerowanie wymaga dodatkowego tygodnia. Przymierz z wyprzedzeniem.",
      category: "Ubiór",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 220,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Wybór fryzjera i makijażystki — próbna stylizacja",
      description: "Umów próbną fryzurę i makijaż. Zrób zdjęcia w różnych światłach. Zarezerwuj termin na dzień ślubu.",
      category: "Uroda",
      assigneeRole: "BRIDE",
      daysBeforeWedding: 200,
      priority: "MEDIUM",
      isMandatory: true,
    },
    {
      title: "Rezerwacja transportu — samochód dla Pary Młodej",
      description: "Sprawdź oferty wynajmu aut ślubnych. Wybierz styl pasujący do motywu wesela.",
      category: "Transport",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 180,
      priority: "LOW",
      isMandatory: false,
    },
    {
      title: "Zamów tort weselny i słodki stół",
      description: "Umów degustację smaków. Tort powinien być zamówiony 3-4 miesiące przed ślubem.",
      category: "Catering",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 150,
      priority: "MEDIUM",
      isMandatory: true,
    },
    {
      title: "Wyślij zaproszenia do gości",
      description: `Wyślij zaproszenia 8-6 tygodni przed ślubem. ${input.guestCount ? `Potrzebujesz ~${Math.ceil(input.guestCount * 0.85)} zaproszeń.` : ""} Ustaw deadline RSVP na 4 tygodnie przed weselem.`,
      category: "Zaproszenia",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 90,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Zaplanuj szczegółowy harmonogram dnia ślubu",
      description: "Rozpisz co 30 minut: przygotowania, wyjazd, ceremonia, powitanie gości, obiad, pierwszy taniec, tort, oczepiny, zakończenie.",
      category: "Logistyka",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 80,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Potwierdź rezerwacje u wszystkich vendorów",
      description: "Zadzwoń do każdego vendora i potwierdź: datę, godziny, miejsce, szczegóły usługi. Przekaż im harmonogram dnia.",
      category: "Usługodawcy",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 70,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Ustal plan usadzenia gości",
      description: input.guestCount
        ? `Rozmieść ${input.guestCount} gości przy stołach. Użyj kreatora usadzenia w aplikacji.`
        : "Użyj kreatora usadzenia w aplikacji aby rozmieścić gości. Unikaj konfliktów — sadzaj znajomych razem.",
      category: "Goście",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 45,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Przymiarka finałowa — suknia i garnitur",
      description: "Ostatnia przymiarka z butami i dodatkami. Sprawdź, czy wszystko idealnie leży.",
      category: "Ubiór",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 30,
      priority: "MEDIUM",
      isMandatory: true,
    },
    {
      title: "Dopnij listę RSVP — kontakt z niezdecydowanymi",
      description: "Zadzwoń lub napisz do gości, którzy nie odpowiedzieli. Przekaż finalną liczbę do sali i cateringu.",
      category: "Goście",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 21,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Przygotuj koperty z płatnościami dla vendorów",
      description: "Przygotuj oznaczone koperty dla każdego vendora z końcową płatnością i napiwkiem. Przekaż świadkowi do rozliczenia.",
      category: "Budżet",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 14,
      priority: "HIGH",
      isMandatory: true,
    },
    {
      title: "Przygotuj torbę awaryjną na dzień ślubu",
      description: "Igła z nitką, plastry, tabletki przeciwbólowe, woda, batony, zapasowe rajstopy, kosmetyki do poprawek.",
      category: "Logistyka",
      assigneeRole: "BRIDE",
      daysBeforeWedding: 5,
      priority: "LOW",
      isMandatory: false,
    },
    {
      title: "Przekaż harmonogram kluczowym osobom",
      description: "Świadkowie, rodzice, wodzirej — każdy powinien znać plan dnia. Wyznacz osobę kontaktową od vendorów.",
      category: "Logistyka",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 3,
      priority: "MEDIUM",
      isMandatory: true,
    },
    {
      title: "Dzień przed ślubem — relaks i odpoczynek",
      description: "Masaż, kąpiel, wczesny sen. Zero stresu! Wszystko jest dopięte na ostatni guzik.",
      category: "Dzień ślubu",
      assigneeRole: "TOGETHER",
      daysBeforeWedding: 1,
      priority: "MEDIUM",
      isMandatory: false,
    },
  ];

  return taskDefinitions
    .map((t) => ({ ...t, daysBeforeWedding: Math.max(t.daysBeforeWedding, 1) }))
    .sort((a, b) => b.daysBeforeWedding - a.daysBeforeWedding);
}

export async function saveAiTimelineToEvent(
  eventId: string,
  tasks: AiTimelineTask[],
): Promise<number> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { date: true },
  });
  if (!event) throw new Error("Event not found");

  const weddingDate = new Date(event.date);
  let created = 0;

  for (const t of tasks) {
    const dueDate = new Date(weddingDate.getTime() - t.daysBeforeWedding * 24 * 60 * 60 * 1000);

    await prisma.task.create({
      data: {
        eventId,
        title: t.title,
        description: t.description,
        category: t.category,
        assigneeRole: t.assigneeRole,
        dueDate,
        status: "TODO",
        priority: t.priority,
      },
    });
    created++;
  }

  return created;
}

export async function getSeasonEmoji(season: string): Promise<string> {
  const map: Record<string, string> = { spring: "🌸", summer: "☀️", autumn: "🍂", winter: "❄️" };
  return map[season] || "💒";
}
