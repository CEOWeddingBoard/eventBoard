"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { TERMS_VERSION } from "@/lib/legal";

/** Czy bieżący użytkownik zaakceptował aktualną wersję regulaminu. */
export async function hasAcceptedCurrentTerms(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return true; // niezalogowany — brama logowania zadziała wcześniej
  try {
    const db = await prisma.user.findUnique({
      where: { id: user.id },
      select: { acceptedTermsVersion: true },
    });
    return (db as { acceptedTermsVersion?: string | null } | null)?.acceptedTermsVersion === TERMS_VERSION;
  } catch {
    // Gdy kolumna jeszcze nie istnieje (przed migracją) — nie blokuj.
    return true;
  }
}

/** Zapis akceptacji aktualnej wersji regulaminu przez bieżącego użytkownika. */
export async function acceptTerms(): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Musisz być zalogowany." };
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { acceptedTermsVersion: TERMS_VERSION, acceptedTermsAt: new Date() },
    });
    return { ok: true };
  } catch (e) {
    console.error("[legal:acceptTerms]", e);
    return { ok: false, error: "Nie udało się zapisać akceptacji." };
  }
}
