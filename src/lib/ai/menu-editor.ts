"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";

const AI_PROVIDER = process.env.AI_PROVIDER ?? "mock";

interface AISuggestedCourse {
  name: string;
  courseType: string;
  description: string;
  allergens: string;
}

function buildMenuContext(eventType: string, variants: Array<{ label: string; courses: Array<{ name: string; courseType: string }> }>): string {
  const eventLabels: Record<string, string> = {
    WEDDING: "wesele",
    COMMUNION: "komunia",
    CHRISTMAS_EVE: "wigilia firmowa",
    CORPORATE: "impreza firmowa",
    OTHER: "wydarzenie okolicznościowe",
  };

  let ctx = `Typ wydarzenia: ${eventLabels[eventType] ?? eventType}. `;

  if (variants.length > 0) {
    ctx += "Istniejące warianty menu: ";
    for (const v of variants) {
      ctx += `${v.label}: ${v.courses.map((c) => `${c.name} (${c.courseType})`).join(", ")}. `;
    }
  } else {
    ctx += "Brak istniejących wariantów menu. ";
  }

  return ctx;
}

export async function suggestMenuWithAI(
  eventId: string,
  variantLabel: string,
  instructions?: string
): Promise<AISuggestedCourse[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { eventType: true },
  });
  if (!event) throw new Error("Event not found");

  const variants = await prisma.menuVariant.findMany({
    where: { eventId },
    include: { courses: { orderBy: { sortOrder: "asc" } } },
  });

  const context = buildMenuContext(event.eventType, variants);
  const prompt = `Jesteś szefem kuchni restauracji. Na podstawie kontekstu zaproponuj menu (4-6 dań) dla wariantu "${variantLabel}".
  
Kontekst: ${context}
${instructions ? `Dodatkowe instrukcje: ${instructions}` : ""}

Format odpowiedzi: JSON array z obiektami:
{
  "name": "nazwa dania",
  "courseType": "APPETIZER|SOUP|MAIN|DESSERT|CAKE|DRINKS|OTHER",
  "description": "krótki opis dania (1-2 zdania)",
  "allergens": "{\\"vege\\": false, \\"gluten\\": false, \\"bezgluten\\": false, \\"inne\\": \\"\\"}"
}

Zwróć TYLKO surowy JSON array, bez dodatkowego tekstu.`;

  if (AI_PROVIDER === "mock") {
    return [
      {
        name: `${variantLabel} - Przystawka sezonowa`,
        courseType: "APPETIZER",
        description: "Lekka przystawka dopasowana do charakteru wydarzenia",
        allergens: JSON.stringify({ vege: true, gluten: false, bezgluten: true, inne: "" }),
      },
      {
        name: `${variantLabel} - Zupa krem`,
        courseType: "SOUP",
        description: "Aksamitna zupa z sezonowych warzyw",
        allergens: JSON.stringify({ vege: true, gluten: false, bezgluten: true, inne: "" }),
      },
      {
        name: `${variantLabel} - Danie główne`,
        courseType: "MAIN",
        description: "Soczyste mięso z pieca z dodatkami",
        allergens: JSON.stringify({ vege: false, gluten: false, bezgluten: true, inne: "" }),
      },
      {
        name: `${variantLabel} - Deser`,
        courseType: "DESSERT",
        description: "Wyrafinowany deser sezonowy",
        allergens: JSON.stringify({ vege: true, gluten: true, bezgluten: false, inne: "" }),
      },
    ];
  }

  const { generateAIResponse } = await import("@/lib/ai");
  try {
    const result = await generateAIResponse(prompt, { jsonMode: true });
    const text = result.content;
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error("AI response is not valid JSON array");
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd)) as AISuggestedCourse[];
    return parsed;
  } catch (e) {
    console.error("AI menu suggestion failed:", e);
    throw new Error("Nie udało się wygenerować propozycji menu. Spróbuj ponownie.");
  }
}

export async function improveMenuWithAI(
  variantId: string,
  instructions: string
): Promise<AISuggestedCourse[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const variant = await prisma.menuVariant.findUnique({
    where: { id: variantId },
    include: { courses: { orderBy: { sortOrder: "asc" } }, event: { select: { eventType: true } } },
  });
  if (!variant) throw new Error("Variant not found");

  const currentMenu = variant.courses
    .map((c) => `- ${c.name} (${c.courseType})${c.description ? `: ${c.description}` : ""}`)
    .join("\n");

  const prompt = `Jesteś szefem kuchni. Popraw istniejące menu "${variant.label}" na podstawie instrukcji.
  
Typ wydarzenia: ${variant.event.eventType}
Aktualne menu:
${currentMenu}

Instrukcje użytkownika: ${instructions}

Format odpowiedzi: JSON array z obiektami (pełne nowe menu, 4-6 dań):
{
  "name": "nazwa dania",
  "courseType": "APPETIZER|SOUP|MAIN|DESSERT|CAKE|DRINKS|OTHER",
  "description": "krótki opis",
  "allergens": "{\\"vege\\": false, \\"gluten\\": false, \\"bezgluten\\": false, \\"inne\\": \\"\\"}"
}

Zwróć TYLKO surowy JSON array.`;

  if (AI_PROVIDER === "mock") {
    return variant.courses.map((c) => ({
      name: `${c.name} (zmodyfikowane)`,
      courseType: c.courseType,
      description: c.description ?? "",
      allergens: c.allergens ?? JSON.stringify({ vege: false, gluten: false, bezgluten: false, inne: "" }),
    }));
  }

  const { generateAIResponse } = await import("@/lib/ai");
  try {
    const result = await generateAIResponse(prompt, { jsonMode: true });
    const text = result.content;
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error("AI response is not valid JSON array");
    }
    return JSON.parse(text.slice(jsonStart, jsonEnd));
  } catch (e) {
    console.error("AI menu improvement failed:", e);
    throw new Error("Nie udało się poprawić menu. Spróbuj ponownie.");
  }
}
