# 🗄️ Plan Migracji: SQLite → PostgreSQL

## 📊 Analiza Punktu 3 z Audytu

### Obecny Stan

**Problem zidentyfikowany:**
- ❌ `prisma/schema.prisma` używa SQLite
- ✅ `docker-compose.yml` skonfigurowany dla PostgreSQL
- ✅ `README.md` mówi o PostgreSQL
- ❌ `src/lib/prisma.ts` hardcoduje SQLite
- ❌ Rozbieżność między konfiguracją a rzeczywistością

### Wpływ na Aplikację

#### ✅ Pozytywny wpływ migracji:
1. **Gotowość produkcyjna** - PostgreSQL jest production-ready
2. **Skalowalność** - Obsługa wielu równoczesnych połączeń
3. **Zaawansowane funkcje** - Full-text search, JSONB, triggery
4. **Zgodność z infrastrukturą** - Docker Compose już ma PostgreSQL
5. **Zgodność z dokumentacją** - README i docker-compose są spójne

#### ⚠️ Potencjalne problemy:
1. **Różnice w typach danych** SQLite vs PostgreSQL
2. **Różnice w query syntax** (minimalne przy użyciu Prisma)
3. **Migracja istniejących danych** (jeśli są)
4. **Setup lokalny** - wymaga Dockera lub lokalnego PostgreSQL

## 📋 Plan Migracji

### Krok 1: Aktualizacja Schema Prisma ✅

**Zmiany:**
```prisma
// PRZED
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// PO
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Wpływ:** 
- ✅ Minimalny - Prisma abstrahuje różnice
- ⚠️ Wymaga zmiennej środowiskowej DATABASE_URL

### Krok 2: Aktualizacja Prisma Client ✅

**Plik:** `src/lib/prisma.ts`

**Zmiany:**
```typescript
// PRZED
const databaseUrl = "file:./prisma/dev.db";

// PO
const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://postgres:postgres@localhost:5432/wedding_planner?schema=public";
```

**Wpływ:**
- ✅ Używa zmiennej środowiskowej
- ✅ Fallback dla development

### Krok 3: Konfiguracja Zmiennych Środowiskowych ✅

**Plik:** `.env.local` / `.env.example`

**Dodaj:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wedding_planner?schema=public"
```

**Wpływ:**
- ✅ Spójna konfiguracja
- ✅ Łatwiejsze wdrożenie

### Krok 4: Migracja Danych (jeśli są) ⚠️

**Jeśli masz dane w SQLite:**
1. Eksport danych z SQLite
2. Konwersja formatów (jeśli potrzebna)
3. Import do PostgreSQL

**Jeśli NIE masz danych:**
- ✅ Możesz pominąć ten krok
- ✅ Uruchomić migracje Prisma od zera

### Krok 5: Migracje Prisma ✅

**Komendy:**
```bash
# 1. Utwórz migrację
npx prisma migrate dev --name migrate_to_postgresql

# 2. Wygeneruj klienta
npx prisma generate

# 3. (Opcjonalnie) Seed danych
npx prisma db seed
```

**Wpływ:**
- ✅ Tworzy strukturę w PostgreSQL
- ✅ Historia migracji w Prisma

### Krok 6: Aktualizacja Dokumentacji ✅

**Pliki:**
- `README.md` - ✅ Już ma PostgreSQL
- `.env.example` - Dodaj DATABASE_URL

## 🔍 Różnice SQLite vs PostgreSQL

### Typy danych wymagające uwagi:

1. **Boolean:**
   - SQLite: INTEGER (0/1)
   - PostgreSQL: BOOLEAN (true/false)
   - ✅ Prisma obsługuje automatycznie

2. **JSON:**
   - SQLite: TEXT
   - PostgreSQL: JSONB
   - ✅ Prisma mapuje automatycznie

3. **Enum:**
   - SQLite: TEXT + constraint
   - PostgreSQL: Native ENUM
   - ✅ Prisma tworzy odpowiednie typy

4. **Dates:**
   - SQLite: TEXT/INTEGER
   - PostgreSQL: TIMESTAMP
   - ✅ Prisma obsługuje DateTime

### Zapytania SQL - minimalne różnice:
- ✅ Prisma ORM abstrahuje większość różnic
- ⚠️ Raw SQL może wymagać zmian (sprawdź `prisma.$queryRaw`)

## 📊 Ocena Wpływu

### 🟢 Niski Wpływ (Automatycznie obsłużone):
- ✅ Wszystkie typy danych przez Prisma
- ✅ Relacje między tabelami
- ✅ Query przez Prisma Client
- ✅ Migracje Prisma

### 🟡 Średni Wpływ (Wymaga Uwagi):
- ⚠️ Konfiguracja środowiskowa (DATABASE_URL)
- ⚠️ Setup lokalny (wymaga Docker lub PostgreSQL)
- ⚠️ Testy mogą wymagać osobnej bazy testowej

### 🔴 Potencjalne Problemy:
- ❌ **Raw SQL queries** - jeśli są w kodzie
- ❌ **Migracja istniejących danych** - jeśli są
- ❌ **Connection pooling** - PostgreSQL wymaga zarządzania połączeniami

## ✅ Rekomendacje

### Dla Development:
1. ✅ Użyj Docker Compose (już skonfigurowane)
2. ✅ Dodaj `.env.local` z DATABASE_URL
3. ✅ Uruchom `docker-compose up -d db`
4. ✅ Uruchom migracje Prisma

### Dla Produkcji:
1. ✅ Użyj zarządzanej bazy PostgreSQL (AWS RDS, Supabase, Neon)
2. ✅ Connection pooling (Prisma Client ma wbudowany)
3. ✅ Backup strategy
4. ✅ Monitoring i alerty

## 🎯 Korzyści z Migracji

1. **Gotowość produkcyjna** - PostgreSQL to standard
2. **Wydajność** - Lepsze dla aplikacji wieloużytkownikowych
3. **Funkcjonalność** - Zaawansowane funkcje SQL
4. **Spójność** - Docker Compose już używa PostgreSQL
5. **Skalowalność** - Możliwość skalowania poziomego

## ⏱️ Szacowany Czas Migracji

- **Bez danych:** 15-30 minut
- **Z danymi:** 1-2 godziny (z migracją danych)
- **Z testami:** +30 minut (aktualizacja testów)

## 🔗 Przydatne Linki

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose PostgreSQL](https://hub.docker.com/_/postgres)
