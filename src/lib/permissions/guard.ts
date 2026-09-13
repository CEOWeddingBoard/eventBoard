import { redirect } from "next/navigation";
import { getMyModuleAccess } from "@/lib/actions/team.actions";
import { canView, canEdit, type PermLevel } from "@/lib/permissions/modules";

/** Blokuje wejście do modułu, gdy brak podglądu — przekierowuje na pulpit. */
export async function assertModuleView(moduleKey: string, locale: string): Promise<Record<string, PermLevel>> {
  const access = await getMyModuleAccess();
  if (!canView(access[moduleKey])) {
    redirect(`/${locale}/app/dashboard`);
  }
  return access;
}

/** Czy bieżący użytkownik może edytować dany moduł (do ukrywania akcji zapisu). */
export async function canEditModule(moduleKey: string): Promise<boolean> {
  const access = await getMyModuleAccess();
  return canEdit(access[moduleKey]);
}

/** Brak uprawnienia do zapisu — akcja serwerowa przerywa się z tym błędem. */
export class ModulePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModulePermissionError";
  }
}

/**
 * Bramka zapisu dla akcji serwerowych.
 *
 * Ukrycie przycisku w interfejsie nic nie chroni — akcję serwerową można wywołać
 * bezpośrednio. Poziom „Podgląd" musi być egzekwowany tutaj, po stronie serwera.
 */
export async function assertModuleEdit(moduleKey: string): Promise<void> {
  const access = await getMyModuleAccess();
  if (!canEdit(access[moduleKey])) {
    throw new ModulePermissionError("Nie masz uprawnień do zapisu w tym module.");
  }
}
