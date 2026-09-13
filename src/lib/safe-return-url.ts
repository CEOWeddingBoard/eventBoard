/** Dozwolony tylko względny URL w obrębie bieżącego locale (ochrona przed open redirect). */
export function safeReturnUrl(
  returnTo: string | undefined | null,
  locale: string,
): string | null {
  if (!returnTo || typeof returnTo !== "string") return null;
  const trimmed = returnTo.trim();
  if (!trimmed.startsWith(`/${locale}/`)) return null;
  if (trimmed.includes("//") || trimmed.includes("\\") || trimmed.includes("@")) return null;
  return trimmed;
}
