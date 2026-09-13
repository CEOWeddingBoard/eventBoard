/**
 * Lista zadań ślubnych – wzorowana na pełnej checkliście (m.in. slubipapier.pl: 147 rzeczy do zrobienia).
 * Role: TOGETHER (Wspólnie), BRIDE (Pani Młoda), GROOM (Pan Młody).
 * monthsBefore = ile miesięcy przed datą ślubu ma być wykonane.
 *
 * Zasady czasowe:
 * - Suknia, buty ślubne, biżuteria: zamówienie wcześniej, GOTOWE ok. 6 miesięcy przed (odbiór z salonu).
 * - Wszystkie sprawy organizacyjne (płatności, niezbędnik, harmonogram, zaproszenia rozwiezione itd.) gotowe max 2 tygodnie przed (0.5 m).
 * - Ostatnie 2 tygodnie: tylko przymiarka finałowa, dopięcie spraw. Ostatni tydzień i dni: odpoczynek, maseczka, ostatnia randka, barber, sen.
 * - Skalowanie: przy krótszym czasie do ślubu (np. 3 m) zwracane są tylko zadania z monthsBefore <= 3 (filtrowanie w getTasksForMonthsUntilWedding).
 * - Ułamki: 0.5 ≈ 15 dni, 0.25 ≈ 7 dni, 0.1 ≈ 3 dni, 0.03 ≈ 1 dzień przed.
 */

export type TaskRole = "TOGETHER" | "BRIDE" | "GROOM";

export interface WeddingTaskTemplate {
  title: string;
  monthsBefore: number;
  role: TaskRole;
  category: string;
  description?: string;
}

/** Zadania wspólne dla wszystkich ślubów. Zadania typowe tylko dla ślubu kościelnego mają category zawierającą "Kościół" lub "Formalności" (nauki) – przy ślubie cywilnym można je pominąć w UI lub nie generować). */
export const WEDDING_TASKS_TEMPLATE: WeddingTaskTemplate[] = [
  // 1. Pierwsze decyzje (18–12 miesięcy)
  { title: "Poinformować najbliższych o ślubie", monthsBefore: 18, role: "TOGETHER", category: "Planowanie" },
  { title: "Ustalić orientacyjny termin (rok, miesiąc) – zależnie od wolnych sal", monthsBefore: 18, role: "TOGETHER", category: "Planowanie" },
  { title: "Ustalić budżet i maksymalną kwotę na wesele", monthsBefore: 18, role: "TOGETHER", category: "Budżet" },
  { title: "Ustalić orientacyjną liczbę gości", monthsBefore: 18, role: "TOGETHER", category: "Planowanie" },
  { title: "Wybór świadków i prośba o świadkowanie", monthsBefore: 18, role: "TOGETHER", category: "Goście" },
  { title: "Ustalić rodzaj ślubu: cywilny, kościelny, konkordatowy", monthsBefore: 18, role: "TOGETHER", category: "Planowanie" },
  { title: "Ustalić rejon wesela (okolice panny młodej, pana młodego, obecnego zamieszkania)", monthsBefore: 18, role: "TOGETHER", category: "Planowanie" },
  { title: "Ustalić, czy impreza jednodniowa czy dwudniowa (z poprawinami)", monthsBefore: 18, role: "TOGETHER", category: "Planowanie" },
  { title: "Budżetowa tabela: zaliczki, dopłaty, rezerwa 10%", monthsBefore: 18, role: "TOGETHER", category: "Budżet" },
  { title: "Ustalenie priorytetów: jedzenie, muzyka, zdjęcia, sala", monthsBefore: 18, role: "TOGETHER", category: "Planowanie" },

  // 2. Szukanie sali (12–10 miesięcy)
  { title: "Zrobić listę interesujących sal weselnych", monthsBefore: 12, role: "TOGETHER", category: "Sala" },
  { title: "Wysłać maile z prośbą o ofertę do sal", monthsBefore: 12, role: "TOGETHER", category: "Sala" },
  { title: "Obejrzeć wybrane sale i wybrać salę", monthsBefore: 12, role: "TOGETHER", category: "Sala" },
  { title: "Podpisać umowę z salą i wpłacić zaliczkę", monthsBefore: 12, role: "TOGETHER", category: "Sala" },
  { title: "Degustacja w sali – wstępny wybór menu", monthsBefore: 10, role: "TOGETHER", category: "Catering" },
  { title: "Ustalić harmonogram imprezy z obsługą sali", monthsBefore: 10, role: "TOGETHER", category: "Sala" },
  { title: "Ustalić kwestię dekoracji sali (sala vs zewnętrzna dekoratorka)", monthsBefore: 10, role: "TOGETHER", category: "Dekoracje" },

  // 3. Kościół (tylko ślub kościelny) – 12–3 miesiące
  { title: "Wybrać kościół i wstępnie zarezerwować termin", monthsBefore: 12, role: "TOGETHER", category: "Kościół" },
  { title: "Potwierdzić termin w kościele z początkiem nowego roku liturgicznego", monthsBefore: 10, role: "TOGETHER", category: "Kościół" },
  { title: "Ustalić koszty (opłaty) w parafii", monthsBefore: 10, role: "TOGETHER", category: "Kościół" },
  { title: "Nauki przedmałżeńskie w kościele – zapisać się w kancelarii parafialnej", monthsBefore: 6, role: "TOGETHER", category: "Formalności", description: "Cykl spotkań w parafii; zapytaj o terminy." },
  { title: "Kurs w poradni życia rodzinnego – zapisać się i ukończyć", monthsBefore: 5, role: "TOGETHER", category: "Formalności", description: "Wymagany do ślubu kościelnego." },
  { title: "Skompletować dokumenty do ślubu kościelnego (ok. 6 miesięcy przed)", monthsBefore: 6, role: "TOGETHER", category: "Kościół" },
  { title: "Uzupełnić protokół przedślubny w parafii", monthsBefore: 5, role: "TOGETHER", category: "Kościół" },
  { title: "Ustalić, który ksiądz poprowadzi ceremonię", monthsBefore: 5, role: "TOGETHER", category: "Kościół" },
  { title: "Porozmawiać z organistą o muzyce w kościele", monthsBefore: 5, role: "TOGETHER", category: "Kościół" },
  { title: "Ustalić z księdzem: oprawa muzyczna, kto czyta, dekoracje, sypanie przed kościołem", monthsBefore: 4, role: "TOGETHER", category: "Kościół" },
  { title: "Ustalić z księdzem: kto prowadzi pannę młodą do ołtarza, dzieci przed parą", monthsBefore: 4, role: "TOGETHER", category: "Kościół" },

  // 4. DJ / Zespół (12–1 miesiąc)
  { title: "Stworzyć listę potencjalnych DJ-ów lub zespołów", monthsBefore: 12, role: "TOGETHER", category: "Muzyka" },
  { title: "Wysłać wiadomości z prośbą o ofertę (DJ/zespół)", monthsBefore: 12, role: "TOGETHER", category: "Muzyka" },
  { title: "Wybrać 2–3 DJ-ów/zespoły i umówić spotkania", monthsBefore: 11, role: "TOGETHER", category: "Muzyka" },
  { title: "Zapytać DJ-a/zespół o ZAIKS, oświetlenie, dekoracje (dym, napis LOVE)", monthsBefore: 10, role: "TOGETHER", category: "Muzyka" },
  { title: "Podpisać umowę z DJ-em/zespół i wpłacić zaliczkę", monthsBefore: 10, role: "TOGETHER", category: "Muzyka" },
  { title: "Ustalić listę piosenek: wejście, pierwszy taniec, ulubione, zakazane", monthsBefore: 2, role: "TOGETHER", category: "Muzyka" },
  { title: "Ustalić harmonogram z DJ-em: tort, podziękowania dla rodziców, oczepiny", monthsBefore: 2, role: "TOGETHER", category: "Muzyka" },
  { title: "Ustalić formę oczepin i wybrane zabawy", monthsBefore: 2, role: "TOGETHER", category: "Muzyka" },

  // 5. Fotograf / Kamerzysta (12–1 miesiąc)
  { title: "Stworzyć listę potencjalnych fotografów i kamerzystów", monthsBefore: 12, role: "TOGETHER", category: "Usługodawcy" },
  { title: "Wysłać wiadomości z prośbą o ofertę (fotograf, kamerzysta)", monthsBefore: 12, role: "TOGETHER", category: "Usługodawcy" },
  { title: "Wybrać 2–3 fotografów i kamerzystów, umówić spotkania", monthsBefore: 11, role: "TOGETHER", category: "Usługodawcy" },
  { title: "Podpisać umowy z fotografem i kamerzystą, wpłacić zaliczki", monthsBefore: 10, role: "TOGETHER", category: "Usługodawcy" },
  { title: "Ustalić czas i miejsce sesji poślubnej", monthsBefore: 6, role: "TOGETHER", category: "Usługodawcy" },
  { title: "Ustalić ewentualną sesję narzeczeńską", monthsBefore: 6, role: "TOGETHER", category: "Usługodawcy" },
  { title: "Fotograf: ustalić kwestię dodatkowych albumów, termin i formę odbioru zdjęć", monthsBefore: 3, role: "TOGETHER", category: "Usługodawcy" },
  { title: "Kamerzysta: ustalić długość filmu, podkład muzyczny, formę i termin odbioru", monthsBefore: 3, role: "TOGETHER", category: "Usługodawcy" },

  // 6. Tort i słodki stół (8–2 miesiące)
  { title: "Zrobić listę usługodawców (tort, słodki stół) – jeśli nie przez salę", monthsBefore: 8, role: "TOGETHER", category: "Catering" },
  { title: "Wysłać maile z prośbą o ofertę (tort, słodki stół)", monthsBefore: 8, role: "TOGETHER", category: "Catering" },
  { title: "Umówić się na degustację tortów i wybrać wykonawcę", monthsBefore: 6, role: "TOGETHER", category: "Catering" },
  { title: "Podpisać umowę z cukiernią / słodki stół, wpłacić zaliczkę", monthsBefore: 6, role: "TOGETHER", category: "Catering" },
  { title: "Ustalić z salą i wykonawcą: dostawa, przechowywanie, wystawienie, sprzątanie", monthsBefore: 2, role: "TOGETHER", category: "Catering" },

  // 7. Dekoracje (10–4 miesiące)
  { title: "Wybrać kolor przewodni i ewentualny motyw wesela", monthsBefore: 10, role: "TOGETHER", category: "Dekoracje" },
  { title: "Decyzja: samodzielna dekoracja czy dekoratorka", monthsBefore: 10, role: "TOGETHER", category: "Dekoracje" },
  { title: "Rezerwacja florysty/dekoratora i paleta kolorystyczna", monthsBefore: 10, role: "TOGETHER", category: "Dekoracje" },
  { title: "Przy samodzielnej dekoracji: zamówić lub wypożyczyć dekoracje", monthsBefore: 4, role: "TOGETHER", category: "Dekoracje" },
  { title: "Ustalić dekorację kościoła i sali (jeśli kościół)", monthsBefore: 4, role: "TOGETHER", category: "Dekoracje" },

  // 8. Kwiaty – zamówienia do 6 m, przy DIY plan do 2 m (wykonanie w ostatnim tygodniu poza „relaksem”)
  { title: "Wybrać: florystka czy samodzielny zakup i dekoracja kwiatami", monthsBefore: 8, role: "TOGETHER", category: "Kwiaty" },
  { title: "Zamówić u florystki: bukiet, butonierki, dekoracja sali/kościoła/samochodu", monthsBefore: 6, role: "TOGETHER", category: "Kwiaty" },
  { title: "Przy DIY: zaplanować zakup na giełdzie kwiatowej i kompozycje (wykonać do 2 tyg. przed)", monthsBefore: 0.5, role: "BRIDE", category: "Kwiaty" },

  // 9. Oprawa muzyczna ślubu (kościół) (8–4 miesiące)
  { title: "Wybrać instrumenty na ślub (harfa, skrzypce, fortepian) i śpiew na żywo", monthsBefore: 8, role: "TOGETHER", category: "Kościół" },
  { title: "Stworzyć listę muzyków (oprawa ślubu), oferty, wybór, umowa, zaliczka", monthsBefore: 6, role: "TOGETHER", category: "Kościół" },
  { title: "Ustalić repertuar z muzykami i harmonogram z księdzem/organistą", monthsBefore: 4, role: "TOGETHER", category: "Kościół" },

  // 10. Ubiór – Panna Młoda: suknia/buty/biżuteria GOTOWE ok. 6 miesięcy przed
  { title: "Inspiracje (Pinterest): suknie, fryzury, dekoracje", monthsBefore: 12, role: "BRIDE", category: "Ubiór" },
  { title: "Rezerwacja terminów w salonach sukien ślubnych", monthsBefore: 12, role: "BRIDE", category: "Ubiór" },
  { title: "Wizyty w salonach, wybór sukni, podpisanie umowy, zdjęcie miary", monthsBefore: 10, role: "BRIDE", category: "Ubiór" },
  { title: "Odbiór sukni z salonu (suknia gotowa) – ok. 6 miesięcy przed", monthsBefore: 6, role: "BRIDE", category: "Ubiór" },
  { title: "Buty ślubne – wybór i zakup (dopasowanie do długości sukni)", monthsBefore: 8, role: "BRIDE", category: "Ubiór" },
  { title: "Biżuteria i ozdoby do włosów – wybór i zamówienie", monthsBefore: 8, role: "BRIDE", category: "Ubiór" },
  { title: "Bielizna, welon – gotowe ok. 6 miesięcy przed", monthsBefore: 6, role: "BRIDE", category: "Ubiór" },
  { title: "Kupić szlafrok i wieszak do sukni, rajstopy lub pończochy", monthsBefore: 4, role: "BRIDE", category: "Ubiór" },
  { title: "Okrycie wierzchnie (jeśli ślub w chłodniejszym okresie)", monthsBefore: 4, role: "BRIDE", category: "Ubiór" },
  { title: "Ewentualne buty i sukienka na przebranie w dniu ślubu", monthsBefore: 3, role: "BRIDE", category: "Ubiór" },
  { title: "Ubranie na drugi dzień (śniadanie / poprawiny)", monthsBefore: 2, role: "BRIDE", category: "Ubiór" },
  { title: "Coś niebieskiego, coś starego, coś pożyczonego", monthsBefore: 1, role: "BRIDE", category: "Ubiór" },

  // 11. Ubiór – Pan Młody (10–0 miesiące)
  { title: "Wstępny wybór stylu garnituru (smoking, garnitur trzyczęściowy)", monthsBefore: 10, role: "GROOM", category: "Ubiór" },
  { title: "Zakup garnituru (gotowy lub na miarę)", monthsBefore: 6, role: "GROOM", category: "Ubiór" },
  { title: "Koszule (najlepiej dwie), buty, pasek lub szelki", monthsBefore: 6, role: "GROOM", category: "Ubiór" },
  { title: "Krawat lub mucha, poszetka, spinki do mankietów, bielizna, skarpetki", monthsBefore: 6, role: "GROOM", category: "Ubiór" },
  { title: "Ubranie na drugi dzień", monthsBefore: 2, role: "GROOM", category: "Ubiór" },

  // 12. Obrączki (6–1 miesiąc)
  { title: "Wybór modelu obrączek i graweru", monthsBefore: 6, role: "TOGETHER", category: "Ubiór" },
  { title: "Zamówienie obrączek (czas na grawer i ewentualną zmianę rozmiaru)", monthsBefore: 6, role: "TOGETHER", category: "Ubiór" },
  { title: "Zamówienie pudełka na obrączki", monthsBefore: 4, role: "TOGETHER", category: "Ubiór" },
  { title: "Ustalić, kto w dniu ślubu odpowiada za obrączki", monthsBefore: 1, role: "TOGETHER", category: "Ubiór" },

  // 13. Samochód (6–2 miesiące)
  { title: "Sprawdzić oferty i wybrać auto dla pary młodej", monthsBefore: 6, role: "TOGETHER", category: "Transport" },
  { title: "Podpisać umowę wynajmu samochodu", monthsBefore: 4, role: "TOGETHER", category: "Transport" },
  { title: "Ustalić kwestię dekoracji auta", monthsBefore: 2, role: "TOGETHER", category: "Transport" },

  // 14. Noclegi i transport dla gości (10–2 miesiące)
  { title: "Ustalić bazę noclegową (sala, hotele w pobliżu)", monthsBefore: 10, role: "TOGETHER", category: "Logistyka" },
  { title: "Ustalić, czy noclegi dla gości i kto płaci; poinformować na zaproszeniach", monthsBefore: 8, role: "TOGETHER", category: "Logistyka" },
  { title: "Poinformować gości o noclegach, ustalić datę potwierdzenia", monthsBefore: 4, role: "TOGETHER", category: "Logistyka" },
  { title: "Wykonać rezerwację noclegów dla gości", monthsBefore: 3, role: "TOGETHER", category: "Logistyka" },
  { title: "Transport dla gości (jeśli wielu z daleka): znaleźć usługodawcę, rezerwacja", monthsBefore: 3, role: "TOGETHER", category: "Transport" },
  { title: "Ustalić godziny i punkty zbiórki transportu dla gości", monthsBefore: 2, role: "TOGETHER", category: "Transport" },

  // 15. Zaproszenia i papeteria – zamówienie 9 m, wysyłka 7 m, RSVP do 5–4 m przed
  { title: "Save the date — wysłać gościom z zagranicy lub przy popularnym terminie (opcjonalnie)", monthsBefore: 10, role: "TOGETHER", category: "Zaproszenia", description: "6–12 miesięcy przed ślubem dla gości z daleka." },
  { title: "Zamówić zaproszenia ślubne — projekt i druk", monthsBefore: 9, role: "TOGETHER", category: "Zaproszenia", description: "Zamówienie na 8–9 miesięcy przed ślubem." },
  { title: "Odebrać zaproszenia i papeterię (winietki, numery stołów, menu, harmonogram)", monthsBefore: 8, role: "TOGETHER", category: "Zaproszenia" },
  { title: "Zamówić: etykiety na alkohol, księga gości (i pisaki), pudełko na koperty", monthsBefore: 8, role: "TOGETHER", category: "Papeteria" },
  { title: "Tablice rejestracyjne ślubne, drogowskazy, pudełka na ciasto dla gości", monthsBefore: 8, role: "TOGETHER", category: "Papeteria" },
  { title: "Lista gości: dokładne adresy do wysyłki zaproszeń", monthsBefore: 8, role: "TOGETHER", category: "Goście" },
  { title: "Wyślij lub wręcz zaproszenia (co najmniej 6–7 mies. przed ślubem)", monthsBefore: 7, role: "TOGETHER", category: "Zaproszenia", description: "Krócej niż 6 miesięcy to spóźnienie — goście mogą nie zdążyć z urlopem." },
  { title: "Ustawić termin RSVP w zaproszeniach (co najmniej 4 mies. przed; najlepiej 5)", monthsBefore: 7, role: "TOGETHER", category: "Goście" },
  { title: "Zbierać potwierdzenia przybycia (RSVP) na bieżąco", monthsBefore: 6, role: "TOGETHER", category: "Goście", description: "Od pierwszego dnia po wysyłce zaproszeń." },
  { title: "Zamknij listę gości po terminie RSVP", monthsBefore: 4, role: "TOGETHER", category: "Goście", description: "Przekaż firmie cateringowej liczbę porcji w ciągu 48 h." },

  // 16. Usadzenie gości – wszystko gotowe max 2 tygodnie przed (0.5 m)
  { title: "Ustalić z salą rodzaj stołów (prostokątne, okrągłe)", monthsBefore: 4, role: "TOGETHER", category: "Goście" },
  { title: "Ustalić usadzenie gości (kto z kim siedzi)", monthsBefore: 2, role: "TOGETHER", category: "Goście" },
  { title: "Przygotować plany stołów, numerki na stoły, winietki ślubne", monthsBefore: 0.5, role: "TOGETHER", category: "Goście" },
  { title: "Menu weselne i program uroczystości na stoły (opcjonalnie)", monthsBefore: 0.5, role: "TOGETHER", category: "Goście" },

  // 17. Fryzjer, makijażystka, uroda – zabiegi „na ostatnią chwilę” do 2 tyg. przed; barber 3 dni przed
  { title: "Plan pielęgnacyjny: kosmetolog, zabiegi na cerę i włosy", monthsBefore: 8, role: "BRIDE", category: "Uroda" },
  { title: "Wybrać fryzurę i fryzjerkę, ustalić miejsce (salon / dom / sala)", monthsBefore: 6, role: "BRIDE", category: "Uroda" },
  { title: "Wybrać makijażystkę, umowa, zaliczka", monthsBefore: 6, role: "BRIDE", category: "Uroda" },
  { title: "Umówić się na fryzurę próbną", monthsBefore: 4, role: "BRIDE", category: "Uroda" },
  { title: "Fryzura i makijaż próbny (rano – sprawdzenie trwałości)", monthsBefore: 3, role: "BRIDE", category: "Uroda" },
  { title: "Regulacja brwi, depilacja, manicure, pedicure – zrobić do 2 tygodni przed", monthsBefore: 0.5, role: "BRIDE", category: "Uroda" },
  { title: "Wizyta u barbera (2–3 dni przed ślubem)", monthsBefore: 0.1, role: "GROOM", category: "Uroda" },

  // 18. Alkohol – zamówienie i ustalenia do 2 m; transport na salę do 2 tyg. przed (0.5)
  { title: "Wybrać rodzaj i ilość alkoholu na wesele", monthsBefore: 4, role: "TOGETHER", category: "Catering" },
  { title: "Zamówić alkohol", monthsBefore: 2, role: "TOGETHER", category: "Catering" },
  { title: "Ustalić przechowywanie (lodówka) i podawanie (kelnerzy/świadkowie)", monthsBefore: 2, role: "TOGETHER", category: "Catering" },
  { title: "Zamówić etykiety na alkohol weselny", monthsBefore: 2, role: "TOGETHER", category: "Papeteria" },
  { title: "Przygotowanie alkoholu: transport na salę, policzenie stanów (do 2 tyg. przed)", monthsBefore: 0.5, role: "GROOM", category: "Catering" },

  // 19. Pierwszy taniec (6–3 miesiące)
  { title: "Ustalić, czy będzie pierwszy taniec", monthsBefore: 6, role: "TOGETHER", category: "Muzyka" },
  { title: "Wybrać piosenkę na pierwszy taniec", monthsBefore: 5, role: "TOGETHER", category: "Muzyka" },
  { title: "Nauka układu: szkoła tańca lub samodzielnie", monthsBefore: 4, role: "TOGETHER", category: "Muzyka" },
  { title: "Ostatni dzwonek na choreografię / kurs pierwszego tańca", monthsBefore: 3, role: "TOGETHER", category: "Muzyka" },

  // 20. Dodatkowe atrakcje (10–2 miesiące)
  { title: "Zastanowić się nad atrakcjami: fotobudka, zimne ognie, fontanna czekoladowa", monthsBefore: 10, role: "TOGETHER", category: "Atrakcje" },
  { title: "Słodki / wiejski stół, drink bar, animator dla dzieci – rezerwacja", monthsBefore: 8, role: "TOGETHER", category: "Atrakcje" },
  { title: "Rezerwacja: fotobudka, Instax z wkładami, bańki mydlane, budka z lodami", monthsBefore: 4, role: "TOGETHER", category: "Atrakcje" },

  // 21. Prezenty (4–1 miesiąc)
  { title: "Zamówić prezenty dla gości (np. krówki weselne)", monthsBefore: 4, role: "TOGETHER", category: "Prezenty" },
  { title: "Zamówić prezenty dla rodziców", monthsBefore: 3, role: "TOGETHER", category: "Prezenty" },
  { title: "Ustalić prezenty dla dziadków, chrzestnych, świadków i zamówić", monthsBefore: 2, role: "TOGETHER", category: "Prezenty" },

  // 22. Formalności USC (cywilny) (6–3 miesiące)
  { title: "Rezerwacja terminu w USC (ślub cywilny)", monthsBefore: 6, role: "TOGETHER", category: "Formalności" },
  { title: "Skompletować dokumenty do USC (dowody, zaświadczenia)", monthsBefore: 4, role: "TOGETHER", category: "Formalności" },
  { title: "Wizyta w USC/parafii: złożenie dokumentów (ważność zaświadczeń do 6 miesięcy)", monthsBefore: 3, role: "TOGETHER", category: "Formalności" },

  // 23. Końcowe ustalenia – WSZYSTKO gotowe max 2 tygodnie przed (0.5 m)
  { title: "Ustalić miejsce przygotowań i błogosławieństwa", monthsBefore: 2, role: "TOGETHER", category: "Logistyka" },
  { title: "Ustalić datę wieczoru panieńskiego i kawalerskiego", monthsBefore: 2, role: "TOGETHER", category: "Planowanie" },
  { title: "Harmonogram dnia ślubu (co 15 min): od makijażu po oczepiny", monthsBefore: 0.5, role: "TOGETHER", category: "Logistyka" },
  { title: "Rozesłać harmonogram do podwykonawców", monthsBefore: 0.5, role: "TOGETHER", category: "Logistyka" },
  { title: "Ustalić, kto za co odpowiada w dniu ślubu", monthsBefore: 0.5, role: "TOGETHER", category: "Logistyka" },
  { title: "Przygotować koszyczki ratunkowe do łazienek (lub ustalić z salą)", monthsBefore: 0.5, role: "TOGETHER", category: "Logistyka" },
  { title: "Przygotować drobne, słodycze i alkohol na bramę", monthsBefore: 0.5, role: "TOGETHER", category: "Logistyka" },
  { title: "Kupić konfetti", monthsBefore: 0.5, role: "TOGETHER", category: "Logistyka" },
  { title: "Ustalić kwestie podróży poślubnej", monthsBefore: 0.5, role: "TOGETHER", category: "Planowanie" },
  { title: "Piosenki: wejście, pierwszy taniec, tort, podziękowania – lista dla DJ-a", monthsBefore: 0.5, role: "TOGETHER", category: "Muzyka" },

  // 2 tygodnie przed (0.5): ostatnie sprawy organizacyjne – potem tylko relaks
  { title: "Przymiarka finałowa: suknia i garnitur (sprawdzenie prasowania, dopasowanie)", monthsBefore: 0.5, role: "TOGETHER", category: "Ubiór" },
  { title: "Niezbędnik ratunkowy: agrafki, plastry, tabletki, nitka, rajstopy na zmianę", monthsBefore: 0.5, role: "TOGETHER", category: "Logistyka" },
  { title: "Płatności: koperty z gotówką dla podwykonawców (podpisane)", monthsBefore: 0.5, role: "TOGETHER", category: "Finanse" },
  { title: "Rozchodzenie butów w domu (grube skarpetki)", monthsBefore: 0.5, role: "TOGETHER", category: "Ubiór" },

  // Ostatni tydzień (0.25 ≈ 7 dni): tylko odpoczynek i pielęgnacja
  { title: "Odpocznij – dzień bez planowania wesela", monthsBefore: 0.25, role: "TOGETHER", category: "Relaks" },
  { title: "Maseczka / pielęgnacja twarzy – chwila dla siebie", monthsBefore: 0.25, role: "BRIDE", category: "Relaks" },
  { title: "Ostatnia randka jako narzeczeństwo – wieczór we dwoje", monthsBefore: 0.25, role: "TOGETHER", category: "Relaks" },
  { title: "Spakuj torbę na drugi dzień (poprawiny)", monthsBefore: 0.25, role: "TOGETHER", category: "Logistyka" },

  // 3 dni przed (0.1)
  { title: "Wyśpij się – ostatnie noce przed wielkim dniem", monthsBefore: 0.1, role: "TOGETHER", category: "Relaks" },

  // Dzień przed (0.03 ≈ 1 dzień)
  { title: "Relaks: masaż lub kino – zakaz rozmów o ślubie", monthsBefore: 0.03, role: "TOGETHER", category: "Relaks" },

  // Dzień ślubu (0)
  { title: "Dzień ślubu – Pani Młoda: zjeść śniadanie; koszula rozpinana (ochrona fryzury)", monthsBefore: 0, role: "BRIDE", category: "Dzień ślubu" },
  { title: "Dzień ślubu – Pan Młody: sprawdzić obrączki i dokumenty tożsamości", monthsBefore: 0, role: "GROOM", category: "Dzień ślubu" },
];

export function getTasksForMonthsUntilWedding(monthsUntil: number): WeddingTaskTemplate[] {
  return WEDDING_TASKS_TEMPLATE.filter((t) => t.monthsBefore <= monthsUntil + 0.5);
}

/**
 * Dla ślubu cywilnego: filtruj zadania typowe tylko dla kościoła (Kościół, nauki, poradnia w Formalności).
 * Dla ślubu kościelnego zwraca wszystkie.
 */
export function getTasksForMonthsUntilWeddingByType(
  monthsUntil: number,
  weddingType: "church" | "civil"
): WeddingTaskTemplate[] {
  const all = getTasksForMonthsUntilWedding(monthsUntil);
  if (weddingType === "church") return all;
  return all.filter(
    (t) =>
      t.category !== "Kościół" &&
      !(t.category === "Formalności" && t.title.toLowerCase().includes("nauki")) &&
      !(t.category === "Formalności" && t.title.toLowerCase().includes("poradni"))
  );
}

/**
 * Oblicza termin wykonania: monthsBefore >= 1 = miesiące przed ślubem, < 1 = dni przed.
 * Mapowanie ułamków na dni: 0.5 → 14 dni, 0.25 → 7 dni, 0.1 → 3 dni, 0.03 → 1 dzień.
 * Przy krótszym czasie do ślubu (np. 3 m) zadania są filtrowane (monthsBefore <= monthsUntil), więc daty się skalują.
 */
export function dueDateFromCeremony(ceremonyDate: Date, monthsBefore: number): Date {
  const d = new Date(ceremonyDate);
  if (monthsBefore >= 1) {
    d.setMonth(d.getMonth() - Math.round(monthsBefore));
    return d;
  }
  const key = Math.round(monthsBefore * 100) / 100;
  const daysMap: Record<number, number> = { 0.5: 14, 0.25: 7, 0.1: 3, 0.03: 1 };
  const daysBefore = daysMap[key] ?? Math.max(0, Math.round(monthsBefore * 30));
  d.setDate(d.getDate() - daysBefore);
  return d;
}
