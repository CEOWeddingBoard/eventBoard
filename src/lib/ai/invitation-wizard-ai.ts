/**
 * Kreator zaproszeń: wywiad → OpenRouter (domyślnie darmowy model :free).
 * Przy braku klucza / kredytów (402) — lokalny fallback bez API.
 */

import type { InvitationQuestionnaire } from "./invitation-types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
/** Tani model płatny — stabilny, bez limitów :free. */
const PAID_MODEL = "google/gemini-2.5-flash";
const DEFAULT_MODEL = PAID_MODEL;
const FREE_FALLBACK_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

function invitationModelsChain(configured: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  for (const m of [configured, PAID_MODEL, FREE_FALLBACK_MODEL]) {
    if (m && !seen.has(m)) {
      seen.add(m);
      chain.push(m);
    }
  }
  return chain;
}

export type Occasion = "slub";
export type VisualStyle =
  | "minimalistyczny"
  | "boho"
  | "cyberpunk"
  | "glamour"
  | "klasyczny"
  | "elegancki"
  | "nowoczesny"
  | "rustykalny";
export type Vibe = "formalny" | "zabawny" | "rymowany" | "cieply";

export interface WizardKeyData {
  who: string;
  when: string;
  where: string;
  rsvpBy: string;
}

export interface WizardAnswers {
  occasion: Occasion;
  visualStyle: VisualStyle;
  keyData: WizardKeyData;
  vibe: Vibe;
  /** Pełny brief papeterii (opcjonalnie) */
  briefContext?: string;
}

const STYLE_COLORS: Record<string, { primary: string; secondary: string }> = {
  boho: { primary: "#8B7355", secondary: "#D4A574" },
  klasyczny: { primary: "#D4AF37", secondary: "#F5E6D3" },
  nowoczesny: { primary: "#2C3E50", secondary: "#ECF0F1" },
  rustykalny: { primary: "#8B4513", secondary: "#DEB887" },
  elegancki: { primary: "#1A1A1A", secondary: "#F5F5DC" },
  minimalistyczny: { primary: "#333333", secondary: "#F8F8F8" },
  glamour: { primary: "#8B4513", secondary: "#FFF8E7" },
  cyberpunk: { primary: "#00FFFF", secondary: "#1A1A2E" },
};

function buildPrompt(answers: WizardAnswers): string {
  const { occasion, visualStyle, keyData, vibe, briefContext } = answers;
  const briefBlock = briefContext?.trim()
    ? `\n\nPełny brief projektantki papeterii:\n${briefContext.trim()}`
    : "";
  return `Jesteś ekspertem od zaproszeń ślubnych i papeterii weselnej. Na podstawie wywiadu zaproponuj copy zaproszenia w języku polskim.

Wywiad:
- Okazja: ${occasion === "slub" ? "Ślub" : occasion}
- Styl wizualny: ${visualStyle}
- Kto (para / nazwa wesela): ${keyData.who}
- Kiedy: ${keyData.when}
- Gdzie: ${keyData.where}
- RSVP do kiedy: ${keyData.rsvpBy}
- Vibe / ton: ${vibe}${briefBlock}

Zwróć TYLKO jeden poprawny obiekt JSON (bez markdown, bez \`\`\`), z polami:
- welcomeText: string (krótki tekst zaproszenia, dopasowany do vibe: np. "mają zaszczyt zaprosić", "serdecznie zapraszają", przy rymowanym – krótki wers)
- signature: string (podpis, np. "Anna i Jan", "Para Młoda")
- primaryColor: string (hex koloru głównego, dopasowany do stylu wizualnego; dla glamour np. #8B4513, dla cyberpunk #0ff, dla minimalistycznego #2C2C2C)
- secondaryColor: string (hex tła, np. #FAF9F7, #F5E6D3)
- extraInfo: string (1-2 zdania: prośba o RSVP do podanej daty, dress code, parking – lub pusta "")
- style: string (jedna z: klasyczny, nowoczesny, boho, rustykalny, elegancki, minimalistyczny – najbliższa do visualStyle)
- tone: string (cieply | formalny | swobodny – z vibe)
- fontStyle: "tradycyjna" | "nowoczesna" | "ozdobna"
- imagePrompt: string (krótki opis po angielsku do generatora obrazów: styl karty zaproszenia, kolory, nastrój, max 2 zdania)

Przykład:
{"welcomeText":"mają zaszczyt zaprosić","signature":"Para Młoda","primaryColor":"#2C2C2C","secondaryColor":"#FAF9F7","extraInfo":"Prosimy o potwierdzenie przybycia do 31 lipca 2025.","style":"elegancki","tone":"cieply","fontStyle":"nowoczesna","imagePrompt":"Elegant minimalist wedding invitation card, cream background, dark gray serif text, soft gold accent line, flat design."}`;
}

export interface GenerateFromWizardResult {
  questionnaire: Partial<InvitationQuestionnaire>;
  imagePrompt?: string;
  raw?: string;
  /** true gdy użyto lokalnego szablonu zamiast OpenRouter */
  usedFallback?: boolean;
  warning?: string;
}

const STYLE_MAP: Record<string, InvitationQuestionnaire["style"]> = {
  minimalistyczny: "minimalistyczny",
  boho: "boho",
  cyberpunk: "nowoczesny",
  glamour: "elegancki",
  klasyczny: "klasyczny",
  elegancki: "elegancki",
  nowoczesny: "nowoczesny",
  rustykalny: "rustykalny",
};

const TONE_MAP: Record<string, InvitationQuestionnaire["tone"]> = {
  formalny: "formalny",
  zabawny: "swobodny",
  rymowany: "cieply",
  cieply: "cieply",
  swobodny: "swobodny",
};

function welcomeForVibe(vibe: Vibe): string {
  switch (vibe) {
    case "formalny":
      return "mają zaszczyt zaprosić";
    case "zabawny":
      return "serdecznie zapraszają na wesele";
    case "rymowany":
      return "z radością zapraszają";
    default:
      return "mają ogromną przyjemność zaprosić";
  }
}

function parseWizardJson(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parsedToResult(parsed: Record<string, unknown>): GenerateFromWizardResult {
  const styleStr = String(parsed.style ?? "elegancki");
  const toneStr = String(parsed.tone ?? "cieply");

  const questionnaire: Partial<InvitationQuestionnaire> = {
    welcomeText: typeof parsed.welcomeText === "string" ? parsed.welcomeText : "mają zaszczyt zaprosić",
    signature: typeof parsed.signature === "string" ? parsed.signature : "Para Młoda",
    primaryColor: typeof parsed.primaryColor === "string" ? parsed.primaryColor : "#2C2C2C",
    secondaryColor: typeof parsed.secondaryColor === "string" ? parsed.secondaryColor : "#FAF9F7",
    extraInfo: typeof parsed.extraInfo === "string" ? parsed.extraInfo : "",
    style: STYLE_MAP[styleStr] ?? "elegancki",
    tone: TONE_MAP[toneStr] ?? "cieply",
    fontStyle: ["tradycyjna", "nowoczesna", "ozdobna"].includes(String(parsed.fontStyle))
      ? (parsed.fontStyle as InvitationQuestionnaire["fontStyle"])
      : "nowoczesna",
  };

  const imagePrompt =
    typeof parsed.imagePrompt === "string" && parsed.imagePrompt.trim()
      ? parsed.imagePrompt.trim()
      : undefined;

  return { questionnaire, imagePrompt };
}

/** Lokalny szablon — działa bez OpenRouter (testy, brak kredytów). */
export function buildFallbackWizardResult(answers: WizardAnswers): GenerateFromWizardResult {
  const colors = STYLE_COLORS[answers.visualStyle] ?? STYLE_COLORS.klasyczny;
  const signature = answers.keyData.who.trim() || "Para Młoda";
  const rsvpLine = answers.keyData.rsvpBy.trim()
    ? `Prosimy o potwierdzenie przybycia do ${answers.keyData.rsvpBy}.`
    : "";

  const questionnaire: Partial<InvitationQuestionnaire> = {
    welcomeText: welcomeForVibe(answers.vibe),
    signature,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    extraInfo: rsvpLine,
    style: STYLE_MAP[answers.visualStyle] ?? "elegancki",
    tone: TONE_MAP[answers.vibe] ?? "cieply",
    fontStyle: answers.visualStyle === "minimalistyczny" || answers.visualStyle === "nowoczesny"
      ? "nowoczesna"
      : "tradycyjna",
  };

  const imagePrompt = [
    "Elegant wedding invitation card",
    answers.visualStyle,
    `colors ${colors.primary} and ${colors.secondary}`,
    "flat print design, no text",
  ].join(", ");

  return {
    questionnaire,
    imagePrompt,
    usedFallback: true,
    warning:
      "Użyto lokalnego szablonu (brak kredytów OpenRouter lub brak klucza API). PDF wektorowy nadal działa.",
  };
}

function isCreditsError(status: number, errText: string): boolean {
  return status === 402 || errText.includes("Insufficient credits");
}

async function callOpenRouter(model: string, prompt: string, apiKey: string): Promise<Response> {
  return fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1024,
    }),
  });
}

/**
 * OpenRouter z fallbackiem: darmowy model → lokalny szablon przy 402/braku klucza.
 */
export async function generateInvitationFromWizard(
  answers: WizardAnswers
): Promise<GenerateFromWizardResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return buildFallbackWizardResult(answers);
  }

  const configured = process.env.OPENROUTER_INVITATION_MODEL?.trim() || DEFAULT_MODEL;
  const modelsToTry = invitationModelsChain(configured);

  const prompt = buildPrompt(answers);
  let lastErr = "";

  for (const model of modelsToTry) {
    const res = await callOpenRouter(model, prompt, apiKey);
    if (res.ok) {
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) continue;
      const parsed = parseWizardJson(text);
      if (parsed) return parsedToResult(parsed);
      lastErr = "invalid JSON";
      continue;
    }

    const errText = await res.text();
    lastErr = `${res.status} ${errText.slice(0, 200)}`;
    if (isCreditsError(res.status, errText)) {
      console.warn(`[OpenRouter] ${model} → 402, próbuję następny model...`);
      continue;
    }
    if (res.status === 429) {
      console.warn(`[OpenRouter] ${model} → 429 rate limit, próbuję następny model...`);
      continue;
    }
    break;
  }

  console.warn("[OpenRouter] Wizard fallback:", lastErr);
  const fallback = buildFallbackWizardResult(answers);
  if (lastErr.includes("429")) {
    fallback.warning =
      "Modele OpenRouter chwilowo przeciążone (429). Użyto lokalnego szablonu — PDF wektorowy działa. Spróbuj ponownie za minutę.";
  } else if (lastErr.includes("402") || lastErr.includes("Insufficient credits")) {
    fallback.warning =
      "Brak kredytów OpenRouter — użyto lokalnego szablonu. Doładowanie: openrouter.ai/settings/credits. Grafika AI wymaga kredytów; PDF wektorowy działa.";
  }
  return fallback;
}
