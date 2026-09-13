import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { MenuCatalogClient } from "./menu-catalog-client";
import { listOrganizationEventsForMenu, listOrganizationMenuVariants } from "@/lib/actions/menu-variant.actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function MenuCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const [events, variants] = await Promise.all([
    listOrganizationEventsForMenu(),
    listOrganizationMenuVariants(),
  ]);

  return (
    <MenuCatalogClient
      events={events.map((e) => ({ id: e.id, name: e.name, date: e.date.toISOString() }))}
      variants={variants.map((v) => ({
        id: v.id,
        label: v.label,
        description: v.description,
        imageUrl: v.imageUrl,
        notes: v.notes,
        eventName: v.event.name,
        eventId: v.event.id,
        courses: v.courses.map((c) => ({ id: c.id, name: c.name, courseType: c.courseType, description: c.description, allergens: c.allergens, priceBase: c.priceBase, priceExtra: c.priceExtra })),
      }))}
    />
  );
}
