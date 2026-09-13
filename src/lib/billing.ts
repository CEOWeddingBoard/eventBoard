import { TRIAL_DAYS } from "@/lib/trial";

export const BILLING_CURRENCY = "pln" as const;

/** Cena miesięczna w groszach (Stripe unit_amount). */
export const PRICE_MONTHLY_PLN = 5900;

export const CHECKOUT_PRODUCT_NAME = "Wedding Board — subskrypcja miesięczna";

export const CHECKOUT_PRODUCT_DESCRIPTION =
  "Pełny dostęp do Wedding Board (goście, budżet, zadania, usadzenie, zaproszenia). Cena 59 zł brutto miesięcznie — sprzedawca zwolniony z VAT (art. 113). Odnowienie automatyczne kartą.";

/** Stopka faktury — zwolnienie podmiotowe (limit 200 000 zł). Nadpisz przez STRIPE_INVOICE_VAT_FOOTER. */
export const INVOICE_VAT_EXEMPT_FOOTER_DEFAULT =
  "Sprzedawca zwolniony z podatku VAT na podstawie art. 113 ust. 1 ustawy o podatku od towarów i usług (nieprzekroczenie limitu 200 000 zł obrotu).";

export function getInvoiceVatExemptFooter(): string {
  const custom = process.env.STRIPE_INVOICE_VAT_FOOTER?.trim();
  return custom || INVOICE_VAT_EXEMPT_FOOTER_DEFAULT;
}

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  INCOMPLETE: "incomplete",
  PENDING: "pending",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export type ClerkBillingMetadata = {
  termsAcceptedAt?: string;
  trialEndsAt?: string;
  paidAt?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionCurrentPeriodEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCancelAt?: string;
  paymentPendingAt?: string;
  onboardingPaymentDone?: boolean;
  welcomeEmailSentAt?: string;
  /** Panel organizatora wesel (sala / planner) — osobna subskrypcja B2B */
  venueSubscriptionStatus?: SubscriptionStatus;
  venueStripeSubscriptionId?: string;
  venueSubscriptionCurrentPeriodEnd?: string;
  venueSubscriptionCancelAtPeriodEnd?: boolean;
  venueSubscriptionCancelAt?: string;
  venuePaymentPendingAt?: string;
  venuePaidAt?: string;
};

export const VENUE_PRICE_MONTHLY_PLN = 15000;

// New pricing tiers (2026)
export const VENUE_PRICE_TIERS = {
  starter: { amountGrosze: 19900, label: "Starter", limit: "do 20 wesel/rok" },
  pro: { amountGrosze: 29900, label: "Pro", limit: "nielimitowane" },
  premium: { amountGrosze: 39900, label: "Premium", limit: "nielimitowane + dedykowany opiekun" },
} as const;

export const VENUE_DEFAULT_PLAN = "starter" as keyof typeof VENUE_PRICE_TIERS;

export const VENUE_CHECKOUT_PRODUCT_NAME =
  "Wedding Board — Panel Organizatora Wesel";

export const VENUE_CHECKOUT_PRODUCT_DESCRIPTION =
  "Panel sali weselnej: rezerwacje, CRM, oferty, umowy, portal pary, kuchnia BEO, grafik, opinie. 199–399 zł brutto/miesiąc — sprzedawca zwolniony z VAT (art. 113).";

/** Płatność za panel organizatora — domyślnie wyłączona (dostęp za darmo). */
export function isVenueBillingEnabled(): boolean {
  return process.env.VENUE_BILLING_ENABLED === "true";
}

export function formatPricePln(amountGrosze: number): string {
  return `${Math.round(amountGrosze / 100)} zł`;
}

export function getTrialLabelPl(): string {
  return `${TRIAL_DAYS} dni`;
}

export function getTrialLabelEn(): string {
  return TRIAL_DAYS === 30 ? "1 month" : `${TRIAL_DAYS} days`;
}
