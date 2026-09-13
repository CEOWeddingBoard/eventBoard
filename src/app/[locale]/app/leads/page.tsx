import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import LeadsClientPage from "./leads-client";

export const metadata = { robots: { index: false, follow: false } };

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const membership = await getActiveMembership(user.id);
  if (!membership) redirect(`/${locale}/app/dashboard`);

  const leads = await prisma.orgLead.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return <LeadsClientPage initialLeads={leads} locale={locale} />;
}
