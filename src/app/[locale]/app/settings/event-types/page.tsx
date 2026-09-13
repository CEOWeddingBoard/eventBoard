import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { EventTypesConfigClient } from "./event-types-config-client";
import { listEventTypes } from "@/lib/actions/event-type.actions";
import { listOrgTemplates } from "@/lib/actions/org-ecosystem.actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function EventTypesConfigPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const membership = await getActiveMembership(user.id);
  if (!membership) redirect(`/${locale}/app/dashboard`);

  const [eventTypes, templates] = await Promise.all([
    listEventTypes(),
    listOrgTemplates(),
  ]);

  return (
    <EventTypesConfigClient
      initialEventTypes={eventTypes}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
