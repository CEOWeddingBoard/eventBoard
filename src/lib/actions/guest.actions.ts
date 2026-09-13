"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createGuestSchema, updateGuestSchema, type GuestInput, type GuestUpdateInput } from "@/lib/validations/guest"
import { validate } from "@/lib/validations/validation-utils"
import { sanitizeStrings } from "@/lib/validations/sanitize"

// Validate input before creating guest
function validateGuestInput(data: GuestInput) {
  return validate(createGuestSchema, data, { action: "create_guest" })
}

export async function createGuest(data: GuestInput) {
  const validatedData = validateGuestInput(data)
  const sanitizedData = sanitizeStrings(validatedData)
  const newGuest = await prisma.guest.create({ data: sanitizedData })
  revalidatePath("/pl/guests")
  revalidatePath("/en/guests")
  revalidatePath("/pl/seating")
  revalidatePath("/en/seating")
  return newGuest
}

export async function updateGuest(id: string, data: GuestUpdateInput) {
  const validatedData = validate(updateGuestSchema, { ...data, id }, { action: "update_guest" })

  // Remove id from data before updating
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _unused, ...updateData } = validatedData

  const updatedGuest = await prisma.guest.update({
    where: { id },
    data: sanitizeStrings(updateData)
  })
  revalidatePath("/pl/guests")
  revalidatePath("/en/guests")
  revalidatePath("/pl/seating")
  revalidatePath("/en/seating")
  return updatedGuest
}

export async function deleteGuest(id: string) {
  const guest = await prisma.guest.findUnique({
    where: { id },
    select: { venueClientGuestId: true, eventId: true },
  });
  if (guest?.venueClientGuestId) {
    const reservation = guest.eventId
      ? await prisma.venueReservation.findFirst({
          where: { eventId: guest.eventId },
        })
      : null;
    if (reservation && !reservation.guestsCompleted) {
      await prisma.venueClientGuest
        .delete({ where: { id: guest.venueClientGuestId } })
        .catch(() => undefined);
    }
  }
  await prisma.guest.delete({ where: { id } })
  revalidatePath("/pl/guests")
  revalidatePath("/en/guests")
  revalidatePath("/pl/seating")
  revalidatePath("/en/seating")
}

export async function updateGuestTable(guestId: string, tableId: string | null) {
  // "unassigned" is a virtual table in the UI, so it maps to null in the DB
  const newTableId = tableId === "unassigned" ? null : tableId;

  await prisma.guest.update({
    where: { id: guestId },
    data: { tableId: newTableId },
  })
  revalidatePath("/pl/seating")
  revalidatePath("/en/seating")
}
