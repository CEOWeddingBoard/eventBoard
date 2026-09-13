# 🧪 Testing Guide

## Przegląd Systemu Testów

Aplikacja używa kompleksowego podejścia do testowania z trzema warstwami:

1. **Testy Jednostkowe** (Jest) - testy pojedynczych funkcji i komponentów
2. **Testy Integracyjne** (Jest) - testy interakcji między modułami
3. **Testy E2E** (Playwright) - testy pełnych scenariuszy użytkownika

## Uruchamianie Testów

### Wszystkie testy
```bash
npm test
```

### Testy z pokryciem
```bash
npm run test:coverage
```

### Testy w trybie watch
```bash
npm run test:watch
```

### Testy E2E
```bash
npm run test:e2e
```

### Testy E2E z UI
```bash
npm run test:e2e:ui
```

### Testy E2E w trybie debug
```bash
npm run test:e2e:debug
```

## Struktura Testów

### Testy Jednostkowe

#### Walidacja (`src/__tests__/validations/`)
- `common.test.ts` - testy podstawowych schematów walidacji
- `guest.test.ts` - testy walidacji gości
- `task.test.ts` - testy walidacji zadań
- `budget.test.ts` - testy walidacji budżetu
- `validation-utils.test.ts` - testy narzędzi walidacji

#### Actions (`src/__tests__/actions/`)
- `guest-actions-validation.test.ts` - testy actions z walidacją
- `task-actions-validation.test.ts` - testy actions z walidacją

#### Komponenty (`src/__tests__/components/`)
- `guest-form-validation.test.tsx` - testy formularzy z walidacją

### Testy E2E (`e2e/`)

- `auth.spec.ts` - testy autentykacji
- `dashboard.spec.ts` - testy dashboardu
- `guests.spec.ts` - testy zarządzania gośćmi
- `tasks.spec.ts` - testy zarządzania zadaniami
- `seating.spec.ts` - testy planowania stołów
- `budget.spec.ts` - testy zarządzania budżetem

## Test Utilities

### `src/__tests__/utils/test-helpers.ts`

Pomocnicze funkcje do testów:
- `createTestPrismaClient()` - tworzy klienta Prisma dla testów
- `cleanupTestData()` - czyści dane testowe
- `createTestUser()` - tworzy testowego użytkownika
- `createTestEvent()` - tworzy testowe wydarzenie
- `createTestGuest()` - tworzy testowego gościa
- `mockClerkUser()` - mock użytkownika Clerk
- `mockFetchResponse()` - mock odpowiedzi fetch
- `mockFetchError()` - mock błędu fetch

## Best Practices

### Walidacja
- Zawsze używaj centralnych schematów z `src/lib/validations/`
- Używaj `validate()` dla server actions
- Używaj `safeValidate()` dla komponentów
- Używaj `useValidation` hook dla formularzy

### Error Handling
- Używaj `useErrorHandler` hook
- Używaj `ErrorBoundary` dla komponentów
- Loguj błędy przez `logError()`

### Loading States
- Używaj skeleton loaders podczas ładowania
- Używaj `LoadingState` dla ogólnych stanów ładowania
- Używaj `ErrorState` dla błędów z retry
- Używaj `EmptyState` dla pustych stanów

## Przykłady

### Test walidacji
```typescript
import { safeValidate } from '@/lib/validations/validation-utils'
import { createGuestSchema } from '@/lib/validations/guest'

const result = safeValidate(createGuestSchema, data)
if (!result.success) {
  console.log(result.errors)
}
```

### Test komponentu
```typescript
import { render, screen } from '@testing-library/react'
import { GuestForm } from '@/components/guests/guest-form'

test('should validate form', async () => {
  render(<GuestForm eventId="test" onFormSubmit={jest.fn()} />)
  // ... assertions
})
```

### E2E test
```typescript
test('should add guest', async ({ page }) => {
  await page.goto('/pl/guests')
  await page.click('button:has-text("Dodaj Gościa")')
  await page.fill('input[name="name"]', 'Jan Kowalski')
  await page.click('button:has-text("Zapisz")')
  await expect(page.locator('text=Jan Kowalski')).toBeVisible()
})
```

## Konfiguracja

### Jest (`jest.config.simple.js`)
- Environment: jsdom
- Module mapping: `@/` -> `src/`
- Test match: `**/*.test.{ts,tsx}`

### Playwright (`playwright.config.ts`)
- Test directory: `e2e/`
- Browsers: Chromium, Firefox, WebKit
- Mobile: Chrome, Safari
- Base URL: `http://localhost:3000`

## Pokrycie Testami

Cel: **>80% pokrycia kodu**

Aktualne pokrycie można sprawdzić przez:
```bash
npm run test:coverage
```

Sprawdź raport w `coverage/lcov-report/index.html`
