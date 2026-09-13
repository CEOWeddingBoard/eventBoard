import { getTranslations } from "next-intl/server";
import { getUserOrganizations, getEventCategories, seedSystemCategories } from "@/lib/actions/organization.actions";
import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getNotificationSettings, getTeamContext } from "@/lib/actions/team.actions";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const t = await getTranslations("eventboard");
  const orgs = await getUserOrganizations();
  if (orgs.length === 0) return <div className="space-y-6"><h1 className="text-2xl font-bold text-slate-900">{t("settings")}</h1><p className="text-slate-500">{t("noOrganization")}</p></div>;

  const user = await getCurrentUser();
  const activeId = user ? await getActiveOrgId(user.id) : null;
  const org = orgs.find((o) => o.id === activeId) ?? orgs[0];
  let cats = await getEventCategories(org.id);
  if (cats.length === 0) { await seedSystemCategories(org.id); cats = await getEventCategories(org.id); }

  const [notif, team] = await Promise.all([getNotificationSettings(), getTeamContext().catch(() => null)]);

  return <>
    <div className="mb-6"><NotificationSettings initial={notif} canManage={team?.canManage ?? false} /></div>
    <SettingsClient orgId={org.id} orgName={org.name} orgSlug={org.slug} categories={cats.map((c) => ({
    id: c.id, name: c.name, icon: c.icon ?? "Sparkles", color: c.color ?? "#64748b",
    modules: c.modulesJson ? JSON.parse(c.modulesJson as string) : [], isSystem: c.isSystem,
  }))} profile={{
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
