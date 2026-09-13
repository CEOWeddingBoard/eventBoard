import {
  SUBSCRIPTION_STATUS,
  isVenueBillingEnabled,
  type ClerkBillingMetadata,
  type SubscriptionStatus,
} from "@/lib/billing";

export type AccessMetadata = ClerkBillingMetadata;

const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
];

export function isTrialActive(trialEndsAt: string | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() > Date.now();
}

export function hasActiveSubscription(metadata: AccessMetadata): boolean {
  const status = metadata.subscriptionStatus;
  if (status && ACTIVE_SUBSCRIPTION_STATUSES.includes(status)) {
    const periodEnd = metadata.subscriptionCurrentPeriodEnd;
    if (periodEnd && new Date(periodEnd).getTime() <= Date.now()) {
      return false;
    }
    return true;
  }
  if (metadata.paidAt && !status) {
    return true;
  }
  return false;
}

/** Dostęp: aktywna subskrypcja Stripe lub darmowy miesiąc w aplikacji (bez karty). */
export function hasAppAccess(metadata: AccessMetadata): boolean {
  if (hasActiveSubscription(metadata)) return true;
  return isTrialActive(metadata.trialEndsAt);
}

function hasActiveVenueSubscription(metadata: AccessMetadata): boolean {
  const status = metadata.venueSubscriptionStatus;
  if (status && ACTIVE_SUBSCRIPTION_STATUSES.includes(status)) {
    const periodEnd = metadata.venueSubscriptionCurrentPeriodEnd;
    if (periodEnd && new Date(periodEnd).getTime() <= Date.now()) {
      return false;
    }
    return true;
  }
  if (metadata.venuePaidAt && !status) return true;
  return false;
}

/** Dostęp do panelu organizatora wesel (sala / planner). */
export function hasVenueAppAccess(metadata: AccessMetadata): boolean {
  if (!isVenueBillingEnabled()) return true;
  return hasActiveVenueSubscription(metadata);
}

export function isVenuePaymentPending(metadata: AccessMetadata): boolean {
  if (!isVenueBillingEnabled()) return false;
  return !!metadata.venuePaymentPendingAt && !hasVenueAppAccess(metadata);
}

export function requiresTermsAcceptance(metadata: AccessMetadata): boolean {
  return !metadata.termsAcceptedAt;
}

export function isPaymentPending(metadata: AccessMetadata): boolean {
  return !!metadata.paymentPendingAt && !hasActiveSubscription(metadata);
}

export function isOnAppTrialOnly(metadata: AccessMetadata): boolean {
  return isTrialActive(metadata.trialEndsAt) && !hasActiveSubscription(metadata);
}

/** Subskrypcja była, ale wygasła lub płatność się nie powiodła. */
export function hasBillingFailure(metadata: AccessMetadata): boolean {
  const status = metadata.subscriptionStatus;
  if (
    status === SUBSCRIPTION_STATUS.PAST_DUE ||
    status === SUBSCRIPTION_STATUS.CANCELED ||
    status === SUBSCRIPTION_STATUS.INCOMPLETE
  ) {
    return true;
  }
  if (metadata.stripeSubscriptionId && !hasActiveSubscription(metadata)) {
    return true;
  }
  return false;
}
