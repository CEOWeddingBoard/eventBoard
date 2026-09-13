// AI-powered seating plan generation using OpenAI's GPT model
// This uses a free tier or low-cost API approach

interface Guest {
  id: string;
  name: string;
  group?: string;
  dietaryRestrictions?: string;
  foodPreference?: string;
  seatingNotes?: string;
  seatingPreference?: string;
  relationship?: string;
  age?: number;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  isCoupleTable?: boolean;
}

interface SeatingRule {
  id: string;
  type: 'MUST_SIT_TOGETHER' | 'CANNOT_SIT_TOGETHER' | 'SAME_TABLE';
  guestIds: string[];
}

interface SeatingInput {
  guests: Guest[];
  tables: Table[];
  rules: SeatingRule[];
  eventName: string;
}

export async function generateSeatingPlanWithAI(input: SeatingInput) {
  try {
    const { guests, tables, rules } = input;

    if (guests.length === 0) {
      return { success: false, error: "Brak gości do usadzenia." };
    }

    groupGuestsByRelationships(guests);
    const dietaryGroups = groupGuestsByDietary(guests);
    const preferenceGroups = groupGuestsBySeatingPreference(guests);

    const guestTables = tables.filter(t => !t.isCoupleTable);
    if (guestTables.length === 0) {
      return { success: false, error: "Brak stołów dla gości." };
    }

    const plan: Record<string, Guest[]> = {};
    guestTables.forEach(table => {
      plan[table.id] = [];
    });

    const appliedRules = applySeatingRules(guests, guestTables, rules, plan);

    const remainingGuests = guests.filter(guest =>
      !appliedRules.seatedGuests.includes(guest.id)
    );

    const filledTables = fillTablesWithAI(remainingGuests, guestTables, plan, dietaryGroups, preferenceGroups);

    const totalSeated = Object.values(filledTables).reduce((s, arr) => s + arr.length, 0);
    console.log(`[seating-ai] Rule-based: ${totalSeated}/${guests.length} guests seated across ${guestTables.length} tables`);

    return {
      success: true,
      plan: filledTables,
      warnings: appliedRules.warnings,
      suggestions: generateSeatingSuggestions(filledTables, tables)
    };

  } catch (error) {
    console.error('[seating-ai] generation error:', error);
    return {
      success: false,
      error: 'Failed to generate AI seating plan'
    };
  }
}

function groupGuestsByRelationships(guests: Guest[]): Record<string, Guest[]> {
  const groups: Record<string, Guest[]> = {};

  guests.forEach(guest => {
    const key = guest.group || guest.relationship || 'other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(guest);
  });

  return groups;
}

function groupGuestsByDietary(guests: Guest[]): Record<string, Guest[]> {
  const groups: Record<string, Guest[]> = {};

  guests.forEach(guest => {
    const diet = [guest.dietaryRestrictions, guest.foodPreference].filter(Boolean).join("|") || "none";
    const key = diet.toLowerCase().replace(/\s+/g, "_").slice(0, 40);
    if (!groups[key]) groups[key] = [];
    groups[key].push(guest);
  });

  return groups;
}

function groupGuestsBySeatingPreference(guests: Guest[]): Record<string, Guest[]> {
  const groups: Record<string, Guest[]> = {};

  guests.forEach(guest => {
    const pref = (guest.seatingPreference || guest.seatingNotes || "").trim().toLowerCase();
    let key = "none";
    if (pref) {
      const normalized = pref.slice(0, 50).replace(/\s+/g, "_").replace(/[^a-z0-9_ąćęłńóśźż]/gi, "");
      key = normalized || "has_notes";
    } else {
      const notes = guest.seatingNotes?.toLowerCase() || "";
      if (notes.includes("scena") || notes.includes("scen")) key = "near_stage";
      else if (notes.includes("okno") || notes.includes("window")) key = "near_window";
      else if (notes.includes("dźwięk") || notes.includes("głośnik") || notes.includes("sound")) key = "away_from_sound";
      else if (notes.includes("wejście") || notes.includes("entrance")) key = "near_entrance";
      else if (notes) key = "has_notes";
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(guest);
  });

  return groups;
}

function applySeatingRules(guests: Guest[], tables: Table[], rules: SeatingRule[], plan: Record<string, Guest[]>) {
  const seatedGuests: string[] = [];
  const warnings: string[] = [];
  const mustSitRules = rules.filter(rule => rule.type === 'MUST_SIT_TOGETHER' || rule.type === 'SAME_TABLE');

  mustSitRules.forEach(rule => {
    const groupGuests = guests.filter(guest => rule.guestIds.includes(guest.id));

    if (groupGuests.length !== rule.guestIds.length) {
      warnings.push(`Some guests in group rule not found`);
      return;
    }

    const suitableTable = tables.find(table =>
      plan[table.id].length + groupGuests.length <= table.capacity
    );

    if (suitableTable) {
      plan[suitableTable.id].push(...groupGuests);
      seatedGuests.push(...rule.guestIds);
    } else {
      warnings.push(`No suitable table for group: ${groupGuests.map(g => g.name).join(', ')}`);
    }
  });

  // Handle CANNOT_SIT_TOGETHER rules (for future use)
  rules.filter(rule => rule.type === 'CANNOT_SIT_TOGETHER');

  return { seatedGuests, warnings };
}

function fillTablesWithAI(
  guests: Guest[],
  tables: Table[],
  plan: Record<string, Guest[]>,
  dietaryGroups: Record<string, Guest[]>,
  preferenceGroups: Record<string, Guest[]>
): Record<string, Guest[]> {
  const result: Record<string, Guest[]> = {};
  tables.forEach(t => { result[t.id] = [...plan[t.id]]; });

  const isSeated = (guestId: string) =>
    Object.values(result).some(arr => arr.some(g => g.id === guestId));

  const dietKey = (g: Guest) => {
    const d = [g.dietaryRestrictions, g.foodPreference].filter(Boolean).join("|").toLowerCase().replace(/\s+/g, "_").slice(0, 40);
    return d || "none";
  };
  const prefKey = (g: Guest) => {
    const p = (g.seatingPreference || g.seatingNotes || "").trim().toLowerCase().slice(0, 50).replace(/\s+/g, "_");
    return p || "none";
  };

  const tryPlace = (guest: Guest, preferTable?: Table): boolean => {
    const candidates = preferTable ? [preferTable, ...tables.filter(t => t.id !== preferTable.id)] : tables;
    for (const table of candidates) {
      if (result[table.id].length >= table.capacity) continue;
      result[table.id].push(guest);
      return true;
    }
    return false;
  };

  const guestsWithPreference = guests.filter(g => (g.seatingPreference || g.seatingNotes) && !isSeated(g.id));
  guestsWithPreference.forEach(guest => {
    const key = prefKey(guest);
    const sameGroup = preferenceGroups[key]?.filter(g => g.id !== guest.id && !isSeated(g.id)) || [];
    const tableWithSame = tables.find(t =>
      result[t.id].length < t.capacity &&
      result[t.id].some(seated => prefKey(seated) === key)
    );
    if (tableWithSame && tryPlace(guest, tableWithSame)) return;
    tryPlace(guest);
  });

  const guestsWithDiet = guests.filter(g => (g.dietaryRestrictions || g.foodPreference));
  guestsWithDiet.forEach(guest => {
    if (isSeated(guest.id)) return;
    const key = dietKey(guest);
    const tableWithSameDiet = tables.find(t =>
      result[t.id].length < t.capacity &&
      result[t.id].some(seated => dietKey(seated) === key)
    );
    if (tableWithSameDiet && tryPlace(guest, tableWithSameDiet)) return;
    tryPlace(guest);
  });

  const sortedRemaining = [...guests]
    .filter(g => !isSeated(g.id))
    .sort((a, b) => {
      const aD = !!(a.dietaryRestrictions || a.foodPreference) ? 1 : 0;
      const bD = !!(b.dietaryRestrictions || b.foodPreference) ? 1 : 0;
      if (bD !== aD) return bD - aD;
      const aP = !!(a.seatingPreference || a.seatingNotes) ? 1 : 0;
      const bP = !!(b.seatingPreference || b.seatingNotes) ? 1 : 0;
      return bP - aP;
    });

  let tableIndex = 0;
  for (const guest of sortedRemaining) {
    if (isSeated(guest.id)) continue;
    let placed = false;
    for (let i = 0; i < tables.length; i++) {
      const table = tables[(tableIndex + i) % tables.length];
      if (result[table.id].length < table.capacity) {
        result[table.id].push(guest);
        placed = true;
        tableIndex = (tableIndex + i) % tables.length;
        break;
      }
    }
    if (!placed) {
      const first = tables.find(t => result[t.id].length < t.capacity);
      if (first) result[first.id].push(guest);
    }
  }

  return result;
}

function generateSeatingSuggestions(plan: Record<string, Guest[]>, tables: Table[]): string[] {
  const suggestions: string[] = [];

  tables.forEach(table => {
    const guests = plan[table.id];
    const capacity = table.capacity;

    if (guests.length === 0) {
      suggestions.push(`Table "${table.name}" is empty - consider adding guests or removing it`);
    } else if (guests.length === 1) {
      suggestions.push(`Table "${table.name}" has only 1 guest - consider moving someone else here`);
    } else if (guests.length > capacity * 0.8) {
      suggestions.push(`Table "${table.name}" is almost full (${guests.length}/${capacity})`);
    }
  });

  return suggestions;
}

const CHAT_COMPLETIONS = {
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
} as const;

const DEFAULT_MODEL = { openai: "gpt-4o-mini", deepseek: "deepseek-chat" } as const;

export type SeatingAssignment = { guestId: string; tableId: string };

/**
 * Usadzenie gości przez LLM (OpenAI/DeepSeek) na podstawie opisów preferencji (seatingPreference, seatingNotes).
 * Respektuje gospodarstwa domowe (householdId) – osoby z tym samym householdId muszą być przy tym samym stole.
 */
export async function generateSeatingPlanWithLLM(input: SeatingInput): Promise<{
  success: boolean;
  plan?: Record<string, Guest[]>;
  assignments?: SeatingAssignment[];
  error?: string;
}> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();
  const provider = explicitProvider || (deepseekKey ? "deepseek" : "openai");
  const apiKey = provider === "deepseek" ? deepseekKey : openaiKey;
  if (!apiKey) {
    return { success: false, error: "Brak klucza API (OPENAI_API_KEY lub DEEPSEEK_API_KEY). Ustaw w .env.local." };
  }

  const { guests, tables, eventName } = input;
  const guestTables = tables.filter((t) => !t.isCoupleTable);
  if (guestTables.length === 0) {
    return { success: false, error: "Brak stołów do usadzenia." };
  }

  const guestList = guests
    .map(
      (g) =>
        `- id: "${g.id}", imię: "${g.name}"${g.group ? `, gospodarstwo/rodzina: "${g.group}"` : ""}${g.seatingPreference ? `, preferencje usadzenia: "${g.seatingPreference}"` : ""}${g.seatingNotes ? `, uwagi: "${g.seatingNotes}"` : ""}`
    )
    .join("\n");
  const tableList = guestTables.map((t) => `- id: "${t.id}", nazwa: "${t.name}", pojemność: ${t.capacity}`).join("\n");

  const systemPrompt = `Jesteś ekspertem od usadzania gości na weselu. Na podstawie listy gości i ich PREFERENCJI USADZENIA (opis tekstowy przy każdym gościu) przypisujesz każdego gościa do dokładnie jednego stołu.

Zasady:
1. Goście z tym samym "gospodarstwo/rodzina" (householdId) MUSZĄ siedzieć przy tym samym stole.
2. Respektuj opisy preferencji: np. "blisko rodziny Kowalskich" = stół z Kowalskimi, "z koleżankami z pracy" = ten sam stół co koleżanki, "z dala od głośników" = stół z dala od DJ, "przy oknie" = stół przy oknie. Interpretuj opisy naturalnie.
3. Żaden stół nie może przekroczyć pojemności (capacity).
4. Każdy gość musi być przypisany do dokładnie jednego stołu (użyj tylko podanych tableId).
5. Zwracasz TYLKO poprawny JSON, bez markdown. Format: { "assignments": [ { "guestId": "id gościa", "tableId": "id stołu" } ] }
6. Użyj wyłącznie guestId i tableId z podanej listy.`;

  const userPrompt = `Wydarzenie: ${eventName || "Wesele"}.

Goście (id, imię, gospodarstwo, preferencje usadzenia, uwagi):
${guestList}

Stoły (id, nazwa, pojemność):
${tableList}

Przypisz każdego gościa do jednego stołu. Respektuj gospodarstwa domowe i opisy preferencji. Zwróć JSON z polem "assignments" (tablica obiektów z guestId i tableId).`;

  const url = provider === "deepseek" ? CHAT_COMPLETIONS.deepseek : CHAT_COMPLETIONS.openai;
  const model = provider === "deepseek" ? (process.env.DEEPSEEK_TASKS_MODEL || DEFAULT_MODEL.deepseek) : (process.env.OPENAI_TASKS_MODEL || DEFAULT_MODEL.openai);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `API: ${res.status} ${errText.slice(0, 200)}` };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return { success: false, error: "Brak odpowiedzi z AI." };

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { assignments?: SeatingAssignment[] };
    const assignments = Array.isArray(parsed.assignments) ? parsed.assignments : [];
  const guestMap = new Map(guests.map((g) => [g.id, g]));
  const tableIds = new Set(guestTables.map((t) => t.id));
  const capacityByTable = new Map(guestTables.map((t) => [t.id, t.capacity]));
  const plan: Record<string, Guest[]> = {};
  guestTables.forEach((t) => (plan[t.id] = []));
  const placed = new Set<string>();

  for (const { guestId, tableId } of assignments) {
    if (!tableIds.has(tableId) || placed.has(guestId)) continue;
    const guest = guestMap.get(guestId);
    const cap = capacityByTable.get(tableId) ?? 0;
    if (guest && plan[tableId].length < cap) {
      plan[tableId].push(guest);
      placed.add(guestId);
    }
  }

  return { success: true, plan, assignments };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Błąd generowania usadzenia";
    return { success: false, error: msg };
  }
}