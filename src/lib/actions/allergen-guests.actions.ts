"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";

interface AllergenGuestInput {
  id: string;
  name: string;
  vege: boolean;
  gluten: boolean;
  bezgluten: boolean;
  otherAllergies: string;
  notes: string;
}

export async function saveAllergenGuests(eventId: string, guests: AllergenGuestInput[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || (event.userId !== user.id)) throw new Error("Forbidden");

  await prisma.$transaction(async (tx) => {
    await tx.guest.deleteMany({ where: { eventId } });

    if (guests.length === 0) return;

    const guestsToCreate = guests
      .filter((g) => g.name || g.vege || g.gluten || g.bezgluten || g.otherAllergies)
      .map((g) => ({
        eventId,
        name: g.name.trim() || "Gość",
        allergies: [
          g.otherAllergies?.trim(),
          ...(g.vege ? ["vege"] : []),
          ...(g.gluten ? ["gluten"] : []),
          ...(g.bezgluten ? ["bezgluten"] : []),
        ]
          .filter(Boolean)
          .join(", "),
        foodPreference: [
          g.vege && "vege",
          g.gluten && "gluten",
          g.bezgluten && "bezgluten",
        ]
          .filter(Boolean)
          .join(", "),
        notes: g.notes?.trim() || null,
      }));

    await tx.guest.createMany({ data: guestsToCreate });
  });

  revalidatePath("/pl/dashboard/guests");
  revalidatePath("/en/dashboard/guests");
  return { success: true };
}

export async function getAllergenGuests(eventId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const guests = await prisma.guest.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
  });

  return guests.map((g) => {
    const allergiesList = g.allergies?.split(", ").map((s) => s.trim()) ?? [];
    const foodPrefs = g.foodPreference?.split(", ").map((s) => s.trim()) ?? [];

    return {
      id: g.id,
      name: g.name === "Gość" ? "" : g.name,
      vege: foodPrefs.includes("vege") || allergiesList.includes("vege"),
      gluten: foodPrefs.includes("gluten") || allergiesList.includes("gluten"),
      bezgluten: foodPrefs.includes("bezgluten") || allergiesList.includes("bezgluten"),
      otherAllergies: allergiesList.filter(
        (a) => !["vege", "gluten", "bezgluten", ""].includes(a)
      ).join(", "),
      notes: g.notes ?? "",
    };
  });
}
