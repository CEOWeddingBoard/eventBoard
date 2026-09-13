/** Definicje wszystkich dostępnych modułów eventu — używane w konfiguratorze kategorii */

import {
  Users,
  UtensilsCrossed,
  CalendarDays,
  Wallet,
  Armchair,
  Store,
  Image,
  BarChart3,
  ListTodo,
  Link,
  Palette,
  FileText,
  Globe,
  Gift,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: "basic" | "premium";
  defaultEnabled: boolean;
}

export const ALL_MODULES: ModuleDefinition[] = [
  // --- Podstawowe ---
  {
    id: "guests_full",
    label: "Pełna lista gości",
    description: "Imię, dieta, alergie, nocleg, transport, grupy, import CSV",
    icon: Users,
    category: "basic",
    defaultEnabled: true,
  },
  {
    id: "guests_allergens",
    label: "Tylko alergeny",
    description: "Lista gości tylko z zaznaczeniem: vege, gluten, bezgluten, inne",
    icon: Users,
    category: "basic",
    defaultEnabled: false,
  },
  {
    id: "menu",
    label: "Menu (warianty A/B/C)",
    description: "Warianty menu, grupy wyboru, dania, alergeny, ceny",
    icon: UtensilsCrossed,
    category: "basic",
    defaultEnabled: true,
  },
  {
    id: "schedule",
    label: "Harmonogram / Agenda",
    description: "AI generator, timeline, akceptacja sekcji, głosowe notatki, TTS",
    icon: CalendarDays,
    category: "basic",
    defaultEnabled: true,
  },
  {
    id: "budget",
    label: "Budżet",
    description: "Plan vs rzeczywiste, kategorie kosztów, raporty",
    icon: Wallet,
    category: "basic",
    defaultEnabled: false,
  },
  {
    id: "seating",
    label: "Stoliki / Usadzenie",
    description: "Plan sali (canvas), stoły, reguły usadzania, winietki PDF",
    icon: Armchair,
    category: "basic",
    defaultEnabled: false,
  },
  {
    id: "vendors",
    label: "Dostawcy",
    description: "Lista dostawców, dokumenty, portal dostawcy",
    icon: Store,
    category: "basic",
    defaultEnabled: false,
  },
  {
    id: "photos",
    label: "Zdjęcia",
    description: "Galeria zdjęć z eventu",
    icon: Image,
    category: "basic",
    defaultEnabled: false,
  },
  {
    id: "tasks",
    label: "Zadania",
    description: "Lista zadań, AI generowanie, role (Pan/Pani Młoda/Wspólnie)",
    icon: ListTodo,
    category: "basic",
    defaultEnabled: true,
  },
  {
    id: "finances",
    label: "Finanse / Raporty",
    description: "Dashboard KPI, przychody, płatności, eksport CSV",
    icon: BarChart3,
    category: "basic",
    defaultEnabled: false,
  },
  {
    id: "board_links",
    label: "Linki / Event Board",
    description: "Konfigurowalne przyciski-skróty (mapa, playlist, menu PDF)",
    icon: Link,
    category: "basic",
    defaultEnabled: true,
  },
  // --- Premium / Ślubne (tylko WESELE) ---
  {
    id: "moodboard",
    label: "Moodboard",
    description: "Tablica inspiracji ślubnych — zapis zdjęć i pomysłów",
    icon: Palette,
    category: "premium",
    defaultEnabled: false,
  },
  {
    id: "invitations",
    label: "Zaproszenia / Papeteria",
    description: "Personalizowane zaproszenia PDF, winietki, szablony",
    icon: FileText,
    category: "premium",
    defaultEnabled: false,
  },
  {
    id: "wedding_website",
    label: "Strona weselna",
    description: "Publiczna strona w/[slug] z informacjami dla gości",
    icon: Globe,
    category: "premium",
    defaultEnabled: false,
  },
  {
    id: "guest_portal",
    label: "Portal gości + RSVP",
    description: "Potwierdzenia, preferencje, życzenia, zdjęcia gości",
    icon: Users,
    category: "premium",
    defaultEnabled: false,
  },
  {
    id: "ai_planner",
    label: "AI Planer ślubny",
    description: "AI generuje pełną listę zadań z timeline 18 miesięcy",
    icon: Sparkles,
    category: "premium",
    defaultEnabled: false,
  },
  {
    id: "gifts",
    label: "Prezenty",
    description: "Lista prezentów, status rezerwacji",
    icon: Gift,
    category: "premium",
    defaultEnabled: false,
  },
];

export function getModuleById(id: string): ModuleDefinition | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export function getDefaultModules(): string[] {
  return ALL_MODULES.filter((m) => m.defaultEnabled).map((m) => m.id);
}

export function getWeddingModules(): string[] {
  return ALL_MODULES.map((m) => m.id);
}
