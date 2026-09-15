import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCronSecret } from "@/lib/api/cron-auth";
import { notifyOrganization } from "@/lib/actions/org-ecosystem.actions";
import { sendSms, isSmsConfigured } from "@/lib/sms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron: przypomnienia o zaliczkach i ratach.
 *
 * `EventPayment` miał termin i status od dawna, ale NIC ich nie czytało —
 * przypomnienia dotyczyły wyłącznie terminu menu i listy gości. Niezapłacona
 * w terminie zaliczka to najczęstszy powód strat przy przyjęciach, a system ma
 * komplet danych, żeby o niej przypomnieć.
 *
 * Zaplanuj codziennie. Zabezpieczony CRON_SECRET.
 */

/** Ile dni przed terminem zaczynamy przypominać. */
const DNI_PRZED = 3;

export async function GET(req: NextRequest) {
  if (!isValidCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teraz = new Date();
  const granica = new Date(teraz.getTime() + DNI_PRZED * 24 * 60 * 60 * 1000);

  const platnosci = await prisma.eventPayment.findMany({
    where: {
      status: "PENDING",
      dueDate: { not: null, lte: granica },
      // Przyjęcia bez przypisanej przestrzeni nie mają odbiorcy powiadomienia.
      event: { organizationId: { not: null } },
    },
    select: {
      id: true,
      label: true,
      amount: true,
      dueDate: true,
      event: {
        select: {
          id: true,
          name: true,
          organizationId: true,
          organization: {
            select: { name: true, phone: true, notifySms: true, archivedAt: true },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 500,
  });

  const wynik = { sprawdzone: platnosci.length, powiadomienia: 0, sms: 0, pominiete: 0 };

  // Grupujemy po przestrzeni: jedno powiadomienie z listą zamiast osobnego dla
  // każdej raty — inaczej obiekt z pięcioma zaległościami dostaje pięć SMS-ów.
  const wgPrzestrzeni = new Map<
    string,
    { telefon: string | null; notifySms: boolean; pozycje: string[]; zalegle: number }
  >();

  for (const p of platnosci) {
    const org = p.event?.organization;
    const orgId = p.event?.organizationId;
    if (!orgId || !org || org.archivedAt) {
      wynik.pominiete++;
      continue;
    }

    const przeterminowana = p.dueDate! < teraz;
    const kwota = p.amount.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
    const termin = p.dueDate!.toLocaleDateString("pl-PL");

    const wpis = wgPrzestrzeni.get(orgId) ?? {
      telefon: org.phone,
      notifySms: org.notifySms,
      pozycje: [],
      zalegle: 0,
    };
    wpis.pozycje.push(
      `${p.event!.name}: ${p.label} ${kwota} zł — ${przeterminowana ? `zaległe od ${termin}` : `termin ${termin}`}`,
    );
    if (przeterminowana) wpis.zalegle++;
    wgPrzestrzeni.set(orgId, wpis);
  }

  for (const [orgId, wpis] of wgPrzestrzeni) {
    const tytul =
      wpis.zalegle > 0
        ? `Zaległe płatności: ${wpis.zalegle}`
        : `Zbliżają się terminy płatności (${wpis.pozycje.length})`;

    await notifyOrganization(orgId, {
      type: "PAYMENT_REMINDER",
      title: tytul,
      body: wpis.pozycje.join("\n"),
      link: "/app/finances",
    });
    wynik.powiadomienia++;

    if (wpis.notifySms && wpis.telefon && isSmsConfigured()) {
      try {
        await sendSms(wpis.telefon, `${tytul}. ${wpis.pozycje.slice(0, 3).join(" | ")}`.slice(0, 300));
        wynik.sms++;
      } catch (e) {
        // Nieudany SMS nie może przerwać powiadamiania pozostałych obiektów.
        console.error("[cron:payment-reminders] SMS", e);
      }
    }
  }

  return NextResponse.json({ success: true, ...wynik });
}
