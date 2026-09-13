# Podręcznik w aplikacji

## Wejście

- **Ikona „Podręcznik”** — lewy dolny róg na każdym ekranie panelu (`HandbookFab`)
- **Konto** → „Podręcznik planera” → `/dashboard/help`
- **Chat** (prawy dolny róg) — odpowiedzi z odesłaniem do podręcznika
- Stary URL `/dashboard/account/instruction` → przekierowanie na `/dashboard/help`

## Pliki

| Element | Ścieżka |
|---------|---------|
| FAB | `src/components/handbook/HandbookFab.tsx` |
| Strona | `src/app/[locale]/dashboard/help/page.tsx` |
| Layout + sekcje | `src/components/handbook/*` |
| Config sekcji | `src/lib/handbook-sections.ts` |
| i18n | `Handbook.*` w `src/locales/pl.json`, `en.json` |

## Treść

Edytuj `Handbook.sections.*` — tylko funkcje widoczne w UI.
