# Konfiguracja AI (OpenAI / DeepSeek)

## Reset bazy (wyczyść wszystko i od nowa)

1. **Zatrzymaj serwer** (`Ctrl+C` w terminalu z `npm run dev`).
2. W katalogu projektu uruchom:
   ```bash
   npm run db:reset:fresh
   ```
   To usuwa plik bazy SQLite (`dev.db`), stosuje schemat i uruchamia seed (w tym **Event** dla mock user – potrzebny do „Wygeneruj plan zadań AI”).
3. Uruchom ponownie: `npm run dev`.

Jeśli `npm run db:seed` u Ciebie działa (bez resetu), samo **`npm run db:seed`** też utworzy Event dla mock user – wtedy „Wygeneruj plan zadań AI” będzie działać bez zatrzymywania serwera.

---


Aplikacja używa AI do:
- generowania planu wesela (zadania + budżet),
- generowania listy zadań z rolami (Pan Młody, Pani Młoda, Wspólnie) i timeline,
- **Kreatora zaproszeń AI** (wzór na podstawie ankiety i ewentualnie przykładowego zaproszenia),
- (opcjonalnie) sugestii usadzenia.

Dla zaproszeń (tekst, bez obrazu) używany jest ten sam provider co dla zadań: `AI_PROVIDER=openai` lub `AI_PROVIDER=deepseek`. **DeepSeek** często ma wyższe limity (RPM) niż OpenAI – przy błędzie „Too Many Requests” ustaw w `.env.local`: `AI_PROVIDER=deepseek` i `DEEPSEEK_API_KEY=...`.

**Kreator zaproszeń (Wizard):** krok po kroku (okazja, styl wizualny, dane, vibe) → **OpenRouter** z modelem **google/gemini-2.5-flash** generuje treść zaproszenia, kolory i sugestię wizualną (prompt do generatora obrazów). Wymaga `OPENROUTER_API_KEY` w `.env.local` (ten sam co do obrazów). Opcjonalnie `OPENROUTER_INVITATION_MODEL=google/gemini-2.5-flash`.

**Obrazy (wzór zaproszenia, generowanie z tekstu):** gdy użytkownik wgra przykładowy obraz lub gdy aplikacja generuje obraz z tekstu, używany jest **AI_IMAGE_PROVIDER=openrouter** z modelem **sourceful/riverflow-v2-pro** (OpenRouter). Wymaga `OPENROUTER_API_KEY` w `.env.local`.

## Który plik .env ma znaczenie przy `npm run dev`

Next.js ładuje zmienne w kolejności (późniejszy **nadpisuje** wcześniejszy):

| Kolejność | Plik | Uwagi |
|-----------|------|--------|
| 1 | `.env` | Wspólne dla wszystkich |
| 2 | `.env.development` | Tylko przy `npm run dev` |
| 3 | `.env.development.local` | Lokalny override (gitignore) |
| 4 | **`.env.local`** | **Ma najwyższy priorytet** – tu ustaw `AI_PROVIDER` i klucze |

**Wniosek:** przy `npm run dev` to **`.env.local`** decyduje. Jeśli masz w `.env` wartość `AI_PROVIDER=mock`, a w `.env.local` masz `AI_PROVIDER=openai`, używane jest **openai**. Aby przejść na DeepSeek lub mock, **edytuj `.env.local`** (w katalogu głównym projektu) i zrestartuj serwer.

**Diagnostyka:** po kliknięciu „Wygeneruj plan zadań AI” w terminalu (gdzie działa `npm run dev`) pojawi się linia typu:  
`[AI] Generowanie zadań: provider=openai, model=gpt-4o-mini (openai key: ustawiony, deepseek key: brak)`  
Dzięki temu widzisz, który provider i model są faktycznie używane.

## Gdzie wrzucić klucze API

Klucze trzymasz **lokalnie** w pliku **`.env.local`** (ten plik nie jest commitowany do repo).

1. W katalogu projektu utwórz plik `.env.local` (albo skopiuj wzór):
   ```bash
   cp .env.example .env.local
   ```
2. Otwórz **`.env.local`** w edytorze i ustaw **jedną** z opcji:
   - **OpenAI:** `AI_PROVIDER=openai` oraz `OPENAI_API_KEY=sk-...`
   - **DeepSeek:** `AI_PROVIDER=deepseek` oraz `DEEPSEEK_API_KEY=sk-...` (klucz z [platform.deepseek.com](https://platform.deepseek.com))
   - **Kreator zaproszeń (Wizard):** ten sam `OPENROUTER_API_KEY` co dla obrazów – Wizard używa modelu Gemini 2.5 Flash przez OpenRouter.
   ```env
   # Przykład: DeepSeek (doładowane konto)
   AI_PROVIDER=deepseek
   DEEPSEEK_API_KEY=sk-twoj-klucz-z-deepseek

   # OpenRouter – obrazy + kreator zaproszeń (Wizard)
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Zapisz plik i zrestartuj serwer deweloperski (`npm run dev`).

**Uwaga:** Plik `.env.local` jest w `.gitignore` – nie commituj go do repozytorium (klucz musiałby być publiczny).

---

## Jak wygenerować klucz API (OpenAI)

1. Wejdź na **[platform.openai.com](https://platform.openai.com)** i zaloguj się (lub załóż konto).
2. Przejdź do **API Keys**:  
   [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)  
   (menu: ikona konta → **View API keys** albo **API keys** w bocznym menu).
3. Kliknij **„Create new secret key”** (Utwórz nowy klucz).
4. Nadaj nazwę (np. „Wedding Planner”) i potwierdź.
5. **Skopiuj klucz od razu** – wygląda jak `sk-proj-...` lub `sk-...`.  
   Po zamknięciu okna nie da się go już podejrzeć, tylko wygenerować nowy.
6. Wklej skopiowany klucz do `.env.local` jako wartość `OPENAI_API_KEY` (bez cudzysłowów):
   ```env
   OPENAI_API_KEY=sk-proj-abc123...
   ```

**Płatności:** Aby API działało, na koncie OpenAI musisz mieć dodaną metodę płatności (Billing). Nowe konta dostają kilka dolarów kredytu na start – [platform.openai.com/account/billing](https://platform.openai.com/account/billing).

---

## Błąd 429 / „insufficient_quota” (wyczerpany limit)

Gdy zobaczysz błąd **429** lub **insufficient_quota**, oznacza to, że na koncie OpenAI skończył się limit (kredyt lub limit planu).

**Co zrobić:**

1. **Doładuj konto** – [platform.openai.com/account/billing](https://platform.openai.com/account/billing) → dodaj metodę płatności i doładuj środki (lub sprawdź użycie i limity).
2. **Użyj DeepSeek** – jeśli masz doładowane konto w DeepSeek, w `.env.local` ustaw `AI_PROVIDER=deepseek` i `DEEPSEEK_API_KEY=sk-...` (klucz z [platform.deepseek.com](https://platform.deepseek.com)).
3. **Tymczasowo bez API** – ustaw `AI_PROVIDER=mock`. Przycisk „Wygeneruj plan zadań AI” będzie korzystał z wbudowanej listy zadań (szablon), bez wywołań API.

---

## DeepSeek (alternatywa do OpenAI)

Możesz używać **DeepSeek** zamiast OpenAI – API jest kompatybilne, a konto możesz mieć doładowane tam, gdzie w OpenAI limit się skończył.

1. Wejdź na **[platform.deepseek.com](https://platform.deepseek.com)** i zaloguj się.
2. Utwórz klucz API (API Keys) i skopiuj go.
3. W `.env.local` ustaw:
   ```env
   AI_PROVIDER=deepseek
   DEEPSEEK_API_KEY=sk-twoj-klucz
   ```
4. Zrestartuj `npm run dev`.

---

## OpenRouter (AI_IMAGE_PROVIDER – obrazy zaproszeń)

**Cel:** Wygenerować **obraz zaproszenia** na podstawie **ankiety** (styl, kolory, tekst powitalny, podpis) oraz **opcjonalnie wgranego obrazu wzoru** (tylko sugestia – model ma przeanalizować styl/układ i dostosować do danych z ankiety).

### Dobór modelu (OPENROUTER_IMAGE_MODEL)

| Model | Zalety | Uwagi |
|-------|--------|--------|
| **sourceful/riverflow-v2-pro** | Bardzo dobre **renderowanie tekstu w obrazie** (imiona, data, podpis), opcja `font_inputs`, image-to-image (wzór → nowy obraz) | Czasem 404 „No endpoints…” – wtedy zmień na inny model poniżej |
| **sourceful/riverflow-v2-fast-preview** | Tańszy, dobra dostępność, nadal dobry tekst w obrazie | Dobra alternatywa gdy pro zwraca 404 |
| **google/gemini-2.5-flash-image** | Dobre pokrycie endpointów, kontrola aspect ratio | Ogólnie dobra dostępność na OpenRouter |

**Rekomendacja:** Zaczynaj od `sourceful/riverflow-v2-pro` (najlepszy do zaproszeń z czytelnym tekstem). Przy błędzie **404** („No endpoints found that support… modalities: image, text”) ustaw w `.env.local` np. `OPENROUTER_IMAGE_MODEL=sourceful/riverflow-v2-fast-preview` lub `OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image` i zrestartuj serwer. Lista modeli z obrazem: [openrouter.ai/collections/image-models](https://openrouter.ai/collections/image-models).

### Konfiguracja

1. Wejdź na **[openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)** i utwórz klucz API.
2. W `.env.local` ustaw:
   ```env
   AI_IMAGE_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk-or-v1-twoj-klucz
   OPENROUTER_IMAGE_MODEL=sourceful/riverflow-v2-pro
   ```
3. Zrestartuj `npm run dev`.

Gdy użytkownik wgra **przykładowy obraz** zaproszenia, zapytanie idzie do OpenRouter – model zwraca **wygenerowany obraz** zaproszenia na podstawie wzoru i danych z ankiety. Bez obrazu wzoru używany jest sam tekst ankiety (text-to-image).

### Błąd 401 „User not found” (OpenRouter)

Ten błąd **nie wynika z wyboru modelu** – oznacza, że **klucz API jest odrzucony** (nieprawidłowy, wygasły lub konto nieaktywne).

**Co zrobić:**

1. Wejdź na **[openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)** (lub [openrouter.ai/keys](https://openrouter.ai/keys)).
2. Zaloguj się na konto OpenRouter (jeśli nie masz – załóż je).
3. **Utwórz nowy klucz API** (Create key). Skopiuj klucz – format to `sk-or-v1-...`.
4. W `.env.local` ustaw **dokładnie**:  
   `OPENROUTER_API_KEY=sk-or-v1-twoj-nowy-klucz`  
   (bez spacji, cudzysłowów, bez znaku nowej linii na końcu).
5. **Zatrzymaj** `npm run dev` (Ctrl+C) i uruchom ponownie **`npm run dev`** – Next.js ładuje zmienne tylko przy starcie.

Jeśli 401 nadal się pojawia: usuń stary klucz w OpenRouter, utwórz nowy, wklej do `.env.local`, zrestartuj serwer. Na koncie OpenRouter sprawdź, czy masz doładowane środki / kredyty (niektóre modele wymagają płatności).

### Błąd 404 „No endpoints found that support the requested output modalities: image, text”

Oznacza to, że **dla wybranego modelu OpenRouter nie ma aktywnego endpointu** obsługującego generowanie obrazu + tekstu (np. tymczasowa niedostępność dostawcy).

**Co zrobić:** W `.env.local` zmień `OPENROUTER_IMAGE_MODEL` na inny model, np.:
- `sourceful/riverflow-v2-fast-preview`
- `google/gemini-2.5-flash-image`

Zapisz plik i zrestartuj `npm run dev`. Pełna lista modeli z obrazem: [openrouter.ai/collections/image-models](https://openrouter.ai/collections/image-models).

---

## Wybieranie modelu językowego

`AI_PROVIDER` wybiera **dostawcę** (OpenAI lub DeepSeek). **Konkretny model** (np. DeepSeek-V3.2) ustawiasz osobną zmienną w `.env` lub `.env.local`:

| Provider  | Zmienna                | Domyślna wartość   | Przykładowe wartości |
|-----------|------------------------|--------------------|------------------------|
| OpenAI    | `OPENAI_TASKS_MODEL`   | `gpt-4o-mini`       | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| DeepSeek  | `DEEPSEEK_TASKS_MODEL` | `deepseek-chat`     | `deepseek-chat` (DeepSeek-V3.2), `deepseek-reasoner` (tryb „thinking”) |

**DeepSeek-V3.2:** W API DeepSeek aktualny model chat to **DeepSeek-V3.2**, a jego **identyfikator w API** to `deepseek-chat`. Nie ma osobnego ID typu `deepseek-v3.2` – używaj `deepseek-chat`. Tryb z rozbudowanym rozumowaniem to `deepseek-reasoner`.

Przykład w `.env.local` (DeepSeek + jawnie wybrany model):
```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
# Opcjonalnie: domyślnie i tak jest deepseek-chat (V3.2)
DEEPSEEK_TASKS_MODEL=deepseek-chat
```

**Analiza obrazu (wzór zaproszenia):**  
- **AI_IMAGE_PROVIDER=openrouter** (zalecane) – jeden model do obrazów: generowanie z tekstu (text-to-image), z przykładowego obrazu (image-to-image) i analiza wzoru. Ustaw w `.env.local`:  
  `AI_IMAGE_PROVIDER=openrouter`, `OPENROUTER_API_KEY=sk-or-v1-...`, `OPENROUTER_IMAGE_MODEL=sourceful/riverflow-v2-pro`.  
  Klucz OpenRouter: [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys). Model **sourceful/riverflow-v2-pro** zwraca wygenerowany obraz zaproszenia na podstawie wgranego wzoru i danych z ankiety.  
- **OpenAI / DeepSeek** (bez AI_IMAGE_PROVIDER) – przy wgraniu obrazu używany jest ten sam provider co do zadań (OpenAI: `gpt-4o`/`gpt-4o-mini`, DeepSeek: `DEEPSEEK_VISION_MODEL` jeśli ustawiony). Zwracany jest tekst (JSON z HTML), nie obraz.

W terminalu przy `npm run dev` po kliknięciu „Wygeneruj plan zadań AI” zobaczysz linię typu:  
`[AI] Generowanie zadań: provider=deepseek, model=deepseek-chat (...)` – to potwierdza, z jakiego modelu korzysta aplikacja.

---

## Tryby działania

| `AI_PROVIDER` | Zachowanie |
|---------------|------------|
| `mock` (domyślnie) | Bez wywołań API; zwracane są przykładowe zadania/plan. |
| `openai` | Wywołania OpenAI; wymagany `OPENAI_API_KEY`. |
| `deepseek` | Wywołania DeepSeek; wymagany `DEEPSEEK_API_KEY`. |

Jeśli ustawisz `AI_PROVIDER=openai` lub `deepseek` i nie podasz odpowiedniego klucza, aplikacja zwróci błąd z informacją, co ustawić w `.env.local`.
