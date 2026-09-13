import { headers } from "next/headers";

const SUPPORTED = ["pl", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED)[number];

/**
 * Returns preferred locale from Accept-Language when URL has no locale segment
 * (e.g. /login, /register, /sign-in). Defaults to "pl".
 */
export async function getPreferredLocale(): Promise<SupportedLocale> {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (!acceptLanguage) return "pl";
  const first = acceptLanguage.split(",")[0]?.toLowerCase();
  if (first?.startsWith("en")) return "en";
  if (first?.startsWith("pl")) return "pl";
  return "pl";
}
