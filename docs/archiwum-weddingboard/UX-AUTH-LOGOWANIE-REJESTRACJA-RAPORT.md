# Raport UX: Logowanie i rejestracja (perspektywa użytkownika końcowego)

Raport z researchu / testów flow logowania i rejestracji – elementy do potencjalnej poprawy.

---

## 1. Nawigacja i wejście w flow

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Landing** | CTA „Wypróbuj 7 dni za darmo” → `/sign-up`, „Masz konto? Wejdź” → `/sign-in`. Spójne. | — |
| **URL `/login`** | Przekierowanie na `/pl/auth` (strona wyboru: rejestracja vs logowanie), a nie na formularz logowania. | Użytkownik, który klika „Zaloguj” (np. z zewnętrznego linku), dostaje dodatkowy krok. Rozważyć: `/login` → `/{locale}/sign-in`. |
| **URL `/register`** | Przekierowanie na `/pl/sign-up` – bezpośrednio do rejestracji. | OK. |
| **Bez locale** | `/sign-in`, `/sign-up` (w `app/(auth)`) zawsze przekierowują na **pl** (`/pl/auth`, `/pl/sign-up`). | Użytkownik z preferencją EN (np. `Accept-Language`) i tak trafia na polskie ścieżki. Dodać wykrywanie locale (cookie / middleware) zamiast hardkodu `pl`. |

---

## 2. Strona wyboru auth (`/auth`)

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Język** | Wszystkie teksty na stronie są **na stałe po polsku** („7 dni za darmo”, „Załóż konto (Clerk)”, „Mam konto – wejdź”). | Dla `locale=en` dodać tłumaczenia (np. z `next-intl` / pliki tłumaczeń). |
| **Żargon „Clerk”** | W opisach: „Załóż konto (Clerk)”, „Zaloguj się (Clerk: e-mail, Google itd.)”. | Użytkownik końcowy nie wie, co to „Clerk”. Usunąć lub zastąpić: np. „Załóż konto – e-mail lub Google”. |
| **Przejrzystość oferty** | „7 dni za darmo” jest widoczne; „bez podawania karty” jest w podtytule. | Można wzmocnić komunikat „Bez karty” na przycisku / w pierwszej linii. |

---

## 3. Formularze Clerk (sign-in / sign-up)

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Nagłówki strony** | „Logowanie” / „Rejestracja” i podtytuły są **na stałe po polsku** w komponentach. | Dla `locale=en` wyświetlać angielskie nagłówki (tłumaczenia z `params.locale`). |
| **Język UI Clerka** | `ClerkProvider` **nie** dostaje `localization`. Domyślnie Clerk = angielski („Email address”, „Password”, „Continue”). | Mieszanka: nagłówek PL + formularz EN. W layoutcie przekazać `localization={locale === 'pl' ? plPL : undefined}` (pakiet `@clerk/localizations` jest w projekcie). |
| **Linki wewnątrz Clerka** | „Sign up” / „Log in” w stopce formularza – zależnie od języka Clerka. | Po włączeniu lokalizacji Clerka teksty będą spójne z resztą strony. |
| **Widoczność „Forgot password?”** | Clerk standardowo pokazuje link. | Sprawdzić na żywo (mobile/desktop), czy jest dobrze widoczny i czytelny. |

---

## 4. Strona „Welcome” (po rejestracji)

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Język** | Wszystkie teksty po polsku („Konto utworzone”, „7-dniowy okres darmowy”, „Nie podawaliśmy karty…”, „Przejdź do konfiguratora wesela”). | Dodać i18n (np. `useTranslations('Welcome')`) i tłumaczenia EN. |

---

## 5. Flow po zalogowaniu / rejestracji

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Po rejestracji** | `after-auth` → brak wydarzenia → `welcome` → „Przejdź do konfiguratora” → `onboarding`. | Jasne i logiczne. |
| **Po logowaniu (użytkownik z wydarzeniem)** | `after-auth` → `dashboard`. | OK. |
| **Podwójny wybór** | Użytkownik z landingu klika „Masz konto? Wejdź” i trafia na `/sign-in`. Na stronie auth mógłby od razu wybrać „Mam konto” i trafić na ten sam ekran – tu flow jest spójny (landing → sign-in bez przechodzenia przez `/auth`). | Opcjonalnie: na `/auth` można wyróżnić wizualnie „Mam konto”, jeśli dużo użytkowników wraca właśnie po to. |

---

## 6. Nawigacja i „ucieczka”

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Powrót na stronę główną** | Na `/auth`, `/sign-in`, `/sign-up` **brak** linku typu „Powrót na stronę główną” / „Back to home”. | Dodać dyskretny link (np. w rogu) do `/{locale}` lub do landingu. |
| **Breadcrumbs** | Brak. | Niekonieczne na tych ekranach; link „Strona główna” wystarczy. |

---

## 7. Layout i responsywność

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Szerokość** | Layout auth: `max-w-md` (np. 28rem). Na dużych ekranach formularz jest wąski. | Do rozważenia: `max-w-lg` lub nieco szerszy kontener, aby nie było wrażenia „pływającego” paska. |
| **Tło** | `WeddingBackground` + przezroczysta karta – spójne z resztą aplikacji. | OK. |

---

## 8. Dostępność i techniczne

| Element | Stan | Rekomendacja |
|--------|------|--------------|
| **Nagłówek strony** | Własny `h1` („Logowanie” / „Rejestracja”) + wewnętrzny header Clerka ukryty (`display: none`). | Zachować jeden `h1` na stronę; sprawdzić w devtools, czy kolejność nagłówków (outline) jest poprawna. |
| **„Secured by Clerk”** | Stopka z brandingiem Clerka: `opacity: 0.2`, `pointer-events: none`. | OK pod kątem UX; użytkownik nie musi tego klikać. |
| **Komunikaty błędów** | Clerk wyświetla błędy (np. zły e-mail/hasło). Kolory w `clerk-appearance`: `colorDanger`, `formFieldErrorText`. | Sprawdzić na żywo czytelność i kontrast (WCAG). |

---

## 9. Podsumowanie priorytetów

**Wysoki wpływ, stosunkowo mały nakład:**

1. **Język Clerka** – przekazać `localization={plPL}` (lub odpowiednik dla `locale`) w `ClerkProvider`, żeby formularze były po polsku przy polskiej wersji.
2. **Usunąć żargon „Clerk”** z tekstów na stronie `/auth`.
3. **`/login`** – rozważyć przekierowanie od razu na `/{locale}/sign-in` zamiast na `/pl/auth`.

**Średni:**

4. **Tłumaczenia** – strona `/auth`, nagłówki sign-in/sign-up i strona Welcome powinny używać i18n (pl/en).
5. **Link „Powrót na stronę główną”** na ekranach auth.
6. **Locale przy bezprefiksowych URL** – `/sign-in`, `/sign-up` bez locale: wykrywać locale zamiast zawsze `pl`.

**Niższy:**

7. **Szerokość kontenera** auth (np. `max-w-lg`).
8. **Weryfikacja dostępności** (focus, kontrast błędów, outline nagłówków).

---

*Raport wygenerowany na podstawie przeglądu kodu (Next.js, Clerk, next-intl) – flow nie był testowany w przeglądarce w tej sesji.*
