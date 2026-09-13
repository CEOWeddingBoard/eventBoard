# Konfiguracja Clerk (logowanie) na Railway

Żeby logowanie przez Clerk (Google, Apple, email) działało na środowisku wdrożonym na Railway, zrób poniższe kroki.

## 0. Build: użyj Dockerfile (Prisma na Railway)

Na Railway kontener domyślnie może być Alpine (musl). Prisma na Alpine zgłasza błąd `libssl.so.1.1: No such file or directory`. **Aplikacja musi być budowana i uruchamiana z dołączonego Dockerfile** (obraz Debian).

- W repozytorium jest **`Dockerfile`** (jednoetapowy: Node 20 Debian bookworm-slim, `npm ci` → `prisma generate` → `next build` → start przez `npm start`). Build i run w tym samym obrazie, więc Prisma używa zawsze silnika z Debianu.
- W Railway → **Build**: **Builder** = Dockerfile, **Dockerfile Path** = `Dockerfile`. **Root Directory** = puste (root repozytorium).
- W Railway → **Deploy**: **Custom Start Command** = puste (używany jest CMD z Dockerfile: `npm start`).
- Po wdrożeniu z tego Dockerfilea błąd Prisma z `libssl.so.1.1` nie powinien się pojawić.
- Jeśli błąd nadal jest: zrób **Redeploy** z **Clear build cache** i upewnij się, że w logach buildu widać „Building with Dockerfile” / użycie Dockerfile (nie Nixpacks).

## 1. Clerk Dashboard – klucze i domena

1. Wejdź na [dashboard.clerk.com](https://dashboard.clerk.com) i wybierz swoją aplikację.
2. **API Keys** (Configure → API Keys):
   - Skopiuj **Publishable key** (`pk_test_...` lub `pk_live_...`).
   - Skopiuj **Secret key** (`sk_test_...` lub `sk_live_...`).
3. **Domains** (Configure → Domains):
   - Dodaj domenę Railway, np. `twoja-aplikacja.up.railway.app` (bez `https://`).
   - Clerk musi znać domenę, żeby przekierowania i ciasteczka działały.

(Opcjonalnie) **Social connections**: User & Authentication → Social connections → włącz **Google** i **Apple**, jeśli chcesz logowanie przez Gmail / iCloud.

## 2. Zmienne środowiskowe na Railway

**Bez tych zmiennych aplikacja zwraca 500 i błąd „Missing publishableKey” / „Clerk can't detect clerkMiddleware”.**

1. Otwórz projekt na [railway.app](https://railway.app) → wybierz swój projekt (service).
2. Wejdź w **Variables** (zakładka u góry lub w ustawieniach serwisu).
3. **Obowiązkowo** ustaw (Add Variable / Raw Editor):

| Zmienna | Wartość | Uwagi |
|--------|---------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` lub `pk_live_...` | Z Clerk → API Keys |
| `CLERK_SECRET_KEY` | `sk_test_...` lub `sk_live_...` | Z Clerk → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Opcjonalnie (domyślnie tak) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Opcjonalnie |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/pl/dashboard` | Gdzie przekierować po logowaniu |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/pl/dashboard` | Gdzie przekierować po rejestracji |

**Ważne:** Aplikacja używa ścieżek z locale (`/pl/...`, `/en/...`). Po zalogowaniu użytkownik trafia na `/pl/dashboard` – możesz to zmienić na np. `/{locale}/dashboard` tylko jeśli dodasz taką obsługę w Clerk (np. przez redirect w aplikacji).

**DATABASE_URL** – **nie używaj `localhost`** na Railway. Dodaj plugin **Postgres** w projekcie Railway i skopiuj zmienną `DATABASE_URL` z tego serwisu (np. **Variables** → Reference z Postgres). Wklej ją do zmiennych Twojego serwisu aplikacji.

**Nazwa zmiennej (bez literówek):** skopiuj dokładnie `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – lista do skopiowania jest w `docs/RAILWAY-ZMIENNE-CLERK.txt`.

**Dlaczego nadal "Missing publishableKey"?**  
Next.js wstawia `NEXT_PUBLIC_*` przy **buildzie**. W Dockerzie build często nie widzi zmiennych z Railway (są dopiero przy starcie kontenera). Zrób tak:
1. **Nazwa:** dokładnie `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (wielkie litery, podkreślniki).
2. **Wartość:** pełny klucz z Clerk (np. `pk_test_AbCdEf123...`), bez spacji.
3. W Railway sprawdź, czy w ustawieniach **Build** jest opcja typu **„Expose variables to build”** / **„Build-time variables”** – włącz ją dla tej zmiennej (jeśli jest), żeby build Docker miał do niej dostęp.
4. Po zapisaniu zmiennych zrób **Redeploy** (albo **Clear build cache** + Redeploy).

## 3. Redeploy

1. Po zapisaniu Variables w Railway zrób **Redeploy** serwisu (np. Deployments → trzy kropki przy ostatnim deployu → Redeploy, albo push do repo jeśli masz auto-deploy).
2. Po zakończeniu buildu wejdź na domenę Railway i kliknij „Zaloguj” – powinieneś trafić na stronę Clerka (sign-in) z wyborem Google / Apple / email.

## 4. Sprawdzenie

- Strona główna → „Zaloguj” → przekierowanie na `/pl/sign-in` (lub `/en/sign-in` zależnie od locale).
- Po zalogowaniu przez Clerk – przekierowanie na dashboard.
- Jeśli coś nie działa: sprawdź w Railway, czy zmienne są ustawione (brak spacji, pełne klucze) i czy w Clerk w **Domains** jest dodana domena Railway.
