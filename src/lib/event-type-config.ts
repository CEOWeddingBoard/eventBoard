import type { EventType } from "@/lib/validations/event";

export type ConfigurableSection =
  | "brideGroom"
  | "guestListPlusButton"
  | "guestImportCsv"
  | "fullGuestList"
  | "allergensOnlyList"
  | "seating"
  | "budget"
  | "vendors"
  | "rsvpPortal"
  | "weddingWebsite"
  | "invitations"
  | "moodboard"
  | "gifts"
  | "photos"
  | "analytics"
  | "tasks";

export interface EventTypeConfig {
  eventType: EventType;
  label: string;
  icon: string;
  visibleSections: ConfigurableSection[];
  fields: {
    brideName: boolean;
    groomName: boolean;
    partnerEmail: boolean;
    estimatedGuestCount: boolean;
    targetBudget: boolean;
    ceremonyLocation: boolean;
    receptionLocation: boolean;
    style: boolean;
    dressCode: boolean;
  };
}

const WEDDING_CONFIG: EventTypeConfig = {
  eventType: "WEDDING",
  label: "Wesele",
  icon: "💒",
  visibleSections: [
    "brideGroom",
    "guestListPlusButton",
    "guestImportCsv",
    "fullGuestList",
    "seating",
    "budget",
    "vendors",
    "rsvpPortal",
    "weddingWebsite",
    "invitations",
    "moodboard",
    "gifts",
    "photos",
    "analytics",
    "tasks",
  ],
  fields: {
    brideName: true,
    groomName: true,
    partnerEmail: true,
    estimatedGuestCount: true,
    targetBudget: true,
    ceremonyLocation: true,
    receptionLocation: true,
    style: true,
    dressCode: true,
  },
};

const COMMUNION_CONFIG: EventTypeConfig = {
  eventType: "COMMUNION",
  label: "Komunia",
  icon: "🕊️",
  visibleSections: [
    "allergensOnlyList",
    "seating",
    "vendors",
    "photos",
    "tasks",
  ],
  fields: {
    brideName: false,
    groomName: false,
    partnerEmail: false,
    estimatedGuestCount: true,
    targetBudget: false,
    ceremonyLocation: true,
    receptionLocation: true,
    style: false,
    dressCode: false,
  },
};

const CHRISTMAS_EVE_CONFIG: EventTypeConfig = {
  eventType: "CHRISTMAS_EVE",
  label: "Wigilia",
  icon: "🎄",
  visibleSections: [
    "allergensOnlyList",
    "seating",
    "vendors",
    "photos",
    "tasks",
  ],
  fields: {
    brideName: false,
    groomName: false,
    partnerEmail: false,
    estimatedGuestCount: true,
    targetBudget: false,
    ceremonyLocation: false,
    receptionLocation: true,
    style: false,
    dressCode: false,
  },
};

const CORPORATE_CONFIG: EventTypeConfig = {
  eventType: "CORPORATE",
  label: "Firmowa",
  icon: "🏢",
  visibleSections: [
    "fullGuestList",
    "guestImportCsv",
    "seating",
    "budget",
    "vendors",
    "photos",
    "tasks",
  ],
  fields: {
    brideName: false,
    groomName: false,
    partnerEmail: false,
    estimatedGuestCount: true,
    targetBudget: true,
    ceremonyLocation: false,
    receptionLocation: true,
    style: false,
    dressCode: true,
  },
};

const OTHER_CONFIG: EventTypeConfig = {
  eventType: "OTHER",
  label: "Inne",
  icon: "🎉",
  visibleSections: [
    "guestListPlusButton",
    "fullGuestList",
    "allergensOnlyList",
    "seating",
    "budget",
    "vendors",
    "photos",
    "tasks",
  ],
  fields: {
    brideName: true,
    groomName: true,
    partnerEmail: true,
    estimatedGuestCount: true,
    targetBudget: true,
    ceremonyLocation: true,
    receptionLocation: true,
    style: true,
    dressCode: true,
  },
};

const EVENT_TYPE_CONFIG_MAP: Record<EventType, EventTypeConfig> = {
  WEDDING: WEDDING_CONFIG,
  COMMUNION: COMMUNION_CONFIG,
  CHRISTMAS_EVE: CHRISTMAS_EVE_CONFIG,
  CORPORATE: CORPORATE_CONFIG,
  OTHER: OTHER_CONFIG,
};

export function getEventTypeConfig(eventType: string): EventTypeConfig {
  return EVENT_TYPE_CONFIG_MAP[eventType as EventType] ?? OTHER_CONFIG;
}

export function isSectionVisible(eventType: string, section: ConfigurableSection): boolean {
  const config = getEventTypeConfig(eventType);
  return config.visibleSections.includes(section);
}

export function useEventTypeConfig(eventType: string): EventTypeConfig {
  return getEventTypeConfig(eventType);
}
