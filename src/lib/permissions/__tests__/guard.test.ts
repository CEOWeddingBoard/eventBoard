/**
 * Egzekwowanie poziomów uprawnień: brak / podgląd / edycja.
 *
 * Ukrycie przycisku w interfejsie nic nie chroni — akcję serwerową można wywołać
 * bezpośrednio. Te testy pilnują, że „Podgląd" naprawdę nie zapisze.
 */

const access: Record<string, string> = {};

jest.mock("@/lib/actions/team.actions", () => ({
  getMyModuleAccess: jest.fn(async () => access),
}));

import { assertModuleEdit, canEditModule, ModulePermissionError } from "@/lib/permissions/guard";
import { effectiveModuleAccess } from "@/lib/permissions/modules";

function setAccess(next: Record<string, string>) {
  for (const k of Object.keys(access)) delete access[k];
  Object.assign(access, next);
}

describe("assertModuleEdit", () => {
  it("przepuszcza poziom edycji", async () => {
    setAccess({ finances: "edit" });
    await expect(assertModuleEdit("finances")).resolves.toBeUndefined();
    await expect(canEditModule("finances")).resolves.toBe(true);
  });

  it("blokuje poziom podglądu", async () => {
    setAccess({ finances: "view" });
    await expect(assertModuleEdit("finances")).rejects.toThrow(ModulePermissionError);
    await expect(canEditModule("finances")).resolves.toBe(false);
  });

  it("blokuje brak dostępu", async () => {
    setAccess({ finances: "none" });
    await expect(assertModuleEdit("finances")).rejects.toThrow(ModulePermissionError);
  });

  it("blokuje moduł, którego nie ma w macierzy", async () => {
    setAccess({});
    await expect(assertModuleEdit("finances")).rejects.toThrow(ModulePermissionError);
  });
});

describe("effectiveModuleAccess", () => {
  const perms = {
    kuchnia: { events: "view" as const, finances: "none" as const },
    manager: { events: "edit" as const },
  };

  it("bierze maksimum z ról członka", () => {
    const a = effectiveModuleAccess(["kuchnia", "manager"], false, perms);
    expect(a.events).toBe("edit");
  });

  it("bez ról nie daje nic poza modułami zawsze dostępnymi", () => {
    const a = effectiveModuleAccess([], false, perms);
    expect(a.events).toBe("none");
    expect(a.finances).toBe("none");
    // Pulpit ma flagę `always` — inaczej po zalogowaniu nie ma gdzie wejść.
    expect(a.dashboard).toBe("view");
  });

  it("owner / admin / serwis mają edycję wszędzie", () => {
    const a = effectiveModuleAccess([], true, perms);
    expect(a.events).toBe("edit");
    expect(a.finances).toBe("edit");
    expect(a.settings).toBe("edit");
  });
});
