"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { generateAIResponse } from "@/lib/ai";
import { buildAgendaDocx, buildAgendaDocxWithImages, type AgendaImage } from "@/lib/agenda/agenda-docx";
import { AGENDA_TARGETS, AGENDA_TARGET_GROUPS, agendaTargetLabel } from "@/lib/workflow-agenda-fields";

interface AgendaData {
  event: {
    name: string;
    date: Date;
    eventType: string;
    guestCount: number | null;
    location: string | null;
    organizerName: string | null;
    responsiblePerson: string | null;
    occasionLabel: string | null;
    eventEndTime: Date | null;
    scenarioNotes: string | null;
    createdByName: string | null;
  };
  schedule: Array<{ title: string; startTime: Date; endTime: Date | null; description: string | null; location: string | null }>;
  menuVariants: Array<{ label: string; courses: Array<{ name: string; courseType: string; description: string | null; allergens: string | null }> }>;
  guests: Array<{ name: string; allergies: string | null; foodPreference: string | null }>;
  // Dane zebrane przez węzły procesu (field mappings)
  processData?: Record<string, string>;
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  APPETIZER: "Przystawka",
  SOUP: "Zupa",
  MAIN: "Danie główne",
  DESSERT: "Deser",
  CAKE: "Tort",
  COLD_PLATTER: "Zimna płyta",
  BUFFET: "Bufet",
  DINNER: "Kolacja",
  COFFEE_TEA: "Kawa i herbata",
  DRINKS: "Napoje",
  ALCOHOL: "Alkohol",
  OTHER: "Inne",
};

const COURSE_ORDER = [
  "APPETIZER", "SOUP", "MAIN", "DESSERT", "CAKE",
  "COLD_PLATTER", "BUFFET", "DINNER",
  "COFFEE_TEA", "DRINKS", "ALCOHOL", "OTHER",
];

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function formatWeekday(d: Date): string {
  return new Date(d).toLocaleDateString("pl-PL", { weekday: "long" });
}

function eventTypeToOccasion(type: string): string {
  switch (type) {
    case "WEDDING": return "wesele";
    case "COMMUNION": return "komunia";
    case "CHRISTMAS_EVE": return "wigilia";
    case "CORPORATE": return "firma";
    default: return "";
  }
}

function allergensInfo(course: { description: string | null; allergens: string | null }): string {
  const parts: string[] = [];
  try {
    const a = course.allergens ? JSON.parse(course.allergens) : {};
    if (a.vege) parts.push("vege");
    if (a.gluten) parts.push("gluten");
    if (a.bezgluten) parts.push("bez glutenu");
  } catch {
    // ignoruj
  }
  if (course.description?.trim()) parts.push(course.description.trim());
  return parts.length ? ` (${parts.join(", ")})` : "";
}

/**
 * Dokłada do agendy dane zebrane w krokach procesu. Znane klucze
 * (`agenda.*`) grupujemy jak w konfiguracji procesu, a nagłówki bierzemy
 * z tych samych etykiet, których używa builder — dzięki temu to, co
 * organizator widzi przy mapowaniu, dokładnie odpowiada temu, co ląduje
 * w dokumencie. Klucze spoza słownika też pokazujemy, żeby nic nie zginęło.
 */
function appendProcessData(lines: string[], processData?: Record<string, string>): void {
  if (!processData) return;
  const entries = Object.entries(processData).filter(
    ([k, v]) => !k.startsWith("__") && typeof v === "string" && v.trim().length > 0
  );
  if (entries.length === 0) return;

  const known = new Set(AGENDA_TARGETS.map((t) => t.key));
  const groupOf = (key: string) =>
    AGENDA_TARGETS.find((t) => t.key === key)?.group ?? "Ustalenia z procesu";

  for (const group of [...AGENDA_TARGET_GROUPS, "Ustalenia z procesu"]) {
    const inGroup = entries.filter(([k]) =>
      group === "Ustalenia z procesu" ? !known.has(k) : groupOf(k) === group
    );
    if (inGroup.length === 0) continue;
    lines.push("");
    lines.push(`${group}:`);
    for (const [key, value] of inGroup) {
      const label = known.has(key) ? agendaTargetLabel(key) : key.replace(/^agenda\./, "");
      const clean = value.trim();
      if (clean.includes("\n")) {
        lines.push(`${label}:`);
        for (const l of clean.split("\n")) if (l.trim()) lines.push(l.trim());
      } else {
        lines.push(`${label}: ${clean}`);
      }
    }
  }
}

/** Deterministyczny skład agendy w formacie dokumentów restauracji. */
function buildAgendaText(data: AgendaData): string {
  const lines: string[] = [];
  const e = data.event;

  lines.push("Agenda");
  lines.push(`Data: ${formatDate(e.date)} (${formatWeekday(e.date)})`);
  if (e.guestCount) lines.push(`Ilość osób: ${e.guestCount}`);
  if (e.location) lines.push(`Miejsce: ${e.location}`);
  if (e.organizerName) lines.push(`Organizator: ${e.organizerName}`);
  if (e.createdByName) lines.push(`Utworzył: ${e.createdByName}`);
  if (e.responsiblePerson) lines.push(`Odpowiedzialny: ${e.responsiblePerson}`);
  const occasion = e.occasionLabel?.trim() || eventTypeToOccasion(e.eventType);
  if (occasion) lines.push(`Okoliczność: ${occasion}`);

  // Agenda ma pochodzić Z PROCESU, nie ze sztywnego harmonogramu. Gdy proces
  // zebrał jakiekolwiek dane (EventAgendaData), to one są źródłem prawdy i
  // renderujemy je przez appendProcessData — automatyczny szablon
  // DayScheduleItem był tu błędem (pokazywał plan, którego nikt nie ustalał).
  const processDriven =
    !!data.processData &&
    Object.values(data.processData).some((v) => typeof v === "string" && v.trim().length > 0);

  if (!processDriven && data.schedule.length > 0) {
    lines.push("");
    for (const item of data.schedule) {
      lines.push(formatTime(item.startTime));
      lines.push(item.title);
      if (item.description?.trim()) lines.push(item.description.trim());
      if (item.location?.trim()) lines.push(item.location.trim());
      lines.push("");
    }
  }

  for (const variant of data.menuVariants) {
    const courses = [...variant.courses].sort(
      (a, b) =>
        COURSE_ORDER.indexOf(a.courseType) - COURSE_ORDER.indexOf(b.courseType)
    );
    if (courses.length === 0) continue;
    lines.push(variant.label);
    for (const course of courses) {
      const cat = COURSE_TYPE_LABELS[course.courseType] ?? course.courseType;
      lines.push(`${cat}: ${course.name}${allergensInfo(course)}`);
    }
    lines.push("");
  }

  if (e.eventEndTime) {
    lines.push(`Zakończenie ${formatTime(e.eventEndTime)}`);
  }

  if (e.scenarioNotes?.trim()) {
    lines.push("");
    lines.push("Scenariusz:");
    for (const noteLine of e.scenarioNotes.split("\n")) {
      if (noteLine.trim()) lines.push(noteLine.trim());
    }
  }

  if (data.guests.length > 0) {
    lines.push("");
    lines.push("Goście (alergie / diety):");
    for (const g of data.guests) {
      const issues = [g.allergies, g.foodPreference].filter(Boolean).join(", ");
      lines.push(issues ? `- ${g.name}: ${issues}` : `- ${g.name}`);
    }
  }

  // Dane zebrane w krokach procesu (field mappings → EventAgendaData).
  // Bez tego wszystko, co klient/manager ustalił w procesie (menu, godziny,
  // uwagi dla kuchni, płatności…), nie trafiało do dokumentu.
  appendProcessData(lines, data.processData);

  lines.push("");
  lines.push("Podpisy:");
  lines.push("Kuchnia: ______________________");
  lines.push("Obsługa / Bar: ______________________");
  lines.push("Manager: ______________________");

  return lines.join("\n");
}

/** AI dopasowuje i porządkuje agendę do formatu restauracji; fallback = skład deterministyczny. */
async function composeAgendaWithAI(data: AgendaData): Promise<string | null> {
  try {
    const prompt = `Jesteś asystentem restauracji i obiektu eventowego. Na podstawie danych JSON ułóż AGENDĘ IMPREZY dokładnie w formacie używanym przez restaurację (wzór poniżej). Zwróć WYŁĄCZNIE gotową treść agendy — czysty tekst, bez markdown, bez gwiazdek, bez komentarzy i bez cudzysłowów.

WZÓR AGENDY:
Agenda
Data: dd/mm/rrrr
Ilość osób: <liczba>
Miejsce: <sala>
Organizator: <nazwa>
Utworzył: <imię>
Odpowiedzialny: <imię>
Okoliczność: <okoliczność>
                    <Dzień tygodnia>

<GG:MM>
<punkt harmonogramu>
<opis punktu>

<sekcje menu — nazwa sekcji, pod nią dania z typem np. "Zupa:", "Danie główne:", "Zimna płyta:", "Kolacja:", "Napoje:", "Alkohol:">

Zakończenie <GG:MM>

Scenariusz:
<uwagi techniczne i logistyczne>

Goście (alergie / diety):
- <imię>: <alergie>

Podpis
Kuchnia
Bar

ZASADY:
- Użyj WSZYSTKICH danych z JSON, niczego nie pomijaj i nie wymyślaj (żadnych nowych dań, godzin ani osób).
- Pole "processData" to ustalenia zebrane w krokach procesu (wybór menu, godziny, uwagi dla kuchni, płatności itp.) — MUSISZ je uwzględnić w odpowiednich sekcjach agendy; to najważniejsze, faktyczne ustalenia z klientem.
- Jeśli jakiegoś pola brak — pomiń jego wiersz.
- Zachowaj polskie znaki i poprawną polszczyznę.
- Menu grupuj wg kolejności: przystawka, zupa, danie główne, deser, tort, zimna płyta, bufet, kolacja, kawa i herbata, napoje, alkohol, inne.
- Przy daniach dołącz uwagi (wege, gluten, opis) w nawiasie.

DANE:
${JSON.stringify(data, null, 2)}`;

    const { content } = await generateAIResponse(prompt);
    if (content && content.trim().length > 40 && /Agenda/i.test(content)) {
      return content.trim();
    }
    return null;
  } catch (error) {
    console.error("[agenda] AI composition failed, using deterministic:", error);
    return null;
  }
}

async function gatherAgendaData(eventId: string): Promise<AgendaData> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      name: true,
      date: true,
      eventType: true,
      estimatedGuestCount: true,
      receptionLocationName: true,
      organizerName: true,
      responsiblePerson: true,
      occasionLabel: true,
      eventEndTime: true,
      scenarioNotes: true,
      user: { select: { name: true } },
    },
  });
  if (!event) throw new Error("Event not found");

  const [schedule, menuVariants, guests, agendaDataRow] = await Promise.all([
    prisma.dayScheduleItem.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuVariant.findMany({
      where: { eventId },
      include: { courses: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.guest.findMany({
      where: { eventId },
      select: { name: true, allergies: true, foodPreference: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.eventAgendaData.findUnique({
      where: { eventId },
      select: { dataJson: true },
    }),
  ]);

  let processData: Record<string, string> | undefined;
  if (agendaDataRow?.dataJson) {
    try {
      const raw: Record<string, unknown> = JSON.parse(agendaDataRow.dataJson);
      processData = Object.fromEntries(
        Object.entries(raw)
          .filter(([k]) => !k.startsWith("__"))
          .map(([k, v]) => [k, String(v ?? "")])
      );
    } catch {
      // ignore
    }
  }

  return {
    event: {
      name: event.name,
      date: event.date,
      eventType: event.eventType,
      guestCount: event.estimatedGuestCount,
      location: event.receptionLocationName,
      organizerName: event.organizerName,
      responsiblePerson: event.responsiblePerson,
      occasionLabel: event.occasionLabel,
      eventEndTime: event.eventEndTime,
      scenarioNotes: event.scenarioNotes,
      createdByName: event.user?.name ?? null,
    },
    schedule: schedule.map((s) => ({
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      description: s.description,
      location: s.location,
    })),
    menuVariants: menuVariants.map((v) => ({
      label: v.label,
      courses: v.courses.map((c) => ({
        name: c.name,
        courseType: c.courseType,
        description: c.description,
        allergens: c.allergens,
      })),
    })),
    guests: guests.map((g) => ({
      name: g.name,
      allergies: g.allergies,
      foodPreference: g.foodPreference,
    })),
    processData,
  };
}

/** Generuje treść agendy — AI z fallbackiem deterministycznym. */
export async function generateFinalAgenda(eventId: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const data = await gatherAgendaData(eventId);

  // Gdy proces zebrał dane, są one źródłem prawdy — usuwamy sztywny
  // harmonogram (DayScheduleItem), żeby ani AI, ani skład deterministyczny
  // nie odtwarzały planu, którego nikt nie ustalił.
  const processDriven =
    !!data.processData &&
    Object.values(data.processData).some((v) => typeof v === "string" && v.trim().length > 0);
  if (processDriven) {
    data.schedule = [];
  }

  // Skład deterministyczny: dane procesu są ustrukturyzowane, a stały format
  // gwarantuje spójny, profesjonalny wygląd dokumentu (AI potrafiło rozjechać
  // układ, przez co stylowanie DOCX nie łapało sekcji).
  return buildAgendaText(data);
}

/** Generuje agendę jako plik .docx (base64 do pobrania w przeglądarce). */
export async function generateAgendaDocxBase64(
  eventId: string,
): Promise<{ base64: string; fileName: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const text = await generateFinalAgenda(eventId);

  // Skany menu pod wariantami — osadzamy je w dokumencie (wydruk menu w agendzie).
  const variants = await prisma.menuVariant.findMany({
    where: { eventId, imageUrl: { not: null } },
    select: { label: true, imageUrl: true },
    orderBy: { sortOrder: "asc" },
  });
  const images: AgendaImage[] = variants
    .filter((v) => v.imageUrl)
    .map((v) => ({ caption: v.label, dataUrl: v.imageUrl as string }));

  const buffer = images.length > 0 ? buildAgendaDocxWithImages(text, images) : buildAgendaDocx(text);
  return {
    base64: buffer.toString("base64"),
    fileName: "agenda.docx",
  };
}

export async function checkAllAgendaApproved(eventId: string): Promise<boolean> {
  const approvals = await prisma.agendaApproval.findMany({
    where: { eventId },
    select: { status: true },
  });

  if (approvals.length === 0) return true;
  return approvals.every((a) => a.status === "APPROVED");
}
