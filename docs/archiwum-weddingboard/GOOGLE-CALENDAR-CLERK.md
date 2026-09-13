# Google Kalendarz – logowanie przez Clerk (bez GOOGLE_CLIENT_ID w aplikacji)

Konto użytkownika może być **powiązane z Google przez Clerk** (logowanie „Zaloguj się przez Google”). Wtedy token do Google Calendar można pobrać z Clerk – **nie trzeba ustawiać GOOGLE_CLIENT_ID ani GOOGLE_CLIENT_SECRET w aplikacji**.

## Jak to działa

1. **Clerk** przy logowaniu przez Google może poprosić o dodatkowe uprawnienia (scopes), np. dostęp do Kalendarza.
2. Aplikacja wywołuje `getGoogleCalendarToken()` z `@/lib/google-calendar-clerk`: najpierw próbuje pobrać token z Clerk (`getUserOauthAccessToken(userId, 'oauth_google')`), a tylko gdy go nie ma – korzysta z zapisanego połączenia OAuth (tabela `GoogleCalendarConnection`, wymaga GOOGLE_CLIENT_ID).
3. Dzięki temu **jeśli użytkownik loguje się przez Google i w Clerk jest włączony zakres Kalendarza, kalendarz jest od razu „połączony”** – bez osobnego przycisku „Połącz z Google” i bez zmiennych env w aplikacji.

## Konfiguracja w Clerk Dashboard – krok po kroku

1. Wejdź na **[Clerk Dashboard](https://dashboard.clerk.com/)** i wybierz swoją aplikację.

2. W menu po lewej: **User & Authentication** → **SSO Connections** (lub **Social connections**).  
   Bezpośredni link: [dashboard.clerk.com → SSO connections](https://dashboard.clerk.com/~/user-authentication/sso-connections)

3. Znajdź **Google** na liście providerów i kliknij (lub **Add connection** → **For all users** → **Google**).

4. Włącz połączenie:
   - **Enable for sign-up and sign-in** – włączone.
   - **Use custom credentials** – **włącz to**, żeby pojawiło się pole **Scopes** (bez tego nie dodasz zakresu Kalendarza).

5. W polu **Scopes** (po włączeniu custom credentials) dodaj **jeden** z zakresów:
   - `https://www.googleapis.com/auth/calendar`  
     (pełny dostęp do kalendarza – tworzenie, edycja, usuwanie, lista – **polecane**)
   - albo `https://www.googleapis.com/auth/calendar.events`  
     (tylko wydarzenia)

   Wklej dokładnie ten adres URL (bez spacji). Jeśli jest kilka pól na scopes, dodaj w jednym z nich.

6. **Zapisz** zmiany (Save).

**Produkcja:** Jeśli używasz **production instance**, musisz podać własne **Client ID** i **Client Secret** z [Google Cloud Console](https://console.cloud.google.com/) (OAuth 2.0 Client ID, typ „Web application”) oraz w Google dodać **Authorized redirect URI** podane przez Clerk. Wtedy pole Scopes też jest w tej samej konfiguracji Google w Clerk.

**Uwaga:** Użytkownicy, którzy już wcześniej logowali się przez Google *bez* tego scope, muszą się wylogować i zalogować ponownie (albo w ustawieniach konta „połączyć Google jeszcze raz”), żeby Google poprosił o nowe uprawnienie do Kalendarza.

Po tej konfiguracji nowi użytkownicy logujący się przez Google przy pierwszym logowaniu zobaczą prośbę Google o dostęp do Kalendarza. Token (i odświeżanie) przechowuje Clerk – aplikacja tylko wywołuje `getUserOauthAccessToken` i używa tokenu do wywołań Google Calendar API.

## Kiedy nadal potrzebny jest GOOGLE_CLIENT_ID

- Gdy użytkownik **nie** loguje się przez Google (np. email + hasło) i ma używać Kalendarza – wtedy może kliknąć „Połącz z Google Kalendarzem” na stronie **Google** w panelu. Ta ścieżka używa własnego OAuth (trasy `/api/google/oauth`, `/api/google/callback`) i **wymaga** GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET w zmiennych środowiskowych.
- Dla użytkowników tylko „Google przez Clerk” z włączonym zakresem Kalendarza **nie** trzeba ustawiać tych zmiennych w aplikacji.

## Podsumowanie

| Scenariusz | GOOGLE_CLIENT_ID w app | Gdzie konfiguracja |
|------------|------------------------|---------------------|
| Logowanie przez Google + zakres Kalendarza w Clerk | **Nie** | Clerk Dashboard → Google → Scopes |
| Logowanie email/hasło + przycisk „Połącz z Google” | **Tak** | .env + Google Cloud Console (OAuth client) |

Token jest zawsze pobierany przez `getGoogleCalendarToken()`: najpierw Clerk, potem (opcjonalnie) zapisane połączenie z bazy.
