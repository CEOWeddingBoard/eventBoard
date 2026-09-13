# 🔐 Konfiguracja Clerk - Wedding AI Planner

## ✅ Migracja zakończona

Aplikacja została w pełni zmigrowana z JWT na Clerk.

## 📋 Wymagane zmienne środowiskowe

Dodaj do pliku `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Opcjonalnie - dla webhooków
CLERK_WEBHOOK_SECRET=whsec_...
```

## 🚀 Jak uzyskać klucze Clerk

1. Zarejestruj się na https://clerk.com
2. Utwórz nową aplikację
3. W Dashboard → API Keys znajdziesz:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

## 🔧 Konfiguracja w Clerk Dashboard

### 1. Sign-in/Sign-up URLs
- Sign-in URL: `http://localhost:3000/pl/sign-in`
- Sign-up URL: `http://localhost:3000/pl/sign-up`

### 2. After sign-in/sign-up redirect
- After sign-in: `http://localhost:3000/pl/`
- After sign-up: `http://localhost:3000/pl/`

### 3. Webhooks (opcjonalnie)
Jeśli chcesz synchronizować użytkowników z bazą danych przez webhooki:
- Webhook URL: `https://twoja-domena.com/api/webhooks/clerk` (produkcja) lub ngrok w dev
- Events: `user.created` (wysyłany jest nasz powitalny e-mail), opcjonalnie `user.updated`, `user.deleted`
- W Clerk Dashboard → Webhooks → wybierz endpoint → skopiuj **Signing secret** → ustaw jako `CLERK_WEBHOOK_SECRET`

**Powitalny e-mail:** Przy evencie `user.created` aplikacja wysyła HTML e-mail powitalny (Resend). Pełna checklista wdrożenia: **[WDROZENIE-EMAIL-POWITALNY.md](./WDROZENIE-EMAIL-POWITALNY.md)**. W Clerk wyłącz domyślny welcome email: **Configure → Email** → wyłącz „Send welcome email”.

## 📝 Zmiany w kodzie

### Middleware
- Używa `clerkMiddleware` zamiast własnej implementacji JWT
- Automatycznie chroni wszystkie route oprócz publicznych

### Auth Utils
- `getCurrentUser()` - synchronizuje użytkownika Clerk z bazą danych
- Automatycznie tworzy użytkownika w bazie przy pierwszym logowaniu

### Komponenty
- `SignIn` i `SignUp` - gotowe komponenty Clerk
- `UserButton` - gotowy komponent nawigacji użytkownika

### API Routes
- Wszystkie route używają `getCurrentUser()` zamiast JWT
- Automatyczna synchronizacja użytkowników

## 🗄️ Baza danych

Model `User` w Prisma ma pole `clerkId`:
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String?  @unique  // ID z Clerk
  email     String   @unique
  name      String?
  // ...
}
```

## 🧪 Testowanie

1. Uruchom aplikację: `npm run dev`
2. Przejdź do `/pl/sign-up`
3. Zarejestruj nowe konto
4. Zaloguj się i sprawdź czy wszystko działa

## ⚠️ Uwagi

- **Development**: Użyj test keys (`pk_test_...`, `sk_test_...`)
- **Production**: Użyj live keys (`pk_live_...`, `sk_live_...`)
- **Webhooks**: W development użyj ngrok do testowania webhooków

## 🔗 Przydatne linki

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Dashboard](https://dashboard.clerk.com)
