import { getTranslations } from "next-intl/server";
import { getUserOrganizations } from "@/lib/actions/organization.actions";
import { getCurrentUser } from "@/lib/auth/utils";
import { assertModuleView, canEditModule } from "@/lib/permissions/guard";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getNotificationSettings, getTeamContext } from "@/lib/actions/team.actions";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await assertModuleView("settings", locale);
  const t = await getTranslations("eventboard");
  const orgs = await getUserOrganizations();
  if (orgs.length === 0) return <div className="space-y-6"><h1 className="text-2xl font-bold text-slate-900">{t("settings")}</h1><p className="text-slate-500">{t("noOrganization")}</p></div>;

  const user = await getCurrentUser();
  const activeId = user ? await getActiveOrgId(user.id) : null;
  const org = orgs.find((o) => o.id === activeId) ?? orgs[0];

  const canEdit = await canEditModule("settings");

  const [notif, team] = await Promise.all([getNotificationSettings(), getTeamContext().catch(() => null)]);

  return <>
    <div className="mb-6"><NotificationSettings initial={notif} canManage={team?.canManage ?? false} /></div>
    <SettingsClient orgId={org.id} orgName={org.name} orgSlug={org.slug} canEdit={canEdit} profile={{
    address: org.address ?? "",
    city: org.city ?? "",
    postalCode: org.postalCode ?? "",
    phone: org.phone ?? "",
    email: org.email ?? "",
    website: org.website ?? "",
    description: org.description ?? "",
    capacity: org.capacity != null ? String(org.capacity) : "",
    priceRange: org.priceRange ?? "",
  }} />
  </>;
}
