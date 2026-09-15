/**
 * Kto — spoza systemu — może zamknąć dany krok procesu.
 *
 * Do tej pory event miał jeden link i jedną rolę zewnętrzną: klienta.
 * Przy jednym przyjęciu decyzje podejmuje jednak więcej osób bez konta:
 * zamawiający wybiera menu, wedding planner prowadzący przyjęcie w imieniu
 * klienta zatwierdza harmonogram, podwykonawca potwierdza swoją część.
 *
 * Każdy z nich dostaje własny link i widzi wyłącznie kroki swojej roli.
 * Bez tego rozdziału planner zamykałby kroki zamawiającego i odwrotnie —
 * a token jest tu jedynym dowodem tożsamości, więc rola linku musi być
 * sprawdzana po stronie serwera przy każdym zapisie.
 */

/** Rola kroku, z rozbiciem na to, co ustawił autor procesu. */
export type StepRoles = {
  fillRole?: string | null;
  assigneeRole?: string | null;
};

/** Rola „Klient + Manager” — krok, który może domknąć obie strony. */
const KLIENT_I_MANAGER = "BOTH";

/** Rola, którą krok realnie wymaga: „kto wypełnia” wygrywa nad „wykonuje”. */
export function wymaganaRolaKroku(step: StepRoles): string {
  return (step.fillRole || step.assigneeRole || "").trim();
}

/**
 * Czy posiadacz linku w roli `rolaLinku` może zamknąć ten krok.
 *
 * Krok bez wskazanej roli jest wewnętrzny — nikt z zewnątrz go nie domyka,
 * bo brak konfiguracji nie może oznaczać dostępu dla każdego, kto ma link.
 */
export function czyLinkMozeZamknacKrok(rolaLinku: string, step: StepRoles): boolean {
  const rola = (rolaLinku || "").trim();
  if (!rola) return false;

  const wymagana = wymaganaRolaKroku(step);
  if (!wymagana) return false;

  if (wymagana === rola) return true;

  // „Klient + Manager” dotyczy wyłącznie klienta — planner ani podwykonawca
  // nie wchodzą w ten krok tylko dlatego, że jest oznaczony jako wspólny.
  if (wymagana === KLIENT_I_MANAGER && rola === "CLIENT") return true;

  return false;
}

/** Czy link nadaje się jeszcze do użycia. */
export function czyLinkAktywny(
  link: { expiresAt: Date | string; revokedAt?: Date | string | null },
  teraz: Date = new Date(),
): boolean {
  if (link.revokedAt) return false;
  const wygasa = link.expiresAt instanceof Date ? link.expiresAt : new Date(link.expiresAt);
  return wygasa.getTime() > teraz.getTime();
}

/**
 * Kroki, które posiadacz linku ma zobaczyć w portalu.
 *
 * Portal pokazuje tylko własne kroki roli — lista wszystkich kroków zdradzałaby
 * osobie z zewnątrz, jak obiekt prowadzi przyjęcie i kto co zatwierdza.
 */
export function krokiDlaRoli<T extends StepRoles>(rolaLinku: string, kroki: T[]): T[] {
  return kroki.filter((k) => czyLinkMozeZamknacKrok(rolaLinku, k));
}
