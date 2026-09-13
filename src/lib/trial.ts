/** Darmowy okres w aplikacji — bez karty; po TRIAL_DAYS wymagany paywall. */
export const TRIAL_DAYS = 30;

export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export function trialEndsAtFromCreatedAt(createdAtMs: number): string {
  return new Date(createdAtMs + TRIAL_MS).toISOString();
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}
