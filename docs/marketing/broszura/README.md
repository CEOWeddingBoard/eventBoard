# Broszura EventBoard (PDF)

Materiał sprzedażowy dla potencjalnych klientów — sal, restauracji i obiektów eventowych.
Wynik: `docs/marketing/EventBoard-broszura.pdf` (10 stron A4).

Treść pochodzi ze strony sprzedażowej (`src/components/landing/*`) i cennika
(`src/lib/plans.ts`). **Zmieniasz ofertę lub ceny tam — przegeneruj broszurę**, inaczej
materiał zacznie obiecywać co innego niż produkt.

Zrzut ekranu w broszurze: `docs/screens/03-panel-procesu.png` — świadomie jedyny, bo tylko
ten pokazuje panel bez danych testowych. Reszta widoków to makiety składane w HTML.

## Generowanie

```bash
node docs/marketing/broszura/render.js
```

Render idzie przez Chromium z Playwrighta (`npm i` wystarczy — przeglądarka jest już
w zależnościach E2E). Fonty leżą lokalnie w `fonts/` i są wklejane do HTML jako base64,
więc render nie potrzebuje sieci.
