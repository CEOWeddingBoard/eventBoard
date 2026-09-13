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
