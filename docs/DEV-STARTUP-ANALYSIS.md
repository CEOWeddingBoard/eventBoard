# Dev: długi start i błąd EPERM na `.next\trace`

## Błąd `EPERM: operation not permitted, open '.next\trace'`

**Przyczyna:** Ktoś trzyma pliki w `.next` (np. poprzedni `npm run dev`, inny terminal, Cursor/IDE, antywirus). Next przy starcie pisze do `.next\trace` – gdy plik jest zablokowany, dostajesz EPERM.

**Rozwiązanie (kolejność):**

1. **Zamknij wszystkie terminale** z działającym `npm run dev` („Port 3000 in use” = coś dalej działa).
2. **Uruchom „świeży” start:**
   ```bash
   npm run dev:fresh
   ```
   Skrypt zatrzymuje Node, usuwa `.next-dev` i uruchamia `npm run dev`.

3. **Dev używa `.next-dev`** (patrz `next.config.js`). W development Next pisze do `.next-dev`, nie do `.next`. Zablokowany `.next` nie blokuje już deva – możesz go zignorować lub usunąć później (gdy nic nie trzyma plików).

4. **Ręcznie:** Zamknij wszystkie `npm run dev` → w nowym CMD: `npm run clean` → `npm run dev`.  
   Jeśli dalej EPERM na `.next`: **Task Manager** → zakończ **Node.js** → potem `npm run clean` i `npm run dev`.  
   Przy `.next-dev` (dev) problemu zwykle nie ma.

5. **Antywirus:** Dodaj folder projektu (np. `node_modules`, `.next`, `.next-dev`) do wyłączeń Windows Defendera.

---

## Analiza: dlaczego `npm run dev` długo się uruchamia (nowy CMD)

## Główne przyczyny

### 1. **Cold start (nowy terminal)**
- Nowy CMD = nowy proces Node. Brak „ciepłego” cache’a Next.js, brak uruchomionego dev servera.
- Next musi: uruchomić Node, załadować Next.js, zbudować Turbopack, skompilować middleware (Edge), przygotować się na pierwsze requesty.
- To samo dotyczy każdego **pierwszego** `npm run dev` po restarcie komputera lub po `npm run clean`.

### 2. **Root layout: `force-dynamic`**
- W `src/app/layout.tsx` jest `export const dynamic = 'force-dynamic'`.
- Wyłącza optymalizacje statyczne **dla całej aplikacji**.
- Zwiększa pracę przy starcie i przy pierwszym wejściu na stronę (więcej rzeczy musi być „dynamic”).

### 3. **Trzy Google Fonts w `[locale]` layout**
- **Lora**, **Cormorant Garamond**, **Great Vibes** – każdy z `next/font/google`.
- Przy starcie Next pobiera i przetwarza fonty; 3 fonty = więcej czasu i requestów.
- Layout jest ładowany dla każdej strony, więc fonty inicjują się na starcie.

### 4. **Middleware (Edge) + next-intl**
- `src/middleware.ts`: `next-intl` + `edge-polyfill` + logika protected routes.
- Middleware działa w **Edge runtime** – pierwsza kompilacja tego kodu może trwać dłużej.
- next-intl ładuje konfigurację i locale; `i18n.ts` dynamicznie importuje `en.json` / `pl.json`.

### 5. **Duża liczba zależności**
- **~649 pakietów** w `node_modules`. Turbopack i tak musi się po nich „przejść” przy resolvowaniu modułów.
- Ciężkie pakiety: **Clerk** (auth), **Prisma**, **Recharts**, **Radix UI**, **next-intl** itd. – część z nich ładuje się przy starcie lub przy pierwszym wejściu na daną trasę.

### 6. **Prisma + baza**
- `lib/prisma` tworzy klienta przy pierwszym imporcie.
- Przy pierwszym requeście do API / strony używającej DB: inicjalizacja klienta + **połączenie z bazą**.
- Jeśli `DATABASE_URL` wskazuje na niedostępną bazę (np. Postgres przy wyłączonej maszynie) – **timeouty** znacząco wydłużają wrażenie „długiego startu” przy pierwszym wejściu.

### 7. **Windows: antywirus i dysk**
- **Windows Defender** (lub inny AV) często skanuje `node_modules` i `.next` przy dostępie do plików.
- Nowy proces = wiele odczytów = skanowanie może trwać długo.
- Dysk HDD (zamiast SSD) dodatkowo spowalnia.

### 8. **Brak „ciepłego” cache’a**
- `npm run clean` usuwa `.next`. Kolejny `npm run dev` = **pełna** kompilacja od zera.
- Nawet bez clean – **nowy CMD** i tak startuje świeży proces; cache na dysku pomaga, ale init Node + Next + Turbopack nadal trwa.

---

## Co możesz zrobić (konkretne kroki)

### Od razu (bez zmian w kodzie)

1. **Nie zamykaj dev servera bez potrzeby**  
   Trzymaj `npm run dev` w jednym oknie terminala. Kolejne zmiany = Fast Refresh, nie cold start.

2. **Wyłącz skanowanie projektu w Windows Defenderze**  
   Ustaw wyłączenie dla folderu projektu (szczególnie `node_modules`, `.next`):
   - Ustawienia Windows → Prywatność i bezpieczeństwo → Zabezpieczenia Windows → Ochrona przed wirusami → Zarządzaj ustawieniami → Wyłączenia → Dodaj wyłączenie → Folder → wybierz `D:\weedingPlaner\WeedingPlaner`.

3. **Sprawdź bazę**  
   Upewnij się, że `DATABASE_URL` w `.env.local` wskazuje na **działającą** bazę (np. lokalny plik SQLite). Unikaj adresu do wyłączonego Postgresa – unikniesz długich timeoutów przy pierwszym requeście.

### Zmiany w kodzie (opcjonalne, pod kolejność wpływu)

4. **Usuń lub zawęź `force-dynamic`**  
   W `src/app/layout.tsx` usunąć `export const dynamic = 'force-dynamic'` – jeśli nie jest to konieczne. Albo ustawić `dynamic` tylko na konkretnych stronach, które naprawdę muszą być dynamiczne. To może skrócić start i pierwsze wejście.

5. **Ogranicz fonty**  
   Zostaw np. **2 fonty** (np. Lora + Cormorant Garamond), trzeci (Great Vibes) usuń albo załaduj tylko na wybranych podstronach. Mniej fontów = szybszy init `next/font`.

6. **Ewentualnie: jawny Turbopack**  
   W `package.json` możesz ustawić:
   ```json
   "dev": "next dev --turbopack"
   ```
   U Next 15 i tak jest to domyślne, ale jawne `--turbopack` nie zaszkodzi.

---

## Podsumowanie

- **Długi start przy `npm run dev` w nowym CMD** to w dużej mierze **cold start**: Node + Next + Turbopack + middleware + fonty + pierwsze kompilacje.
- Dodatkowo wpływ mają: **`force-dynamic`** w root layout, **3 fonty**, **next-intl** w middleware, **dużo zależności**, **Windows Defender** oraz **baza danych** (timeouty przy złej konfiguracji).
- Największy zysk bez refaktoru: **nie restartować deva bez potrzeby**, **wyłączyć Defender dla projektu**, **pilnować poprawnego DATABASE_URL**.  
- Z refaktorem: **zdjąć `force-dynamic`** z root layout i **ograniczyć fonty** do 2.
