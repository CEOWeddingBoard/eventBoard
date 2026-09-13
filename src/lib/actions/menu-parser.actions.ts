"use server";

import { prisma } from "@/lib/prisma";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getCurrentUser } from "@/lib/auth/utils";
import { revalidatePath } from "next/cache";
import { DEFAULT_RULES, parseRules, type ParserRules, type ParsedVariant } from "@/lib/menu-parser";

async function getOrgId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("Brak organizacji");
  return orgId;
}

/** Reguły parsera menu dla organizacji (albo domyślne). */
export async function getMenuParserRules(): Promise<ParserRules> {
  const orgId = await getOrgId();
  const config = await prisma.menuParserConfig.findUnique({
    where: { organizationId: orgId },
    select: { rulesJson: true },
  });
  return parseRules(config?.rulesJson);
}

export async function saveMenuParserRules(rules: ParserRules): Promise<void> {
  const orgId = await getOrgId();
  const rulesJson = JSON.stringify(rules ?? DEFAULT_RULES);
  await prisma.menuParserConfig.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, rulesJson },
    update: { rulesJson },
  });
  revalidatePath("/app/settings/menu-parser");
}

async function assertEventInOrg(eventId: string, orgId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: orgId },
    select: { id: true },
  });
  if (!event) throw new Error("Event nie należy do organizacji");
}

/**
 * Tworzy warianty menu i pozycje z rozpoznanej struktury. Pozycje dostają
 * domyślnie brak liczby porcji i status „niezatwierdzone".
 */
export async function importParsedMenu(
  eventId: string,
  variants: ParsedVariant[]
): Promise<{ created: number }> {
  const orgId = await getOrgId();
  await assertEventInOrg(eventId, orgId);

  const existingCount = await prisma.menuVariant.count({ where: { eventId } });
  let created = 0;

  for (const [vi, v] of variants.entries()) {
    if (!v.label && v.courses.length === 0) continue;
    await prisma.menuVariant.create({
      data: {
        eventId,
        label: v.label || `Wariant ${vi + 1}`,
        pricePerPerson: v.pricePerPerson ?? null,
        sortOrder: existingCount + vi,
        courses: {
          create: v.courses.map((c, ci) => ({
            name: c.name,
            courseType: c.courseType,
            approved: false,
            sortOrder: ci,
          })),
        },
      },
    });
    created += 1;
  }

  revalidatePath(`/app/events/${eventId}`);
  return { created };
}
