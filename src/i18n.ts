import { getRequestConfig } from "next-intl/server";
import { localeMessages } from "./lib/locale-messages";

const locales = ["en", "pl"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = "en";
  }
  const key = locale as keyof typeof localeMessages;
  return {
    locale,
    messages: localeMessages[key],
  };
});
