# Migracja do Clerk - Status

## ✅ Ukończone

1. ✅ Middleware - zaktualizowany do Clerk
2. ✅ Layout główny - dodany ClerkProvider
3. ✅ Strony sign-in/sign-up - używają komponentów Clerk
4. ✅ UserNav - używa Clerk UserButton
5. ✅ Dashboard layout - używa Clerk auth
6. ✅ Auth utils - zaktualizowane do Clerk
7. ✅ Event actions - zaktualizowane
8. ✅ Seating actions - zaktualizowane

## ⚠️ W trakcie

1. ⚠️ API routes - wymagają aktualizacji (18+ plików)
   - Wszystkie pliki w `src/app/api/events/[id]/**` wymagają aktualizacji
   - Zamienić `const { userId } = await auth()` na Clerk + getCurrentUser

## 📝 Do zrobienia

1. Zaktualizować wszystkie API routes
2. Usunąć stare pliki:
   - `src/lib/actions/auth.actions.ts` (JWT)
   - `src/lib/auth-mock.tsx`
   - `src/components/auth/LoginForm.tsx`
   - `src/components/auth/RegisterForm.tsx`
3. Zaktualizować testy
4. Dodać zmienne środowiskowe Clerk do .env.example

## 🔧 Wymagane zmienne środowiskowe

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## 📚 Dokumentacja

- Clerk Next.js: https://clerk.com/docs/quickstarts/nextjs
- Clerk Middleware: https://clerk.com/docs/references/nextjs/clerk-middleware
