import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { VenueConfigClient } from "./venue-config-client";

export const metadata = { robots: { index: false, follow: false } };

export default async function VenuesConfigPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const membership = await getActiveMembership(user.id);
  if (!membership) redirect(`/${locale}/app/dashboard`);

  const venues = await prisma.venue.findMany({
    where: { organizationId: membership.organizationId },
    include: {
      halls: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <VenueConfigClient
      initialVenues={venues.map((v) => ({
        id: v.id,
        name: v.name,
        address: v.address,
        city: v.city,
        capacity: v.capacity,
        description: v.description,
        halls: v.halls.map((h) => ({
          id: h.id,
          name: h.name,
          capacity: h.capacity,
        })),
      }))}
    />
  );
}
