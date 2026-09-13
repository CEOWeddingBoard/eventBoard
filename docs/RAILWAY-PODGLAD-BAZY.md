# Jak przeglądać bazę danych na Railway

Żeby zobaczyć, co jest zapisane w bazie (PostgreSQL) na Railway, masz kilka opcji.

**Ważne:** Jeśli masz wiele środowisk (developerskie, release, master), w górnym pasku Railway wybierz najpierw **środowisko**, a potem usługę PostgreSQL — każda ma osobną bazę. Szerszy kontekst: [PRODUKCJA-3-SRODOWISKA-RAILWAY.md](./PRODUKCJA-3-SRODOWISKA-RAILWAY.md).

---

## 1. Railway Dashboard – zakładka Data (Postgres)

Jeśli w projekcie masz **usługę PostgreSQL** (dodaną z Railway):

1. Wejdź na [railway.app](https://railway.app) → wybierz **projekt** → kliknij **usługę PostgreSQL** (nie aplikację).
2. W górnym menu przejdź do **„Data”** (lub **„Query”** / **„Tables”**, w zależności od wersji panelu).
3. Railway pokazuje listę tabel i umożliwia:
   - przeglądanie tabel (podgląd wierszy),
   - uruchamianie zapytań SQL w prostym edytorze.

To najszybszy sposób, żeby „na szybko” zobaczyć dane bez konfiguracji klienta.

---

## 2. Klient lokalny (TablePlus, DBeaver, pgAdmin)

Możesz połączyć się z bazą Railway tak jak z dowolną PostgreSQL – używając **connection string** z Railway.

1. W Railway: **projekt** → **usługa PostgreSQL** → **Variables** (lub **Connect**).
2. Skopiuj **`DATABASE_URL`** (np. `postgresql://user:password@host:port/railway`).
3. W TablePlus / DBeaver / pgAdmin:
   - nowe połączenie PostgreSQL,
   - wklej URL lub wpisz host, port, użytkownik, hasło, baza (z tego URL),
   - zapisz i połącz się.

Wtedy masz pełny podgląd tabel, zapytania SQL, eksport itd.

**Uwaga:** Na darmowym planie Railway czasem trzeba włączyć **Public Networking** dla usługi Postgres, żeby połączenie z zewnątrz działało (Railway pokazuje to w ustawieniach/usłudze).

---

## 3. Szybkie zapytania (gdy masz tylko DATABASE_URL)

Z poziomu projektu (lokalnie) możesz wykonać zapytania przez Prisma bez pisania kodu w aplikacji:

- **Prisma Studio:**  
  `npx prisma studio`  
  Uruchomi lokalny serwer z interfejsem do przeglądania tabel. **Ważne:** w `.env` musi być ustawione `DATABASE_URL` wskazujące na bazę Railway (skopiuj z Variables w Railway). Wtedy zobaczysz dokładnie te same dane co na Railway.

---

## Podsumowanie

| Sposób | Gdzie | Kiedy użyć |
|--------|--------|------------|
| **Railway → Data / Query** | Panel Railway, usługa Postgres | Szybki podgląd tabel i proste SQL |
| **TablePlus / DBeaver / pgAdmin** | Aplikacja na swoim PC | Pełna praca z bazą (zapytania, eksport, struktura) |
| **Prisma Studio** | Lokalnie (`npx prisma studio`) z `DATABASE_URL` z Railway | Przegląd danych w formie „tabel” z modeli Prisma |

Jeśli nie widzisz zakładki Data w usłudze Postgres, sprawdź dokumentację Railway pod hasłem „PostgreSQL” i „Data” – układ panelu może się nieznacznie różnić w zależności od wersji.
