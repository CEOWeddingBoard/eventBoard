# Import listy gości – szablon Excel

## Plik wzorcowy

W repozytorium jest plik **`public/szablon_lista_gosci.xlsx`** – wzorcowy szablon w formacie Excel. Użytkownik może:
- **w aplikacji:** panel **Goście** → **Importuj gości** → **Pobierz szablon** (pobiera ten plik),
- **lub** skopiować plik z repo (`public/szablon_lista_gosci.xlsx`), uzupełnić w Excelu i wczytać w aplikacji przez **Importuj gości** → wybór pliku → **Importuj z CSV**.

Plik ma dwie kolumny (Imię, Nazwisko) i trzy przykładowe wiersze – można je zastąpić własnymi danymi.

Aby wygenerować plik szablonu na nowo (np. po zmianie kolumn):
```bash
node scripts/generate-guest-template.js
```

## Format pliku

**Wymagane kolumny (wystarczą do importu):**

| Kolumna     | Opis           |
|------------|----------------|
| **Imię**   | Imię gościa    |
| **Nazwisko** | Nazwisko gościa |

Reszta kolumn nie jest wymagana. Opcjonalnie: kolumna **Nazwa grupy domowej (np. Kowalscy)** – osoby z tą samą nazwą trafią do jednego gospodarstwa; bez niej każdy gość ma osobne gospodarstwo (Imię + Nazwisko).

## Jak uzupełnić szablon

1. Pobierz szablon (przycisk **Pobierz szablon** w oknie „Importuj gości”) – plik **.xlsx**.
2. Otwórz plik w **Excelu**.
3. Nie usuwaj pierwszej linii (nagłówki). Wypełnij **Imię** i **Nazwisko** od drugiego wiersza.
4. Zapisz plik (format Excel .xlsx lub .xls).
5. W aplikacji: **Importuj gości** → **Wybierz plik** (Excel lub CSV) → **Importuj z CSV**.

## Obsługiwane formaty importu

- **Excel:** .xlsx, .xls  
- **CSV:** .csv (z nagłówkami Imię, Nazwisko)

## Uwagi

- Wymagane są kolumny **Imię** i **Nazwisko** w pierwszym wierszu.
- Po imporcie lista gości odświeży się automatycznie.
