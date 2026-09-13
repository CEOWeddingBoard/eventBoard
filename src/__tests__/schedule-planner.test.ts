import { planSchedule, parseInstructions } from "@/lib/ai/schedule-planner";

const wesele = {
  name: "Wesele Ani i Tomka",
  date: new Date("2026-08-22T00:00:00"),
  eventType: "WEDDING",
  estimatedGuestCount: 120,
  receptionLocationName: "Sala Główna",
};

const menu = [
  {
    label: "Menu A",
    courses: [
      { name: "Rosół z domowym makaronem", courseType: "Zupa" },
      { name: "Polędwiczki w sosie grzybowym", courseType: "Danie główne" },
      { name: "Tarta cytrynowa", courseType: "Deser" },
    ],
  },
];

const godzina = (iso: string) => iso.slice(11, 16);
const punkt = (items: ReturnType<typeof planSchedule>, tytul: string) =>
  items.find((i) => i.title.toLowerCase().includes(tytul.toLowerCase()))!;

describe("parseInstructions", () => {
  it("wiąże godzinę z punktem, którego dotyczy zdanie", () => {
    expect(parseInstructions("ceremonia o 15:00, tort o 20:30")).toEqual({
      ceremonia: 15 * 60,
      tort: 20 * 60 + 30,
    });
  });

  it("przyjmuje godzinę bez minut", () => {
    expect(parseInstructions("obiad o 17")).toEqual({ obiad: 17 * 60 });
  });

  it("pomija fragmenty bez godziny i bez rozpoznanego punktu", () => {
    expect(parseInstructions("prosimy o kwiaty na stołach")).toEqual({});
    expect(parseInstructions("coś o 12:00")).toEqual({});
  });

  it("odrzuca niepoprawne godziny", () => {
    expect(parseInstructions("ceremonia o 99:99")).toEqual({});
  });
});

describe("planSchedule", () => {
  it("przesuwa cały plan względem podanej kotwicy", () => {
    const domyslny = planSchedule(wesele, menu);
    const przesuniety = planSchedule(wesele, menu, "ceremonia o 17:00");

    expect(godzina(punkt(domyslny, "Ceremonia").startTime)).toBe("15:00");
    expect(godzina(punkt(przesuniety, "Ceremonia").startTime)).toBe("17:00");

    // Punkt zależny jedzie razem z kotwicą, zachowując odstęp.
    const powitanieDomyslne = punkt(domyslny, "Powitanie").startTime;
    const powitaniePrzesuniete = punkt(przesuniety, "Powitanie").startTime;
    expect(godzina(powitanieDomyslne)).toBe("16:15");
    expect(godzina(powitaniePrzesuniete)).toBe("18:15");
  });

  it("honoruje kilka kotwic naraz", () => {
    const plan = planSchedule(wesele, menu, "ceremonia o 16:30, tort o 21:00");
    expect(godzina(punkt(plan, "Ceremonia").startTime)).toBe("16:30");
    expect(godzina(punkt(plan, "Tort").startTime)).toBe("21:00");
  });

  it("dobiera inny szkielet dla każdego typu wydarzenia", () => {
    const komunia = planSchedule({ ...wesele, eventType: "COMMUNION" }, []);
    const firmowe = planSchedule({ ...wesele, eventType: "CORPORATE" }, []);

    expect(komunia.map((i) => i.title)).toContain("Tort i słodki stół");
    expect(komunia.map((i) => i.title)).not.toContain("Zabawa taneczna");
    expect(firmowe.map((i) => i.title)).toContain("Część oficjalna");
  });

  it("wpisuje dania z menu w opis właściwego serwisu", () => {
    const plan = planSchedule(wesele, menu);
    expect(punkt(plan, "Obiad").description).toContain("Rosół z domowym makaronem");
    expect(punkt(plan, "Danie główne").description).toContain("Polędwiczki");
    expect(punkt(plan, "Tort").description).toContain("Tarta cytrynowa");
  });

  it("wydłuża serwis przy większej liczbie gości", () => {
    const dlugosc = (goscie: number) => {
      const obiad = punkt(planSchedule({ ...wesele, estimatedGuestCount: goscie }, []), "Obiad");
      return Date.parse(obiad.endTime) - Date.parse(obiad.startTime);
    };
    expect(dlugosc(200)).toBeGreaterThan(dlugosc(40));
  });

  it("nie zostawia punktów bez godziny ani miejsca", () => {
    for (const item of planSchedule(wesele, menu, "ceremonia o 15:00")) {
      expect(item.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(item.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(Date.parse(item.endTime)).toBeGreaterThan(Date.parse(item.startTime));
      expect(item.location).toBe("Sala Główna");
    }
  });
});
