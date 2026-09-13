/**
 * Uprawnienia modułowe per rola operacyjna.
 *
 * Poziomy: "none" (nie widzi), "view" (widzi, nie zmienia), "edit" (pełne).
 * Efektywny poziom członka = maksimum z jego ról; owner/admin/serwis mają
 * wszędzie "edit". Konfiguracja przechowywana w Organization.modulePermissionsJson
 * jako { [roleValue]: { [moduleKey]: level } }.
 */

export type PermLevel = "none" | "view" | "edit";

export type AppModule = {
  key: string;
  label: string;
  /** Moduł zawsze dostępny (min. podgląd) — inaczej po logowaniu nie ma gdzie wejść. */
  always?: boolean;
};

export const APP_MODULES: AppModule[] = [
  { key: "dashboard", label: "Pulpit", always: true },
  { key: "calendar", label: "Kalendarz" },
  { key: "events", label: "Eventy" },
  { key: "leads", label: "Zapytania" },
  { key: "finances", label: "Finanse" },
  { key: "team", label: "Zespół" },
  { key: "configuration", label: "Konfiguracja" },
  { key: "settings", label: "Ustawienia" },
];

export const PERM_LEVELS: { value: PermLevel; label: string }[] = [
  { value: "none", label: "Brak" },
  { value: "view", label: "Podgląd" },
  { value: "edit", label: "Edycja" },
];

const RANK: Record<PermLevel, number> = { none: 0, view: 1, edit: 2 };

export type ModulePermissions = Record<string, Record<string, PermLevel>>;

export function parseModulePermissions(json: string | null | undefined): ModulePermissions {
  if (!json) return {};
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return {};
    const out: ModulePermissions = {};
    for (const [role, mods] of Object.entries(obj)) {
      if (!mods || typeof mods !== "object") continue;
      const clean: Record<string, PermLevel> = {};
      for (const [mod, lvl] of Object.entries(mods as Record<string, unknown>)) {
        if (lvl === "none" || lvl === "view" || lvl === "edit") clean[mod] = lvl;
      }
      out[role] = clean;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Efektywny poziom dostępu członka do każdego modułu.
 * @param roles role operacyjne członka (rolesJson)
 * @param privileged owner / admin org / serwis — pełny dostęp
 * @param perms macierz z Organization.modulePermissionsJson
 */
export function effectiveModuleAccess(
  roles: string[],
  privileged: boolean,
  perms: ModulePermissions,
): Record<string, PermLevel> {
  const out: Record<string, PermLevel> = {};
  for (const m of APP_MODULES) {
    if (privileged) {
      out[m.key] = "edit";
      continue;
    }
    let best: PermLevel = "none";
    for (const r of roles) {
      const lvl = perms[r]?.[m.key];
      if (lvl && RANK[lvl] > RANK[best]) best = lvl;
    }
    if (m.always && RANK[best] < RANK.view) best = "view";
    out[m.key] = best;
  }
  return out;
}

export function canView(level: PermLevel | undefined): boolean {
  return level === "view" || level === "edit";
}
export function canEdit(level: PermLevel | undefined): boolean {
  return level === "edit";
}
