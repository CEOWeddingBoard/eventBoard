/**
 * @jest-environment node
 */
import { buildGuestPortalViewModel } from "../guest-portal";

describe("buildGuestPortalViewModel", () => {
  const baseEvent = {
    name: "Wesele Ani i Piotra",
    date: new Date("2026-08-15T15:00:00Z"),
    brideName: "Anna",
    groomName: "Piotr",
    dressCode: "Elegancko, w odcieniach zieleni i złota",
    description: "Ślub i wesele w klimacie rustykalnym.",
  } as any;

  const schedule = [
    {
      id: "1",
      eventId: "e1",
      startTime: new Date("2026-08-15T13:30:00Z"),
      endTime: new Date("2026-08-15T14:30:00Z"),
      title: "Ceremonia ślubna",
      description: "Kościół św. Anny",
      location: "Kościół św. Anny",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      eventId: "e1",
      startTime: new Date("2026-08-15T16:00:00Z"),
      endTime: null,
      title: "Przyjęcie weselne",
      description: null,
      location: "Sala Magnolia",
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as any;

  it("builds a view model with title, subtitle and formatted date", () => {
    const vm = buildGuestPortalViewModel(baseEvent, schedule, "pl");

    expect(vm.title).toBe("Wesele Ani i Piotra");
    expect(vm.subtitle).toBe("Anna & Piotr");
    expect(vm.dateLine).toContain("2026");
    expect(vm.schedule).toHaveLength(2);
    expect(vm.schedule[0].timeRange).toContain(":");
  });

  it("falls back to generic title when name is empty", () => {
    const event = { ...baseEvent, name: "" };
    const vm = buildGuestPortalViewModel(event as any, [], "pl");

    expect(vm.title).toBe("Anna & Piotr");
    expect(vm.subtitle).toBeNull();
  });

  it("handles missing bride and groom names", () => {
    const event = { ...baseEvent, brideName: null, groomName: null };
    const vm = buildGuestPortalViewModel(event as any, [], "pl");

    expect(vm.title).toBe("Wesele Ani i Piotra");
    expect(vm.subtitle).toBeNull();
  });
});

