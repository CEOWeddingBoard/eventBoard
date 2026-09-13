# 🧪 TESTOWA WERSJA - WEDDING AI PLANNER

## 🚀 SZYBKI START

### Opcja 1: Z Dockerem (Rekomendowane)

```bash
# 1. Uruchom PostgreSQL w Dockerze
docker-compose up -d

# 2. Zainstaluj zależności
npm install

# 3. Wygeneruj klienta Prisma
npx prisma generate

# 4. Uruchom migracje bazy danych
npx prisma migrate dev

# 5. (Opcjonalnie) Wypełnij bazę przykładowymi danymi
npx prisma db seed

# 6. Uruchom aplikację
npm run dev
```

### Opcja 2: Bez Dockera (PostgreSQL lokalny)

Jeśli masz zainstalowanego PostgreSQL lokalnie:

```bash
# Zainstaluj zależności
npm install

# Wygeneruj klienta Prisma
npx prisma generate

# Uruchom migracje bazy danych
npx prisma migrate dev

# (Opcjonalnie) Wypełnienie przykładowymi danymi
npx prisma db seed

# Uruchom aplikację
npm run dev
```

### 2. Skonfiguruj środowisko

Utwórz plik `.env.local` w głównym katalogu projektu:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wedding_planner?schema=public"

# JWT Secret for authentication
JWT_SECRET="test-secret-key-change-in-production"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-nextauth-secret"
```

### 3. Dostęp do aplikacji

Aplikacja będzie dostępna pod adresem: **http://localhost:3000**

---

## 🗄️ BAZA DANYCH - PostgreSQL

### Docker Compose (Zalecane)

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=wedding_planner
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### PostgreSQL lokalny

Upewnij się, że masz uruchomionego PostgreSQL i bazę `wedding_planner`.

### GUI do bazy danych

```bash
# Uruchom Prisma Studio
npx prisma studio
```

---

## 👤 PIERWSZE LOGOWANIE

### 1. Rejestracja nowego użytkownika

1. Przejdź do **http://localhost:3000/register**
2. Wypełnij formularz:
   - **Imię i nazwisko**: Twoje imię
   - **Email**: Twój adres email
   - **Hasło**: Minimum 6 znaków

### 2. Logowanie

1. Przejdź do **http://localhost:3000/login**
2. Wprowadź email i hasło

### 3. Przykładowy użytkownik (po seeding)

Jeśli uruchomiłeś `npx prisma db seed`, możesz użyć:

- **Email**: `test@example.com`
- **Hasło**: `password123`

Seed utworzy:
- ✅ **Użytkownika testowego** z przykładowymi danymi
- ✅ **Wydarzenie weselne** z kompletnymi danymi
- ✅ **Przykładowe zadania** w różnych kategoriach
- ✅ **Pozycje budżetowe** z różnymi statusami
- ✅ **Możliwość natychmiastowego testowania** wszystkich funkcji

---

## 🔧 ROZWIĄZYWANIE PROBLEMÓW

### Błąd połączenia z bazą

```bash
# Sprawdź czy Docker działa
docker ps

# Sprawdź logi PostgreSQL
docker-compose logs db

# Zrestartuj bazę
docker-compose restart db
```

### Błędy autentyfikacji

- Sprawdź czy `.env.local` istnieje i zawiera `JWT_SECRET`
- Wyczyść ciasteczka przeglądarki
- Spróbuj rejestracji nowego użytkownika

### Problemy z buildem

```bash
# Wyczyść cache Next.js
rm -rf .next

# Przeinstaluj zależności
rm -rf node_modules package-lock.json
npm install

# Sprawdź błędy TypeScript
npx tsc --noEmit
```

### 3. Uruchom aplikację

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: **http://localhost:3000**

---

## 🔐 SYSTEM LOGOWANIA

### Rejestracja nowego użytkownika

1. Przejdź do **http://localhost:3000/register**
2. Wypełnij formularz:
   - **Imię i nazwisko**: Twoje imię
   - **Email**: Twój adres email
   - **Hasło**: Minimum 6 znaków
   - **Potwierdź hasło**: Powtórz hasło

### Logowanie

1. Przejdź do **http://localhost:3000/login**
2. Wprowadź email i hasło

### Funkcje systemu autentyfikacji

- ✅ **JWT tokens** przechowywane w ciasteczkach
- ✅ **Middleware** chroniący prywatne strony
- ✅ **Automatyczne przekierowanie** dla niezalogowanych użytkowników
- ✅ **Hasła haszowane** z bcrypt

---

## 📱 JAK KORZYSTAĆ Z APLIKACJI

### 1. Główny Dashboard

Po zalogowaniu zostaniesz przekierowany do **http://localhost:3000/dashboard**

Widok zawiera:
- **Statystyki**: Postęp zadań, liczba gości, budżet
- **Animacje**: Pływające karty z efektami Instagram
- **Responsywność**: Działa na wszystkich urządzeniach

### 2. Zarządzanie Zadaniami

**Ścieżka**: `/dashboard/tasks`

Funkcje:
- ✅ **Filtry po kategoriach**: Planowanie, Usługodawcy, Ubiór, itd.
- ✅ **Widok Kanban i Timeline**
- ✅ **Generowanie zadań AI** (przycisk dostępny)
- ✅ **Priorytety i statusy**

### 3. Zarządzanie Budżetem

**Ścieżka**: `/dashboard/budget`

Funkcje:
- ✅ **Pozycje budżetowe** z planowanymi/wydanymi kwotami
- ✅ **AI optymalizacja**: Sugestie oszczędności i analizy
- ✅ **Raporty**: Tabela podsumowań i wykresy
- ✅ **Eksport CSV**

### 4. Zarządzanie Gośćmi

**Ścieżka**: `/dashboard/guests`

Funkcje:
- ✅ **Lista gości** z danymi kontaktowymi
- ✅ **Import/Eksport CSV**
- ✅ **Generowanie zaproszeń AI** (przycisk dostępny)
- ✅ **Zarządzanie statusami RSVP**

### 5. Plan Stołów

**Ścieżka**: `/dashboard/seating`

Funkcje:
- ✅ **Konfiguracja stołów** i pojemności
- ✅ **Definiowanie reguł** usadzenia
- ✅ **AI planner** automatycznego rozmieszczania
- ✅ **Eksport PDF** (drukuj do PDF)

### 6. Dostawcy

**Ścieżka**: `/dashboard/vendors`

Funkcje:
- ✅ **Katalog dostawców**
- ✅ **Porównywarka** (zaznacz 2+ dostawców)
- ✅ **Statusy negocjacji**: Researching, Contacted, Negotiating, Booked, Rejected

---

## 🎨 INSTAGRAM-STYLE DESIGN

Aplikacja zawiera nowoczesne efekty wizualne:

- **Gradienty**: Złote i różowe gradienty
- **Animacje**: Pływające karty, pulse effects
- **Cienie**: Miękkie cienie dla głębi
- **Responsywność**: Perfekcyjnie wygląda na mobile i desktop
- **Typography**: Eleganckie czcionki z efektami shimmer

---

## 🧪 TESTOWANIE FUNKCJONALNOŚCI

### Uruchomienie testów

```bash
# Wszystkie testy
npm test

# Testy z pokryciem
npm run test:coverage

# Testy w trybie watch
npm run test:watch
```

### Dostępne testy

- ✅ **API endpoints** - testy endpointów REST
- ✅ **Komponenty** - testy komponentów React
- ✅ **Akcje serwera** - testy funkcji serwerowych
- ✅ **Autentyfikacja** - testy logowania/rejestracji

---

## 🗄️ BAZA DANYCH

### Schemat bazy danych

```sql
-- Użytkownicy
CREATE TABLE users (
  id        String PRIMARY KEY,
  email     String UNIQUE,
  password  String,
  name      String?,
  createdAt DateTime,
  updatedAt DateTime
);

-- Wydarzenia (wesela)
CREATE TABLE events (
  id                  String PRIMARY KEY,
  name                String,
  date                DateTime,
  userId              String,
  targetBudget        Decimal,
  estimatedGuestCount Int,
  -- ... inne pola
);

-- Zadania, Goście, Budżet, Stoliki, Dostawcy
-- Wszystkie powiązane z użytkownikiem i wydarzeniem
```

### Seed data

Aby wypełnić bazę przykładowymi danymi:

```bash
npx prisma db seed
```

Tworzy:
- Przykładowego użytkownika: `test@example.com` / `password123`
- Przykładowe wydarzenie z zadaniami, gośćmi, budżetem

---

## 🔧 ROZWIĄZYWANIE PROBLEMÓW

### Błąd połączenia z bazą

```bash
# Sprawdź czy Docker działa
docker ps

# Zrestartuj bazę
docker-compose restart db

# Sprawdź logi
docker-compose logs db
```

### Błędy autentyfikacji

- Sprawdź czy `.env.local` istnieje i zawiera `JWT_SECRET`
- Wyczyść ciasteczka przeglądarki
- Spróbuj rejestracji nowego użytkownika

### Problemy z buildem

```bash
# Wyczyść cache Next.js
rm -rf .next

# Przeinstaluj zależności
rm -rf node_modules package-lock.json
npm install

# Sprawdź błędy TypeScript
npx tsc --noEmit
```

---

## 📚 DOSTĘPNE KOMENDY

```bash
# Development
npm run dev              # Uruchomienie dev server
npm run build           # Build produkcyjny
npm run start           # Uruchomienie w produkcji

# Baza danych
npx prisma studio       # GUI do bazy danych
npx prisma migrate dev  # Migracje w development
npx prisma db seed      # Wypełnienie przykładowymi danymi

# Testy
npm test                # Uruchomienie testów
npm run test:coverage   # Testy z pokryciem
npm run test:ci         # Testy dla CI/CD

# Lintowanie
npm run lint            # Sprawdzenie kodu
```

---

## 🎯 PODSUMOWANIE

Testowa wersja zawiera **pełną funkcjonalność** aplikacji Wedding AI Planner:

- ✅ **Kompletny system autentyfikacji** bez Clerk
- ✅ **Wszystkie moduły**: Zadania, Budżet, Goście, Stoliki, Dostawcy
- ✅ **AI funkcje**: Generatory, optymalizacje, porównywarki
- ✅ **Instagram-style design** z animacjami
- ✅ **Responsywność** i **wielojęzykowość**
- ✅ **Testy jednostkowe** i integracyjne
- ✅ **Docker + PostgreSQL** jako baza danych

**Aplikacja jest gotowa do pełnego testowania wszystkich funkcji!** 🎉✨