"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId } from "@/lib/auth/active-org";

async function getUserOrgId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getActiveOrgId(user.id);
}

export async function seedDefaultAgendaTemplates() {
  const organizationId = await getUserOrgId();
  if (!organizationId) return { ok: false, error: "No organization" };

  // Check if templates already exist
  const existing = await prisma.agendaDocumentTemplate.count({
    where: { organizationId },
  });
  if (existing > 0) return { ok: true, count: existing };

  // Create default wedding agenda template
  await prisma.agendaDocumentTemplate.create({
    data: {
      organizationId,
      name: "Agenda Weselna",
      description: "Standardowa agenda weselna z sekcjami: ceremonia, przyjęcie, tańce",
      pagesJson: JSON.stringify([
        {
          blocks: [
            {
              id: "block_1",
              type: "header",
              props: { title: "Wesele [Imię i Nazwisko]", subtitle: "Data ślubu" },
              slots: [
                { id: "block_1_title", placeholder: "Imię i Nazwisko Zakładu" },
                { id: "block_1_subtitle", placeholder: "Data ślubu" },
              ],
            },
            {
              id: "block_2",
              type: "section",
              props: { title: "Ceremonia" },
              slots: [
                { id: "block_2_1", placeholder: "Czas rozpoczęcia" },
                { id: "block_2_2", placeholder: "Czas trwania" },
                { id: "block_2_3", placeholder: "Lokalizacja" },
              ],
            },
            {
              id: "block_3",
              type: "section",
              props: { title: "Przyjęcie" },
              slots: [
                { id: "block_3_1", placeholder: "Czas rozpoczęcia przyjęcia" },
                { id: "block_3_2", placeholder: "Lokalizacja" },
                { id: "block_3_3", placeholder: "Nazwa lokalu" },
              ],
            },
            {
              id: "block_4",
              type: "columns",
              props: { count: 2 },
              slots: [
                { id: "block_4_1", placeholder: "Lista życzeń para młodej" },
                { id: "block_4_2", placeholder: "Lista życzeń para młodego" },
              ],
            },
            {
              id: "block_5",
              type: "table",
              props: { rows: 5, cols: 3 },
              slots: [],
            },
            {
              id: "block_6",
              type: "image",
              props: { width: "100%", height: "300px" },
              slots: [{ id: "block_6_1", placeholder: "Zdjęcie pary młodej" }],
            },
            {
              id: "block_7",
              type: "spacer",
              props: { height: "40px" },
              slots: [],
            },
            {
              id: "block_8",
              type: "pagebreak",
              props: {},
              slots: [],
            },
          ],
        },
      ]),
    },
  });

  // Create default corporate agenda template
  await prisma.agendaDocumentTemplate.create({
    data: {
        organizationId,
        name: "Agenda Spotkań Biznesowych",
        description: "Agenda spotkań firmowych z sekcjami: wprowadzenie, punkty porozumienia, postanowienia",
        pagesJson: JSON.stringify([
          {
            blocks: [
              {
                id: "block_1",
                type: "header",
                props: { title: "Spotkanie: [Nazwa spotkań]" },
                slots: [{ id: "block_1_title", placeholder: "Nazwa spotkań" }],
              },
              {
                id: "block_2",
                type: "section",
                props: { title: "Uczestnicy" },
                slots: [
                  { id: "block_2_1", placeholder: "Imię i nazwisko" },
                  { id: "block_2_2", placeholder: "Firma" },
                  { id: "block_2_3", placeholder: "Rola" },
                ],
              },
              {
                id: "block_3",
                type: "section",
                props: { title: "Porządek obrad" },
                slots: [
                  { id: "block_3_1", placeholder: "1. Akceptacja poprzednich protokołów" },
                  { id: "block_3_2", placeholder: "2. Omówienie punktu pierwszego" },
                  { id: "block_3_3", placeholder: "3. Omówienie punktu drugiego" },
                ],
              },
              {
                id: "block_4",
                type: "section",
                props: { title: "Postanowienia" },
                slots: [
                  { id: "block_4_1", placeholder: "Decyzja nr 1" },
                  { id: "block_4_2", placeholder: "Decyzja nr 2" },
                  { id: "block_4_3", placeholder: "Decyzja nr 3" },
                ],
              },
              {
                id: "block_5",
                type: "spacer",
                props: { height: "30px" },
                slots: [],
              },
              {
                id: "block_6",
                type: "pagebreak",
                props: {},
                slots: [],
              },
            ],
          },
        ]),
      },
  });

  revalidatePath("/app/settings/document-templates");
  return { ok: true, count: 2 };
}
