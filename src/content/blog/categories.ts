import type { BlogCategory } from "./types";

export const categoryOrder: BlogCategory[] = [
  "organizacja",
  "stoly",
  "goscie",
  "budzet",
  "zadania",
  "narzedzia",
];

export const categoryMeta: Record<
  "pl" | "en",
  Record<BlogCategory, { title: string; description: string }>
> = {
  pl: {
    organizacja: {
      title: "Harmonogram i organizacja",
      description: "Terminy, kolejność decyzji i plan działania od zaręczyn do dnia ślubu.",
    },
    budzet: {
      title: "Budżet i finanse",
      description: "Koszty wesela, podział wydatków i sposoby na kontrolę budżetu bez niespodzianek.",
    },
    goscie: {
      title: "Goście i zaproszenia",
      description: "Lista gości, RSVP, zaproszenia i komunikacja z bliskimi przed uroczystością.",
    },
    stoly: {
      title: "Usadzenie gości",
      description: "Plan stołów, reguły rozsadzenia i przygotowanie sali do przyjęcia.",
    },
    zadania: {
      title: "Checklisty i zadania",
      description: "Listy zadań, harmonogramy i nic nieumknięte w ostatnich miesiącach przed ślubem.",
    },
    narzedzia: {
      title: "Narzędzia planowania",
      description: "Aplikacja do planowania wesela, Excel i sposoby, żeby nie gubić się między plikami.",
    },
  },
  en: {
    organizacja: {
      title: "Timeline & planning",
      description: "Key milestones and decisions from engagement to wedding day.",
    },
    budzet: {
      title: "Budget & finances",
      description: "Wedding costs, expense breakdown and staying on track.",
    },
    goscie: {
      title: "Guests & invitations",
      description: "Guest lists, RSVP, invitations and communication before the big day.",
    },
    stoly: {
      title: "Seating & layout",
      description: "Seating charts, table rules and preparing the venue.",
    },
    zadania: {
      title: "Checklists & tasks",
      description: "Task lists and timelines so nothing slips through.",
    },
    narzedzia: {
      title: "Planning tools",
      description: "Spreadsheets, apps and keeping everything in one place.",
    },
  },
};
