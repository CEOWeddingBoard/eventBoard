/**
 * Ankieta do generowania wzoru zaproszeń AI.
 * Na podstawie odpowiedzi generowany jest spersonalizowany projekt zaproszenia.
 */
export interface InvitationQuestionnaire {
  /** Styl zaproszenia */
  style: "klasyczny" | "nowoczesny" | "boho" | "rustykalny" | "elegancki" | "minimalistyczny";
  /** Kolor główny (hex, np. #D4AF37) */
  primaryColor: string;
  /** Kolor drugi / tło (hex) */
  secondaryColor: string;
  /** Ton: ciepły, formalny, swobodny */
  tone: "cieply" | "formalny" | "swobodny";
  /** Tekst powitalny (np. "Mamy zaszczyt zaprosić") */
  welcomeText: string;
  /** Podpis (np. "Anna i Jan", "Para Młoda") */
  signature: string;
  /** Dodatkowe informacje (dress code, parking, godziny) */
  extraInfo: string;
  /** Czcionka / charakter: tradycyjna, nowoczesna, ozdobna */
  fontStyle: "tradycyjna" | "nowoczesna" | "ozdobna";
  /** Przykładowe zaproszenie (tekst lub HTML) – AI użyje go jako wzoru do stylu i struktury */
  exampleInvitation?: string;
  /** Obraz wzoru zaproszenia (base64 data URL) – AI analizuje obraz (kolory, układ, styl) i generuje projekt na tej podstawie */
  exampleImageBase64?: string;
}

export const INVITATION_STYLES = [
  { value: "klasyczny", label: "Klasyczny" },
  { value: "nowoczesny", label: "Nowoczesny" },
  { value: "boho", label: "Boho" },
  { value: "rustykalny", label: "Rustykalny" },
  { value: "elegancki", label: "Elegancki" },
  { value: "minimalistyczny", label: "Minimalistyczny" },
] as const;

export const INVITATION_TONES = [
  { value: "cieply", label: "Ciepły i serdeczny" },
  { value: "formalny", label: "Formalny" },
  { value: "swobodny", label: "Swobodny" },
] as const;

export const INVITATION_FONT_STYLES = [
  { value: "tradycyjna", label: "Tradycyjna (np. Georgia)" },
  { value: "nowoczesna", label: "Nowoczesna (np. sans-serif)" },
  { value: "ozdobna", label: "Ozdobna (np. kaligrafia)" },
] as const;

export const DEFAULT_QUESTIONNAIRE: InvitationQuestionnaire = {
  style: "klasyczny",
  primaryColor: "#D4AF37",
  secondaryColor: "#F5E6D3",
  tone: "cieply",
  welcomeText: "Mamy zaszczyt zaprosić",
  signature: "Para Młoda",
  extraInfo: "",
  fontStyle: "tradycyjna",
  exampleInvitation: "",
};
