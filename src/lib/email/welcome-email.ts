import { TRIAL_DAYS } from "@/lib/trial";

const INK = "#2d3824";
const GOLD = "#9a8554";
const MUTED = "#4a5c3e";
const BG = "#f8f7f3";
const BORDER = "rgba(125, 141, 110, 0.2)";

export type WelcomeLocale = "pl" | "en";

export interface WelcomeEmailParams {
  firstName: string;
  appName: string;
  ctaUrl: string;
  summaryPoints: string[];
  trialDays: number;
  locale: WelcomeLocale;
}

export function getAppNameForLocale(locale: WelcomeLocale): string {
  return "Wedding Board";
}

export function getWelcomeCtaUrl(baseUrl: string, locale: WelcomeLocale): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/${locale}/welcome`;
}

export function getWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const {
    firstName,
    appName,
    ctaUrl,
    summaryPoints,
    trialDays,
    locale,
  } = params;

  const greeting = locale === "en" ? "Hello" : "Cześć";
  const tagline =
    locale === "en"
      ? "Your wedding planning assistant"
      : "Twój asystent planowania wesela";
  const intro =
    locale === "en"
      ? `Welcome to ${appName}. Thank you for joining us — we will help you stay on top of everything before the big day.`
      : `Witamy Cię w ${appName}. Dziękujemy, że jesteś z nami — pomożemy Ci uporządkować przygotowania do wielkiego dnia.`;
  const featuresTitle =
    locale === "en" ? "In one place you get:" : "W jednym miejscu masz m.in.:";
  const trialNote =
    locale === "en"
      ? `You start with a <strong>${trialDays}-day free trial</strong> — explore the planner and set up your wedding event at your own pace.`
      : `Zaczynasz z <strong>${trialDays} dniami darmowego okresu próbnego</strong> — poznaj Wedding Board i skonfiguruj wesele we własnym tempie.`;
  const nextStep =
    locale === "en"
      ? "Click below to open the planner and create your wedding event."
      : "Kliknij poniżej, aby wejść do Wedding Board i założyć wydarzenie wesela.";
  const ctaLabel =
    locale === "en" ? "Start planning →" : "Rozpocznij planowanie →";
  const footer =
    locale === "en"
      ? `This message was sent after you signed up for ${appName}. Please do not reply to this email.`
      : `Ta wiadomość została wysłana po rejestracji w ${appName}. Nie odpowiadaj na ten e-mail.`;

  const pointsHtml = summaryPoints
    .map(
      (p) =>
        `<li style="margin-bottom: 8px; color: ${MUTED}; line-height: 1.5;">${p}</li>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${greeting}${firstName ? `, ${firstName}` : ""} — ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: ${BG};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BG}; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(45, 56, 36, 0.08); border: 1px solid ${BORDER}; overflow: hidden;">
          <tr>
            <td style="padding: 40px 36px 20px; text-align: center; border-bottom: 1px solid ${BORDER}; background: linear-gradient(180deg, #faf9f6 0%, #ffffff 100%);">
              <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${GOLD}; font-weight: 600;">${locale === "en" ? "Welcome" : "Witamy"}</p>
              <h1 style="margin: 0; font-size: 26px; font-weight: 600; color: ${INK}; letter-spacing: -0.02em;">${appName}</h1>
              <p style="margin: 12px 0 0; font-size: 14px; color: ${MUTED}; font-weight: 500;">${tagline}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 36px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: ${INK}; line-height: 1.3;">
                ${greeting}${firstName ? `, ${firstName}` : ""}! 👋
              </h2>
              <p style="margin: 0 0 16px; font-size: 16px; color: ${INK}; line-height: 1.6;">
                ${intro}
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; color: ${INK}; line-height: 1.6;">
                ${trialNote}
              </p>
              <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: ${INK};">
                ${featuresTitle}
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px;">
                ${pointsHtml}
              </ul>
              <p style="margin: 0 0 24px; font-size: 15px; color: ${INK}; line-height: 1.6;">
                ${nextStep}
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 10px; background: ${GOLD};">
                    <a href="${ctaUrl}" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 36px 32px; text-align: center; border-top: 1px solid ${BORDER};">
              <p style="margin: 0; font-size: 12px; color: ${MUTED}; line-height: 1.5;">
                ${footer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

const DEFAULT_SUMMARY_PL = [
  "Wydarzenie wesela i plan dnia",
  "Lista zadań z terminami",
  "Lista gości i zaproszenia (RSVP)",
  "Budżet i koszty",
  "Usadzenie gości i eksport do kalendarza",
];

const DEFAULT_SUMMARY_EN = [
  "Wedding event and day-of schedule",
  "Task list with due dates",
  "Guest list and RSVP invitations",
  "Budget and expenses",
  "Seating plan and calendar export",
];

export function getWelcomeEmailSubject(locale: WelcomeLocale): string {
  if (locale === "en") {
    return "Welcome to Wedding Board — let's plan your big day";
  }
  return "Witaj w Wedding Board — zaplanujmy Twój wielki dzień";
}

export function getWelcomeSummaryPoints(locale: WelcomeLocale): string[] {
  return locale === "en" ? DEFAULT_SUMMARY_EN : DEFAULT_SUMMARY_PL;
}

export function resolveWelcomeLocale(
  raw: string | undefined | null
): WelcomeLocale {
  return raw === "en" ? "en" : "pl";
}

export function buildWelcomeEmailParams(input: {
  firstName: string;
  baseUrl: string;
  locale: WelcomeLocale;
}): WelcomeEmailParams {
  const locale = input.locale;
  return {
    firstName: input.firstName,
    appName: getAppNameForLocale(locale),
    ctaUrl: getWelcomeCtaUrl(input.baseUrl, locale),
    summaryPoints: getWelcomeSummaryPoints(locale),
    trialDays: TRIAL_DAYS,
    locale,
  };
}
