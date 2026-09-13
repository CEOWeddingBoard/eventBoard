# 🚀 Instrukcje Migracji: SQLite → PostgreSQL

## ✅ Co zostało zrobione

1. ✅ `prisma/schema.prisma` - zmienione na PostgreSQL
2. ✅ `src/lib/prisma.ts` - używa DATABASE_URL
3. ✅ `README.md` - zaktualizowany
4. ✅ `.env.example` - już ma DATABASE_URL

## 📋 Kroki do wykonania lokalnie

### 1. Upewnij się, że PostgreSQL działa

**Opcja A: Docker Compose (Rekomendowane)**
```bash
docker-compose up -d db
```

**Opcja B: Lokalny PostgreSQL**
- Upewnij się, że PostgreSQL jest uruchomiony
- Utwórz bazę danych: `createdb wedding_planner`

### 2. Skonfiguruj zmienne środowiskowe

Utwórz/edytuj `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wedding_planner?schema=public"
```

### 3. Wygeneruj klienta Prisma

```bash
npx prisma generate
```

### 4. Utwórz migrację

```bash
npx prisma migrate dev --name migrate_to_postgresql
```

To utworzy:
- Folder `prisma/migrations/` z historią migracji
- Wszystkie tabele w PostgreSQL

### 5. (Opcjonalnie) Seed danych

```bash
npx prisma db seed
```

### 6. Zweryfikuj

```bash
# Otwórz Prisma Studio
npx prisma studio
```

Lub sprawdź bezpośrednio w PostgreSQL:
```bash
psql -U postgres -d wedding_planner -c "\dt"
```

## ⚠️ Jeśli masz dane w SQLite

Jeśli masz istniejące dane w `prisma/dev.db`:

1. **Eksport danych z SQLite:**
   ```bash
   sqlite3 prisma/dev.db .dump > data_backup.sql
   ```

2. **Po migracji do PostgreSQL:**
   - Przekonwertuj dane (może wymagać ręcznej edycji)
   - Import do PostgreSQL (wymaga konwersji formatów)

**Lub:** Zacznij od zera z PostgreSQL (jeśli dane nie są ważne)

## 🔍 Weryfikacja

Po migracji sprawdź:

1. ✅ Aplikacja startuje bez błędów
2. ✅ Możesz się zalogować
3. ✅ Możesz tworzyć wydarzenia
4. ✅ Wszystkie funkcje działają

## 🐛 Rozwiązywanie problemów

### Błąd: "relation does not exist"
- Uruchom: `npx prisma migrate dev`
- Lub: `npx prisma db push`

### Błąd: "connection refused"
- Sprawdź czy PostgreSQL działa: `docker ps` lub `pg_isready`
- Sprawdź DATABASE_URL w `.env.local`

### Błąd: "database does not exist"
- Utwórz bazę: `createdb wedding_planner`
- Lub użyj Docker Compose

## 📝 Notatki

- Stary plik SQLite (`prisma/dev.db`) można usunąć po migracji
- Migracje Prisma są w `prisma/migrations/`
- Historia migracji pozwala na rollback jeśli potrzebny
