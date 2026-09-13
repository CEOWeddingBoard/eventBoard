export const CONTRACT_TYPES = ["MAIN", "ANNEX", "REGULATIONS", "GDPR", "OTHER"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_STATUSES = [
  "DRAFT",
  "SENT_FOR_SIGNING",
  "SIGNED_BY_COUPLE",
  "SIGNED_BY_VENUE",
  "SIGNED_BOTH",
  "REJECTED",
  "EXPIRED",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface ContractTemplateInput {
  name: string;
  type: ContractType;
  docxUrl?: string | null;
  placeholders: string[];
}

export interface ContractFillData {
  [key: string]: string | number | boolean;
}

export interface ContractSigningRequest {
  signedByName: string;
  signedByEmail: string;
  signatureDataUrl: string;
}

export interface ContractEmailPayload {
  coupleName: string;
  coupleEmail: string;
  venueName: string;
  contractId: string;
  signingToken: string;
}

export const TYPE_LABELS: Record<string, string> = {
  MAIN: "Umowa główna",
  ANNEX: "Aneks",
  REGULATIONS: "Regulamin",
  GDPR: "RODO / zgody",
  OTHER: "Inne",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Szkic",
  SENT_FOR_SIGNING: "Wysłano do podpisu",
  SIGNED_BY_COUPLE: "Podpisana przez parę",
  SIGNED_BY_VENUE: "Podpisana przez salę",
  SIGNED_BOTH: "Podpisana obustronnie",
  REJECTED: "Odrzucona",
  EXPIRED: "Wygasła",
};

export const PRESET_PLACEHOLDERS: Record<string, string> = {
  coupleName: "Imię i nazwisko pary młodej",
  coupleEmail: "Email pary młodej",
  couplePhone: "Telefon pary młodej",
  venueName: "Nazwa sali",
  venueAddress: "Adres sali",
  weddingDate: "Data wesela",
  weddingTime: "Godzina rozpoczęcia",
  guestCount: "Liczba gości",
  totalPrice: "Cena całkowita",
  advancePayment: "Zaliczka",
  paymentDeadline: "Termin płatności",
  menuSelection: "Wybrane menu",
  additionalServices: "Dodatkowe usługi",
  contractDate: "Data zawarcia umowy",
  specialConditions: "Warunki specjalne",
  venueRepName: "Imię i nazwisko przedstawiciela sali",
  venueRepEmail: "Email przedstawiciela sali",
  venueRepPhone: "Telefon przedstawiciela sali",
};
