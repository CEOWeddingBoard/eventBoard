# Spis technologii – Wedding AI Planner

Technologie użyte w projekcie **Wedding AI Planner** (WeedingPlaner).

---

## Język i runtime

| Technologia | Wersja / info |
|-------------|----------------|
| **TypeScript** | ^5 |
| **Node.js** | >=18.17.0 <22 |

---

## Frontend

| Technologia | Zastosowanie |
|-------------|--------------|
| **React** | ^18.3 |
| **Next.js** | ^15.5 (z Turbopack w dev) |
| **Tailwind CSS** | ^3.3 + tailwindcss-animate |
| **Radix UI** | Dialog, Dropdown, Select, Tabs, Alert, Avatar, Checkbox, Label, Popover, Radio, Slot |
| **Lucide React** | Ikony |
| **next-themes** | Tryb ciemny/jasny |
| **next-intl** | Internacjonalizacja (i18n) |
| **React Hook Form** | Formularze |
| **Zod** | Walidacja (z @hookform/resolvers) |
| **TanStack React Query** | Cache i fetching danych |
| **TanStack React Table** | Tabele |
| **Recharts** | Wykresy |
| **@dnd-kit** | Drag & drop (core + sortable) |
| **cmdk** | Command palette |
| **class-variance-authority (cva)** | Warianty komponentów |
| **clsx** + **tailwind-merge** | Łączenie klas CSS |
| **Sonner** | Toasty / powiadomienia |

---

## Backend i API

| Technologia | Zastosowanie |
|-------------|--------------|
| **Next.js API Routes** | Endpointy API |
| **Prisma** | ORM, migracje, seed |
| **PostgreSQL** | Baza danych |
| **Clerk** | Autentykacja (SSO, sesje) |
| **jose** / **jsonwebtoken** | JWT |
| **bcryptjs** | Hasła (jeśli poza Clerk) |
| **Resend** | E-maile |
| **Twilio** | SMS |
| **Stripe** | Płatności |
| **Svix** | Webhooki (np. Clerk) |

---

## Dokumenty i eksport

| Technologia | Zastosowanie |
|-------------|--------------|
| **@react-pdf/renderer** | Generowanie PDF |
| **pdf-lib** + **@pdf-lib/fontkit** | Edycja/kompozycja PDF |
| **xlsx** | Excel (import/eksport) |
| **papaparse** | CSV |
| **qrcode** | Kody QR |

---

## Narzędzia deweloperskie i testy

| Technologia | Zastosowanie |
|-------------|--------------|
| **Jest** | Testy jednostkowe |
| **Testing Library** (React, jest-dom, user-event) | Testy komponentów |
| **Playwright** | Testy E2E |
| **MSW** | Mockowanie API |
| **ESLint** | Linting (eslint-config-next) |
| **Sass** | Style (opcjonalnie) |

---

## Inne

| Technologia | Zastosowanie |
|-------------|--------------|
| **date-fns** | Daty i czas |
| **nanoid** | Identyfikatory |
| **Turbopack** | Szybszy dev build (Next.js) |

---

## Podsumowanie w skrócie

- **Stack:** Next.js 15 (App Router) + React 18 + TypeScript  
- **Stylowanie:** Tailwind CSS + Radix UI  
- **Baza:** PostgreSQL + Prisma  
- **Auth:** Clerk  
- **Płatności:** Stripe  
- **Komunikacja:** Resend (e-mail), Twilio (SMS)  
- **Testy:** Jest, Testing Library, Playwright, MSW  
