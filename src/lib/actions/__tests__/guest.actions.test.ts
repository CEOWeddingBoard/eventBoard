/**
 * @jest-environment node
 */
import { prisma } from "@/lib/prisma"
import { createGuest, updateGuest, deleteGuest, updateGuestTable } from "../guest.actions"
import { GuestRsvpStatus } from "@prisma/client"

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    guest: {
      findUnique: jest.fn(async () => null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    venueReservation: { findFirst: jest.fn(async () => null) },
    venueClientGuest: { delete: jest.fn() },
  },
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe("Guest Server Actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const eventId = "test-event-id";
  const guestData = {
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    status: "PENDING" as GuestRsvpStatus,
    eventId,
  };

  it("should create a new guest", async () => {
    const mockGuest = {
      id: "clx1234567890",
      ...guestData,
      isAttending: null,
      foodPreference: null,
      allergies: null,
      needsAccommodation: false,
      needsTransport: false,
      group: null,
      relation: null,
      tags: [],
      notes: null,
      householdId: 'hh-1',
      tableId: null,
    };
    (prisma.guest.create as jest.Mock).mockResolvedValue(mockGuest);

    const result = await createGuest(guestData);

    expect(prisma.guest.create).toHaveBeenCalledWith({ data: guestData });
    expect(result).toEqual(mockGuest);
  });

  it("should update an existing guest", async () => {
    const guestId = "clx1234567890";
    const updatedData = { ...guestData, firstName: "Jane" };
    const mockUpdatedGuest = {
      id: guestId,
      ...updatedData,
      isAttending: null,
      foodPreference: null,
      allergies: null,
      needsAccommodation: false,
      needsTransport: false,
      group: null,
      relation: null,
      tags: [],
      notes: null,
      householdId: 'hh-1',
      tableId: null,
    };
    (prisma.guest.update as jest.Mock).mockResolvedValue(mockUpdatedGuest);

    const result = await updateGuest(guestId, updatedData);

    expect(prisma.guest.update).toHaveBeenCalledWith({
      where: { id: guestId },
      data: updatedData,
    });
    expect(result).toEqual(mockUpdatedGuest);
  });

  it("should delete a guest", async () => {
    const guestId = "clx1234567890";
    (prisma.guest.delete as jest.Mock).mockResolvedValue({});

    await deleteGuest(guestId);

    expect(prisma.guest.delete).toHaveBeenCalledWith({ where: { id: guestId } });
  });

  it("should update a guest's table", async () => {
    const guestId = "clx1234567890";
    const tableId = "table-1";
    (prisma.guest.update as jest.Mock).mockResolvedValue({});

    await updateGuestTable(guestId, tableId);

    expect(prisma.guest.update).toHaveBeenCalledWith({
      where: { id: guestId },
      data: { tableId: tableId },
    });
  });

  it("should set tableId to null when un-assigning a guest", async () => {
    const guestId = "clx1234567890";
    (prisma.guest.update as jest.Mock).mockResolvedValue({});

    await updateGuestTable(guestId, null);

    expect(prisma.guest.update).toHaveBeenCalledWith({
      where: { id: guestId },
      data: { tableId: null },
    });
  });
});
