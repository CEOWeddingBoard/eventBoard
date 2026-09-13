import { subMonths, subWeeks, subDays } from 'date-fns';

// Define priority values that match Prisma enum exactly
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GeneratedTask {
  title: string;
  dueDate: Date;
  category: string;
  notes: string;
  description: string;
  priority: TaskPriority;
}

// Helper function to ensure priority is always valid
const ensurePriority = (priority: string): TaskPriority => {
  const validPriorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
  if (validPriorities.includes(priority as TaskPriority)) {
    return priority as TaskPriority;
  }
  return 'MEDIUM';
};

// This is our "AI" model. It contains a comprehensive list of wedding tasks
// with relative timings. The function will use these to generate a concrete timeline.
const taskModel = [
  // 12-18 Months Out
  { timing: (d: Date) => subMonths(d, 12), category: 'Planowanie', title: 'Określ budżet wesela', notes: 'Ustalcie maksymalną kwotę, jaką chcecie przeznaczyć na całą uroczystość.', description: 'Ustalcie maksymalną kwotę, jaką chcecie przeznaczyć na całą uroczystość.', priority: 'HIGH' },
  { timing: (d: Date) => subMonths(d, 12), category: 'Planowanie', title: 'Stwórz wstępną listę gości', notes: 'Spiszcie wszystkie osoby, które chcielibyście zaprosić, aby oszacować wielkość wesela.', description: 'Spiszcie wszystkie osoby, które chcielibyście zaprosić, aby oszacować wielkość wesela.', priority: 'HIGH' },
  { timing: (d: Date) => subMonths(d, 11), category: 'Usługodawcy', title: 'Zarezerwuj salę weselną', notes: 'Najlepsze miejsca są rezerwowane z dużym wyprzedzeniem. To priorytet.', description: 'Najlepsze miejsca są rezerwowane z dużym wyprzedzeniem. To priorytet.', priority: 'HIGH' },
  { timing: (d: Date) => subMonths(d, 10), category: 'Usługodawcy', title: 'Zatrudnij fotografa i kamerzystę', notes: 'Przejrzyj portfolio i wybierz styl, który Wam odpowiada.', description: 'Przejrzyj portfolio i wybierz styl, który Wam odpowiada.', priority: 'HIGH' },
  { timing: (d: Date) => subMonths(d, 10), category: 'Usługodawcy', title: 'Wybierz i zarezerwuj zespół lub DJ-a', notes: 'Muzyka to klucz do udanej zabawy.', description: 'Muzyka to klucz do udanej zabawy.', priority: 'MEDIUM' },

  // 8-10 Months Out
  { timing: (d: Date) => subMonths(d, 8), category: 'Ubiór', title: 'Wybierz i zamów suknię ślubną', notes: 'Suknie często wymagają wielu miesięcy na uszycie i dopasowanie.', description: 'Suknie często wymagają wielu miesięcy na uszycie i dopasowanie.', priority: 'HIGH' },
  { timing: (d: Date) => subMonths(d, 8), category: 'Usługodawcy', title: 'Zarezerwuj firmę cateringową (jeśli sala nie zapewnia)', notes: 'Ustal menu i umów się na degustację.', description: 'Ustal menu i umów się na degustację.', priority: 'MEDIUM' },
  { timing: (d: Date) => subMonths(d, 7), category: 'Goście', title: 'Wyślij "Save the Dates"', notes: 'Szczególnie ważne, jeśli goście muszą podróżować.', description: 'Szczególnie ważne, jeśli goście muszą podróżować.', priority: 'MEDIUM' },

  // 6-8 Months Out
  { timing: (d: Date) => subMonths(d, 6), category: 'Dekoracje', title: 'Wybierz florystę i motyw przewodni dekoracji', notes: 'Kwiaty, dekoracje stołów, oświetlenie.', description: 'Kwiaty, dekoracje stołów, oświetlenie.', priority: 'MEDIUM' },
  { timing: (d: Date) => subMonths(d, 6), category: 'Ubiór', title: 'Wybierz strój dla Pana Młodego', notes: 'Garnitur, smoking czy coś bardziej niestandardowego?', description: 'Garnitur, smoking czy coś bardziej niestandardowego?', priority: 'MEDIUM' },
  { timing: (d: Date) => subMonths(d, 5), category: 'Planowanie', title: 'Zarezerwuj transport dla Pary Młodej i gości', notes: 'Samochód, autokar, etc.', description: 'Samochód, autokar, etc.', priority: 'LOW' },

  // 4-6 Months Out
  { timing: (d: Date) => subMonths(d, 4), category: 'Papeteria', title: 'Zamów zaproszenia ślubne', notes: 'Wybierz projekt zgodny z motywem przewodnim.', description: 'Wybierz projekt zgodny z motywem przewodnim.', priority: 'MEDIUM' },
  { timing: (d: Date) => subMonths(d, 4), category: 'Słodkości', title: 'Zamów tort weselny i ciasta', notes: 'Umów się na degustację smaków.', description: 'Umów się na degustację smaków.', priority: 'LOW' },
  { timing: (d: Date) => subMonths(d, 3), category: 'Formalności', title: 'Zbierz dokumenty potrzebne do ślubu cywilnego/kościelnego', notes: 'Sprawdź wymagania w urzędzie lub parafii.', description: 'Sprawdź wymagania w urzędzie lub parafii.', priority: 'HIGH' },

  // 2-3 Months Out
  { timing: (d: Date) => subWeeks(d, 10), category: 'Goście', title: 'Wyślij zaproszenia ślubne', notes: 'Optymalny czas to 8-10 tygodni przed ślubem.', description: 'Optymalny czas to 8-10 tygodni przed ślubem.', priority: 'MEDIUM' },
  { timing: (d: Date) => subMonths(d, 2), category: 'Ubiór', title: 'Kup obrączki ślubne', notes: 'To symbol Waszej miłości - wybierzcie je razem.', description: 'To symbol Waszej miłości - wybierzcie je razem.', priority: 'MEDIUM' },
  { timing: (d: Date) => subMonths(d, 2), category: 'Planowanie', title: 'Ustal szczegóły ceremonii', notes: 'Przebieg, czytania, muzyka w kościele/urzędzie.', description: 'Przebieg, czytania, muzyka w kościele/urzędzie.', priority: 'MEDIUM' },

  // 1 Month Out
  { timing: (d: Date) => subWeeks(d, 4), category: 'Formalności', title: 'Uzyskaj licencję na ślub (jeśli wymagana)', notes: 'Sprawdź ważność dokumentów.', description: 'Sprawdź ważność dokumentów.', priority: 'HIGH' },
  { timing: (d: Date) => subWeeks(d, 4), category: 'Goście', title: 'Ostatecznie potwierdź listę gości', notes: 'Skontaktuj się z osobami, które nie odpowiedziały.', description: 'Skontaktuj się z osobami, które nie odpowiedziały.', priority: 'MEDIUM' },
  { timing: (d: Date) => subWeeks(d, 3), category: 'Ubiór', title: 'Ostatnia przymiarka sukni ślubnej', notes: 'Zabierz ze sobą buty i bieliznę, które będziesz miała na ślubie.', description: 'Zabierz ze sobą buty i bieliznę, które będziesz miała na ślubie.', priority: 'MEDIUM' },
  { timing: (d: Date) => subWeeks(d, 2), category: 'Planowanie', title: 'Stwórz plan usadzenia gości przy stołach', notes: 'Użyj narzędzia do planowania stołów w aplikacji.', description: 'Użyj narzędzia do planowania stołów w aplikacji.', priority: 'LOW' },

  // 1-2 Weeks Out
  { timing: (d: Date) => subDays(d, 10), category: 'Usługodawcy', title: 'Potwierdź ostateczne szczegóły z wszystkimi usługodawcami', notes: 'Godziny, adresy, płatności.', description: 'Godziny, adresy, płatności.', priority: 'HIGH' },
  { timing: (d: Date) => subDays(d, 7), category: 'Uroda', title: 'Zrób próbną fryzurę i makijaż', notes: 'Upewnij się, że efekt jest zgodny z Twoimi oczekiwaniami.', description: 'Upewnij się, że efekt jest zgodny z Twoimi oczekiwaniami.', priority: 'LOW' },
  { timing: (d: Date) => subDays(d, 3), category: 'Planowanie', title: 'Przygotuj "zestaw ratunkowy" na dzień ślubu', notes: 'Igła z nitką, tabletki przeciwbólowe, plastry, etc.', description: 'Igła z nitką, tabletki przeciwbólowe, plastry, etc.', priority: 'LOW' },

  // The Day Before
  { timing: (d: Date) => subDays(d, 1), category: 'Relaks', title: 'Zrelaksuj się!', notes: 'Manicure, pedicure, masaż. Zadbaj o siebie i odpocznij.', description: 'Manicure, pedicure, masaż. Zadbaj o siebie i odpocznij.', priority: 'LOW' },
  { timing: (d: Date) => subDays(d, 1), category: 'Planowanie', title: 'Przekaż obrączki świadkom', notes: 'Aby o nich nie zapomnieć w dniu ślubu.', description: 'Aby o nich nie zapomnieć w dniu ślubu.', priority: 'HIGH' },
];

/**
 * Generates a wedding task timeline based on the ceremony date.
 * @param ceremonyDate The date of the wedding ceremony.
 * @returns An array of task objects with calculated due dates.
 */
export function generateWeddingTasks(ceremonyDate: Date): GeneratedTask[] {
  if (!(ceremonyDate instanceof Date) || isNaN(ceremonyDate.getTime())) {
    throw new Error("Invalid ceremony date provided.");
  }

  const tasks = taskModel.map(task => ({
    title: task.title,
    dueDate: task.timing(ceremonyDate),
    category: task.category,
    notes: task.notes,
    description: task.description,
    priority: ensurePriority(task.priority),
  }));

  // Sort by due date
  return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
