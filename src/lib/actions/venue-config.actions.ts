"use server";

import { prisma } from "@/lib/prisma";
import { assertModuleEdit } from "@/lib/permissions/guard";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId } from "@/lib/auth/active-org";

async function getUserOrgId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getActiveOrgId(user.id);
}

export async function listOrganizationVenues() {
  const organizationId = await getUserOrgId();
  if (!organizationId) return [];

  return prisma.venue.findMany({
    where: { organizationId },
    include: {
      halls: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createVenue(input: {
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  description?: string;
}) {
  await assertModuleEdit("configuration");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  const venue = await prisma.venue.create({
    data: {
      organizationId,
      name: input.name.trim(),
      slug,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      capacity: input.capacity ?? null,
      description: input.description?.trim() || null,
      clerkOrgId: organizationId,
      ownerClerkId: user.id,
    },
  });

  revalidatePath("/app/settings/venues");
  return venue;
}

export async function updateVenue(
  venueId: string,
  input: {
    name?: string;
    address?: string;
    city?: string;
    capacity?: number;
    description?: string;
  }
) {
  await assertModuleEdit("configuration");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, organizationId },
  });
  if (!venue) throw new Error("Not found");

  const updated = await prisma.venue.update({
    where: { id: venueId },
    data: {
      name: input.name?.trim(),
      address: input.address?.trim(),
      city: input.city?.trim(),
      capacity: input.capacity,
      description: input.description?.trim(),
    },
  });

  revalidatePath("/app/settings/venues");
  return updated;
}

export async function deleteVenue(venueId: string) {
  await assertModuleEdit("configuration");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, organizationId },
  });
  if (!venue) throw new Error("Not found");

  await prisma.venue.delete({ where: { id: venueId } });
  revalidatePath("/app/settings/venues");
  return { ok: true };
}

export async function createVenueHall(
  venueId: string,
  input: { name: string; capacity: number }
) {
  await assertModuleEdit("configuration");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, organizationId },
  });
  if (!venue) throw new Error("Not found");

  const hall = await prisma.venueHall.create({
    data: {
      venueId,
      name: input.name.trim(),
      capacity: input.capacity,
    },
  });

  revalidatePath("/app/settings/venues");
  return hall;
}

export async function updateVenueHall(
  hallId: string,
  input: { name?: string; capacity?: number }
) {
  await assertModuleEdit("configuration");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const hall = await prisma.venueHall.findFirst({
    where: { id: hallId, venue: { organizationId } },
  });
  if (!hall) throw new Error("Not found");

  const updated = await prisma.venueHall.update({
    where: { id: hallId },
    data: {
      name: input.name?.trim(),
      capacity: input.capacity,
    },
  });

  revalidatePath("/app/settings/venues");
  return updated;
}

export async function deleteVenueHall(hallId: string) {
  await assertModuleEdit("configuration");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const hall = await prisma.venueHall.findFirst({
    where: { id: hallId, venue: { organizationId } },
  });
  if (!hall) throw new Error("Not found");

  await prisma.venueHall.delete({ where: { id: hallId } });
  revalidatePath("/app/settings/venues");
  return { ok: true };
}
