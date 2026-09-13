import { prisma } from "@/lib/prisma";

/**
 * Stałe konto demo dla MVP.
 *
 * „Wejdź kontem testowym” zakładało wcześniej nową, pustą organizację przy
 * każdym kliknięciu — pokaz zaczynał się od pustego kalendarza, a na
 * środowisku zbierały się dziesiątki porzuconych organizacji. Teraz przycisk
 * wchodzi zawsze w tę samą organizację, odtwarzaną do znanego stanu.
 *
 * Seed jest deterministyczny: te same nazwy, kwoty i godziny za każdym razem.
 * Daty liczone są względem dnia uruchomienia, żeby demo nigdy nie pokazywało
 * imprez z przeszłości.
 */

export const DEMO_EMAIL = "demo@eventboard.local";
export const DEMO_ORG_SLUG = "restauracja-pod-lipami";
export const DEMO_ORG_NAME = "Restauracja Pod Lipami";
export const DEMO_USER_NAME = "Konto demo";

/** Dzień przesunięty o podaną liczbę dni względem dziś, o zadanej godzinie. */
function day(offsetDays: number, hour = 0, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

const WORKFLOW_NODES = [
  { name: "Zapytanie przyjęte", nodeType: "ACTION", actionType: "NONE", assigneeRole: "MANAGER", isStart: true,
    description: "Rejestracja zapytania od pary i wstępna kwalifikacja terminu." },
  { name: "Oferta wysłana", nodeType: "ACTION", actionType: "DOCUMENT", assigneeRole: "MANAGER", isStart: false,
    description: "Przygotowanie i wysyłka oferty cenowej wraz z opisem sali." },
  { name: "Wybór menu przez parę", nodeType: "DECISION", actionType: "MENU_SELECTION", assigneeRole: "CLIENT", isStart: false,
    description: "Para wybiera wariant menu w portalu klienta. Wybór rozgałęzia proces.", menuMode: "WHOLE_VARIANT" },
  { name: "Akceptacja kuchni", nodeType: "ACTION", actionType: "APPROVAL", assigneeRole: "CHEF", isStart: false,
    description: "Szef kuchni potwierdza wykonalność menu dla podanej liczby gości." },
  { name: "Zadatek", nodeType: "ACTION", actionType: "PAYMENT", assigneeRole: "CLIENT", isStart: false,
    description: "Wpłata zadatku potwierdzająca rezerwację terminu." },
  { name: "Agenda zatwierdzona", nodeType: "END", actionType: "AGENDA", assigneeRole: "BOTH", isStart: false,
    description: "Domknięcie harmonogramu dnia i akceptacja przez obie strony." },
];

// Proces wigilijny — 13 kroków wg case study.
// Każdy krok ma: kto wypełnia (fill), kto akceptuje (approve) oraz pola (fields),
// których wartości po akceptacji lądują w agendzie. Pola-czasy oznaczone
// scheduleLine budują harmonogram Z PROCESU.
type WigNode = {
  n: string; t: string; a: string; r: string; menuMode?: string;
  fill?: string; approve?: string;
  fields?: {
    key: string; label: string;
    type: "text" | "textarea" | "time" | "date" | "number" | "select";
    targetAgendaKey: string; required?: boolean; scheduleLine?: boolean;
  }[];
  map?: { sourceKey: string; targetAgendaKey: string; transform?: string }[];
};
const WIGILIA_NODES: WigNode[] = [
  { n: "Wybór menu i liczba osób", t: "DECISION", a: "MENU_SELECTION", r: "CLIENT", menuMode: "WHOLE_VARIANT",
    fill: "CLIENT", approve: "MANAGER",
    map: [
      { sourceKey: "menuSummary", targetAgendaKey: "agenda.menu" },
      { sourceKey: "selectedDishes", targetAgendaKey: "agenda.menuSzczegoly", transform: "join_comma" },
    ] },
  { n: "Alergie i diety", t: "ACTION", a: "CLIENT_FORM", r: "CLIENT",
    fill: "CLIENT", approve: "CHEF",
    fields: [{ key: "alergeny", label: "Alergeny i diety gości", type: "textarea", targetAgendaKey: "agenda.uwagiKuchnia" }] },
  { n: "Napoje", t: "ACTION", a: "CLIENT_FORM", r: "CLIENT",
    fill: "CLIENT", approve: "WAITER",
    fields: [{ key: "napoje", label: "Wybrane napoje", type: "textarea", targetAgendaKey: "agenda.napoje" }] },
  { n: "Godzina rozpoczęcia", t: "ACTION", a: "CLIENT_FORM", r: "CLIENT",
    fill: "CLIENT", approve: "MANAGER",
    fields: [{ key: "godzinaStart", label: "Godzina rozpoczęcia kolacji", type: "time", targetAgendaKey: "agenda.godzinaStart", scheduleLine: true }] },
  { n: "Godzina zakończenia", t: "ACTION", a: "CLIENT_FORM", r: "CLIENT",
    fill: "CLIENT", approve: "MANAGER",
    fields: [{ key: "godzinaKoniec", label: "Godzina zakończenia", type: "time", targetAgendaKey: "agenda.godzinaKoniec", scheduleLine: true }] },
  { n: "Informacja o zaliczce", t: "ACTION", a: "SEND_MESSAGE", r: "MANAGER",
    fill: "MANAGER",
    fields: [{ key: "zaliczka", label: "Kwota i termin zaliczki", type: "text", targetAgendaKey: "agenda.platnosci" }] },
  { n: "Informacja o płatności", t: "ACTION", a: "PAYMENT", r: "MANAGER",
    fill: "MANAGER",
    fields: [{ key: "platnosc", label: "Status płatności końcowej", type: "text", targetAgendaKey: "agenda.platnosciStatus" }] },
  { n: "Akceptacja menu — kuchnia", t: "ACTION", a: "APPROVAL", r: "CHEF", fill: "CHEF", approve: "CHEF" },
  { n: "Akceptacja menu — kelner", t: "ACTION", a: "APPROVAL", r: "WAITER", fill: "WAITER", approve: "WAITER" },
  { n: "Akceptacja napojów — kelner", t: "ACTION", a: "APPROVAL", r: "WAITER", fill: "WAITER", approve: "WAITER" },
  { n: "Akceptacja napojów — barman", t: "ACTION", a: "APPROVAL", r: "BARTENDER", fill: "BARTENDER", approve: "BARTENDER" },
  { n: "Akceptacja płatności — manager", t: "ACTION", a: "APPROVAL", r: "MANAGER", fill: "MANAGER", approve: "MANAGER",
    map: [{ sourceKey: "approvedBy", targetAgendaKey: "agenda.platnosciStatus" }] },
  { n: "Akceptacja harmonogramu", t: "END", a: "AGENDA", r: "BOTH", fill: "MANAGER", approve: "BOTH",
    fields: [{ key: "uwagiFinalne", label: "Uwagi końcowe do agendy", type: "textarea", targetAgendaKey: "agenda.uwagiFinalne" }] },
];

const MENU_WIG_A = [
  { name: "Barszcz czerwony z uszkami", courseType: "SOUP", priceBase: 20 },
  { name: "Karp smażony", courseType: "MAIN", priceBase: 58 },
  { name: "Kutia", courseType: "DESSERT", priceBase: 18 },
];
const MENU_WIG_B = [
  { name: "Zupa grzybowa", courseType: "SOUP", priceBase: 20 },
  { name: "Pierogi z kapustą i grzybami", courseType: "MAIN", priceBase: 46 },
  { name: "Makowiec", courseType: "DESSERT", priceBase: 16 },
];

const HARMONOGRAM = [
  { h: 15, m: 0, title: "Ceremonia w plenerze", description: "Ogród różany, 120 krzeseł, nagłośnienie bezprzewodowe.", location: "Ogród" },
  { h: 16, m: 30, title: "Powitanie chlebem i solą", description: "Wejście pary, toast powitalny na tarasie.", location: "Taras" },
  { h: 17, m: 0, title: "Obiad — pierwsze danie", description: "Serwis kelnerski, 12 stołów po 10 osób.", location: "Sala Główna" },
  { h: 20, m: 0, title: "Tort i pierwszy taniec", description: "Wyciszenie muzyki, oświetlenie punktowe na parkiet.", location: "Sala Główna" },
  { h: 23, m: 30, title: "Poczęstunek nocny", description: "Bufet ciepły — żurek i bigos.", location: "Sala Główna" },
];

const MENU_A = [
  { name: "Rosół z domowym makaronem", courseType: "SOUP", priceBase: 18 },
  { name: "Polędwiczki w sosie grzybowym", courseType: "MAIN", priceBase: 62 },
  { name: "Tarta cytrynowa", courseType: "DESSERT", priceBase: 22 },
];

const MENU_B = [
  { name: "Krem z pieczonej dyni", courseType: "SOUP", priceBase: 16 },
  { name: "Risotto z borowikami", courseType: "MAIN", priceBase: 54 },
  { name: "Panna cotta malinowa", courseType: "DESSERT", priceBase: 20 },
];

const ZADANIA = [
  "Potwierdzić liczbę gości na 14 dni przed",
  "Zamówić kwiaty na stoły i łuk ceremonii",
  "Ustalić listę alergenów z kuchnią",
  "Przygotować plan stołów i winietki",
];

const LEADY = [
  { name: "Karolina Zawadzka", email: "karolina.z@example.com", phone: "601 202 303", offset: 280, guestCount: 100, status: "NEW",
    message: "Dzień dobry, szukamy sali na wesele w przyszłym roku. Czy termin jest wolny i jaka jest cena za osobę?" },
  { name: "Michał Ostrowski", email: "m.ostrowski@example.com", phone: "512 880 145", offset: 95, guestCount: 70, status: "CONTACTED",
    message: "Planujemy chrzciny połączone z obiadem rodzinnym. Proszę o ofertę wraz z menu bezglutenowym." },
  { name: "Biuro Hartman", email: "eventy@hartman.example", phone: "22 550 11 20", offset: 140, guestCount: 150, status: "WON",
    message: "Poszukujemy sali na bankiet noworoczny dla pracowników. Potrzebujemy sceny i nagłośnienia." },
];

/**
 * Odtwarza organizację demo do znanego stanu i zwraca użytkownika do zalogowania.
 * Bezpieczne do wielokrotnego wywołania — czyści wyłącznie dane tej organizacji.
 */
export async function seedDemoOrganization(): Promise<{ userId: string; organizationId: string }> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: DEMO_USER_NAME, isActive: true },
    create: { email: DEMO_EMAIL, password: "", name: DEMO_USER_NAME, role: "ADMIN", isActive: true },
  });

  const existing = await prisma.organization.findUnique({ where: { slug: DEMO_ORG_SLUG } });

  const org = existing
    ? await prisma.organization.update({ where: { id: existing.id }, data: { ownerId: user.id, ...profil() } })
    : await prisma.organization.create({ data: { name: DEMO_ORG_NAME, slug: DEMO_ORG_SLUG, ownerId: user.id, ...profil() } });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: { role: "OWNER" },
    create: { organizationId: org.id, userId: user.id, role: "OWNER" },
  });

  // Napełniamy demo TYLKO raz — gdy jest puste. To konto użytkownika:
  // kolejne logowania niczego nie kasują, więc praca zbudowana ręcznie
  // (procesy, eventy, menu) przetrwa każde wejście. Świeży zestaw
  // przywraca się osobno przez resetDemoOrganization().
  const [eventCount, workflowCount] = await Promise.all([
    prisma.event.count({ where: { organizationId: org.id } }),
    prisma.organizationWorkflow.count({ where: { organizationId: org.id } }),
  ]);
  if (eventCount === 0 && workflowCount === 0) {
    await populateDemo(org.id, user.id);
  } else {
    // Konto już wypełnione — nic nie kasujemy, ale nieinwazyjnie dosypujemy
    // brakujące role i pola do istniejących kroków Wigilii (dopasowanie po
    // nazwie, wyłącznie UPDATE), żeby stary proces zaczął zasilać agendę.
    await upgradeWigiliaProcess(org.id);
  }

  return { userId: user.id, organizationId: org.id };
}

/**
 * Uzupełnia istniejące węzły procesu „Obsługa wigilii" o fillRole/approveRole
 * i fieldsJson wg WIGILIA_NODES. Nie tworzy ani nie usuwa węzłów — tylko
 * aktualizuje kolumny na krokach dopasowanych po nazwie.
 */
async function upgradeWigiliaProcess(organizationId: string): Promise<void> {
  const workflow = await prisma.organizationWorkflow.findFirst({
    where: { organizationId, name: "Obsługa wigilii" },
    select: { id: true, nodes: { select: { id: true, name: true } } },
  });
  if (!workflow) return;

  const byName = new Map(WIGILIA_NODES.map((w) => [w.n, w]));
  for (const node of workflow.nodes) {
    const w = byName.get(node.name);
    if (!w) continue;
    await prisma.workflowNode.update({
      where: { id: node.id },
      data: {
        fillRole: w.fill ?? w.r,
        approveRole: w.approve ?? null,
        fieldsJson: JSON.stringify(w.fields ?? []),
        fieldMappingsJson: JSON.stringify(w.map ?? []),
        menuMode: w.menuMode ?? null,
      },
    });
  }
}

/** Wypełnia świeże (puste) demo kompletem przykładowych danych. */
async function populateDemo(organizationId: string, userId: string): Promise<void> {
  const kategorie = await stworzKategorie(organizationId);
  const sale = await stworzSale(organizationId);
  const workflowId = await stworzProces(organizationId);
  const wigiliaWorkflowId = await stworzProcesWigilia(organizationId);
  await stworzWydarzenia(organizationId, userId, kategorie, sale, workflowId, wigiliaWorkflowId);
  await stworzZapytania(organizationId);
  await stworzBlokady(organizationId);
}

/** Proces „Obsługa wigilii" — 13 kroków z mapowaniami do agendy (case study). */
async function stworzProcesWigilia(organizationId: string): Promise<string> {
  const workflow = await prisma.organizationWorkflow.create({
    data: {
      organizationId,
      name: "Obsługa wigilii",
      description: "Kolacja wigilijna: menu, napoje i godziny od klienta; akceptacje kuchni, obsługi i managera.",
      eventType: "CHRISTMAS_EVE",
      stagesJson: "[]",
    },
  });

  const utworzone = [];
  for (const [i, w] of WIGILIA_NODES.entries()) {
    utworzone.push(
      await prisma.workflowNode.create({
        data: {
          workflowId: workflow.id,
          name: w.n,
          nodeType: w.t,
          actionType: w.a,
          assigneeRole: w.r,
          sortOrder: i,
          isStart: i === 0,
          menuMode: w.menuMode ?? null,
          fillRole: w.fill ?? w.r,
          approveRole: w.approve ?? null,
          fieldsJson: JSON.stringify(w.fields ?? []),
          fieldMappingsJson: JSON.stringify(w.map ?? []),
          conditionsJson: "[]",
        },
      }),
    );
  }
  return workflow.id;
}

/**
 * Przywraca demo do świeżego stanu — kasuje bieżącą zawartość i sieje na nowo.
 * Wywoływane WYŁĄCZNIE świadomie (np. przyciskiem „Zresetuj demo"), nigdy
 * przy zwykłym logowaniu.
 */
export async function resetDemoOrganization(): Promise<void> {
  const org = await prisma.organization.findUnique({ where: { slug: DEMO_ORG_SLUG } });
  if (!org) return;
  const owner = await prisma.organizationMember.findFirst({
    where: { organizationId: org.id, role: "OWNER" },
    select: { userId: true },
  });
  await prisma.event.deleteMany({ where: { organizationId: org.id } });
  await prisma.organizationWorkflow.deleteMany({ where: { organizationId: org.id } });
  await prisma.orgLead.deleteMany({ where: { organizationId: org.id } });
  await prisma.orgBlockedDate.deleteMany({ where: { organizationId: org.id } });
  await prisma.eventCategory.deleteMany({ where: { organizationId: org.id } });
  await prisma.venue.deleteMany({ where: { organizationId: org.id } });
  if (owner) await populateDemo(org.id, owner.userId);
}

function profil() {
  return {
    address: "ul. Lipowa 14",
    city: "Konstancin-Jeziorna",
    postalCode: "05-510",
    phone: "600 120 340",
    email: "kontakt@podlipami.example",
    website: "https://podlipami.example",
    description:
      "Dworek z ogrodem i dwiema salami bankietowymi, 30 minut od centrum Warszawy. Przyjęcia weselne, komunie i wydarzenia firmowe.",
    capacity: 180,
    priceRange: "260–420 zł/os.",
  };
}

async function stworzKategorie(organizationId: string) {
  const dane = [
    { name: "Wesele", icon: "Heart", color: "#e11d48" },
    { name: "Komunia", icon: "Church", color: "#8b5cf6" },
    { name: "Firmowe", icon: "Briefcase", color: "#0ea5e9" },
    { name: "Wigilia", icon: "Sparkles", color: "#10b981" },
  ];
  const utworzone: Record<string, string> = {};
  for (const k of dane) {
    const c = await prisma.eventCategory.create({
      data: { organizationId, name: k.name, icon: k.icon, color: k.color, isSystem: true },
    });
    utworzone[k.name] = c.id;
  }
  return utworzone;
}

async function stworzSale(organizationId: string) {
  const venue = await prisma.venue.create({
    data: {
      organizationId,
      clerkOrgId: `demo-${organizationId}`,
      name: DEMO_ORG_NAME,
      slug: `${DEMO_ORG_SLUG}-obiekt`,
      city: "Konstancin-Jeziorna",
      capacity: 180,
    },
  });
  const glowna = await prisma.venueHall.create({
    data: { venueId: venue.id, name: "Sala Główna", capacity: 180 },
  });
  const kominkowa = await prisma.venueHall.create({
    data: { venueId: venue.id, name: "Sala Kominkowa", capacity: 60 },
  });
  return { glowna: glowna.id, kominkowa: kominkowa.id };
}

async function stworzProces(organizationId: string): Promise<string> {
  const workflow = await prisma.organizationWorkflow.create({
    data: {
      organizationId,
      name: "Obsługa wesela",
      description: "Pełna ścieżka od zapytania do zatwierdzonej agendy, z rozgałęzieniem na wybór menu.",
      eventType: "WEDDING",
      isDefault: true,
      stagesJson: "[]",
    },
  });

  const utworzone = [];
  for (const [i, n] of WORKFLOW_NODES.entries()) {
    utworzone.push(
      await prisma.workflowNode.create({
        data: {
          workflowId: workflow.id,
          name: n.name,
          description: n.description,
          nodeType: n.nodeType,
          actionType: n.actionType,
          assigneeRole: n.assigneeRole,
          sortOrder: i,
          isStart: n.isStart,
          menuMode: n.menuMode ?? null,
          fieldMappingsJson: "[]",
          conditionsJson: "[]",
        },
      }),
    );
  }

  // Rozgałęzienie: Menu B omija akceptację kuchni, bo wariant wegetariański
  // jest z góry zatwierdzony.
  await prisma.workflowNode.update({
    where: { id: utworzone[2].id },
    data: {
      conditionsJson: JSON.stringify([
        { label: "Menu A — klasyczne", conditionType: "client_choice", conditionValue: "Menu A — klasyczne", nextNodeId: utworzone[3].id },
        { label: "Menu B — wegetariańskie", conditionType: "client_choice", conditionValue: "Menu B — wegetariańskie", nextNodeId: utworzone[4].id },
      ]),
    },
  });

  // Krok domykający odkłada wybór menu i uwagi wprost w agendzie.
  await prisma.workflowNode.update({
    where: { id: utworzone[5].id },
    data: {
      fieldMappingsJson: JSON.stringify([
        { sourceKey: "selectedVariantLabel", targetAgendaKey: "agenda.menu", transform: "none" },
        { sourceKey: "note", targetAgendaKey: "agenda.uwagiFinalne", transform: "join_newline" },
      ]),
    },
  });

  return workflow.id;
}

async function stworzWydarzenia(
  organizationId: string,
  userId: string,
  kategorie: Record<string, string>,
  sale: { glowna: string; kominkowa: string },
  workflowId: string,
  wigiliaWorkflowId: string,
) {
  const wesele = await prisma.event.create({
    data: {
      organizationId,
      userId,
      name: "Wesele Ani i Tomka",
      date: day(58, 15),
      estimatedGuestCount: 120,
      isWedding: true,
      eventType: "WEDDING",
      status: "CONFIRMED",
      categoryId: kategorie["Wesele"],
      hallId: sale.glowna,
      workflowId,
      organizerName: DEMO_ORG_NAME,
      responsiblePerson: "Marta — koordynatorka",
      occasionLabel: "Wesele",
      receptionLocationName: "Sala Główna",
    },
  });

  await prisma.event.create({
    data: {
      organizationId, userId, name: "Komunia Zosi", date: day(24, 13), estimatedGuestCount: 45,
      eventType: "COMMUNION", status: "CONFIRMED", categoryId: kategorie["Komunia"],
      hallId: sale.kominkowa, organizerName: DEMO_ORG_NAME, occasionLabel: "Komunia",
    },
  });
  await prisma.event.create({
    data: {
      organizationId, userId, name: "Gala roczna Nordwind SA", date: day(96, 18), estimatedGuestCount: 180,
      eventType: "CORPORATE", status: "DRAFT", categoryId: kategorie["Firmowe"],
      hallId: sale.glowna, organizerName: DEMO_ORG_NAME, occasionLabel: "Gala firmowa",
    },
  });
  // Wigilia z gotowym procesem — do przejścia krok po kroku aż po agendę.
  const wigilia = await prisma.event.create({
    data: {
      organizationId, userId, name: "Wigilia firmowa Alkon", date: day(130, 17), estimatedGuestCount: 60,
      eventType: "CHRISTMAS_EVE", status: "CONFIRMED", categoryId: kategorie["Wigilia"],
      hallId: sale.kominkowa, workflowId: wigiliaWorkflowId,
      organizerName: DEMO_ORG_NAME, occasionLabel: "Wigilia firmowa", receptionLocationName: "Sala Kominkowa",
    },
  });
  for (const [i, wariant] of [
    { label: "Wigilia Menu Klasyczne", dania: MENU_WIG_A },
    { label: "Wigilia Menu Wegetariańskie", dania: MENU_WIG_B },
  ].entries()) {
    await prisma.menuVariant.create({
      data: {
        eventId: wigilia.id, label: wariant.label, sortOrder: i,
        courses: { create: wariant.dania.map((d, j) => ({ name: d.name, courseType: d.courseType, priceBase: d.priceBase, sortOrder: j })) },
      },
    });
  }
  // Proces wystartowany, zatrzymany na kroku 2 (Alergie) — jak w twoim przejściu.
  const wigWezly = await prisma.workflowNode.findMany({
    where: { workflowId: wigiliaWorkflowId }, orderBy: { sortOrder: "asc" }, select: { id: true },
  });
  if (wigWezly.length >= 2) {
    await prisma.eventProcessState.create({
      data: {
        eventId: wigilia.id, workflowId: wigiliaWorkflowId,
        currentNodeId: wigWezly[1].id,
        completedNodeIds: JSON.stringify([wigWezly[0].id]),
        nodeDataJson: JSON.stringify({
          [wigWezly[0].id]: { completedAt: day(-3).toISOString(), completedBy: "client", role: "CLIENT", data: { selectedVariantLabel: "Wigilia Menu Klasyczne", menuSummary: "Wigilia Menu Klasyczne (60 os.)" } },
        }),
      },
    });
    await prisma.event.update({ where: { id: wigilia.id }, data: { workflowStageId: wigWezly[1].id } });
  }

  // ── zawartość wiodącego wesela ─────────────────────────────────────────
  for (const [i, wariant] of [
    { label: "Menu A — klasyczne", dania: MENU_A },
    { label: "Menu B — wegetariańskie", dania: MENU_B },
  ].entries()) {
    await prisma.menuVariant.create({
      data: {
        eventId: wesele.id,
        label: wariant.label,
        sortOrder: i,
        courses: {
          create: wariant.dania.map((d, j) => ({
            name: d.name, courseType: d.courseType, priceBase: d.priceBase, sortOrder: j,
          })),
        },
      },
    });
  }

  for (const [i, p] of HARMONOGRAM.entries()) {
    await prisma.dayScheduleItem.create({
      data: {
        eventId: wesele.id,
        startTime: day(58, p.h, p.m),
        title: p.title,
        description: p.description,
        location: p.location,
        sortOrder: i,
      },
    });
  }

  await prisma.task.createMany({
    data: ZADANIA.map((title, i) => ({
      eventId: wesele.id,
      title,
      status: i === 0 ? "DONE" : "TODO",
      priority: "MEDIUM",
      dueDate: day(58 - 14 + i),
    })),
  });

  await prisma.eventPayment.createMany({
    data: [
      { eventId: wesele.id, label: "Zadatek", amount: 4000, status: "PAID", paidAt: day(-20), method: "przelew", dueDate: day(-25) },
      { eventId: wesele.id, label: "Rata II", amount: 8000, status: "PENDING", dueDate: day(20) },
      { eventId: wesele.id, label: "Dopłata końcowa", amount: 10400, status: "PENDING", dueDate: day(51) },
    ],
  });

  await prisma.eventWidget.createMany({
    data: [
      {
        eventId: wesele.id, widgetType: "CHECKLIST", title: "Checklista obsługi sali", sortOrder: 0,
        configJson: JSON.stringify({ visibleInPortal: false }),
        dataJson: JSON.stringify({
          items: [
            { id: "w1", label: "Ustawić 12 stołów po 10 osób", done: true },
            { id: "w2", label: "Sprawdzić nagłośnienie w ogrodzie", done: true },
            { id: "w3", label: "Przygotować stół prezentowy", done: false },
          ],
        }),
      },
      {
        eventId: wesele.id, widgetType: "NOTE", title: "Uwagi koordynatora", sortOrder: 1,
        configJson: JSON.stringify({ visibleInPortal: false }),
        dataJson: JSON.stringify({
          text: "Para prosi o wejście od strony ogrodu. Tata pana młodego na wózku — zarezerwować miejsce przy stole nr 1.",
        }),
      },
    ],
  });

  // Proces uruchomiony i zatrzymany na wyborze menu — demo pokazuje pracę
  // w toku, a nie świeżo założony event.
  const wezly = await prisma.workflowNode.findMany({
    where: { workflowId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  if (wezly.length >= 3) {
    await prisma.eventProcessState.create({
      data: {
        eventId: wesele.id,
        workflowId,
        currentNodeId: wezly[2].id,
        completedNodeIds: JSON.stringify([wezly[0].id, wezly[1].id]),
        nodeDataJson: JSON.stringify({
          [wezly[0].id]: { completedAt: day(-30).toISOString(), completedBy: "demo", role: "ORGANIZER", data: {} },
          [wezly[1].id]: { completedAt: day(-24).toISOString(), completedBy: "demo", role: "ORGANIZER", data: {} },
        }),
      },
    });
    await prisma.event.update({ where: { id: wesele.id }, data: { workflowStageId: wezly[2].id } });
  }
}

async function stworzZapytania(organizationId: string) {
  for (const l of LEADY) {
    await prisma.orgLead.create({
      data: {
        organizationId, name: l.name, email: l.email, phone: l.phone,
        eventDate: day(l.offset), guestCount: l.guestCount, message: l.message, status: l.status,
      },
    });
  }
}

async function stworzBlokady(organizationId: string) {
  await prisma.orgBlockedDate.createMany({
    data: [
      { organizationId, date: day(12), reason: "Remont sali głównej" },
      { organizationId, date: day(13), reason: "Remont sali głównej" },
      { organizationId, date: day(115), reason: "Impreza zamknięta" },
    ],
    skipDuplicates: true,
  });
}
