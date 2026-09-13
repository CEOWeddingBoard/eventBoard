import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  Users,
  Settings,
  Settings2,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { AccountMenu } from "@/components/auth/account-menu";
import { OrgNotificationBell } from "@/components/eventboard/org-notification-bell";
import { getCurrentUser } from "@/lib/auth/utils";
import { getUserOrganizations } from "@/lib/actions/organization.actions";
import { getActiveOrgId, getActiveSpaceBanner } from "@/lib/auth/active-org";
import { ActiveSpaceBanner } from "@/components/admin/ActiveSpaceBanner";
import { getMyModuleAccess, getOrgBranding } from "@/lib/actions/team.actions";
import { canView } from "@/lib/permissions/modules";
import { hasAcceptedCurrentTerms } from "@/lib/actions/legal.actions";
import { isPlatformAdmin } from "@/lib/actions/admin.actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const orgs = await getUserOrganizations();
  if (orgs.length === 0) redirect(`/${locale}/onboarding`);

  // Brama akceptacji regulaminu — admin platformy (serwis) pomijany.
  if (!(await isPlatformAdmin()) && !(await hasAcceptedCurrentTerms())) {
    redirect(`/${locale}/legal/accept`);
  }

  const activeId = await getActiveOrgId(user.id);
  const org = orgs.find((o) => o.id === activeId) ?? orgs[0];
  const branding = await getOrgBranding(org.id);
  const spaceBanner = await getActiveSpaceBanner(user.id);
  const access = await getMyModuleAccess();
  const orgNav = [
    { label: "Dashboard", href: `/${locale}/app/dashboard`, icon: LayoutDashboard, mod: "dashboard" },
    { label: "Kalendarz", href: `/${locale}/app/calendar`, icon: Calendar, mod: "calendar" },
    { label: "Eventy", href: `/${locale}/app/events`, icon: CalendarDays, mod: "events" },
    { label: "Zapytania", href: `/${locale}/app/leads`, icon: MessageSquare, mod: "leads" },
    { label: "Finanse", href: `/${locale}/app/finances`, icon: DollarSign, mod: "finances" },
    { label: "Zespół", href: `/${locale}/app/team`, icon: Users, mod: "team" },
    { label: "Konfiguracja", href: `/${locale}/app/settings/configuration`, icon: Settings2, mod: "configuration" },
    { label: "Ustawienia", href: `/${locale}/app/settings`, icon: Settings, mod: "settings" },
  ].filter((item) => canView(access[item.mod]));

  return (
    <div className="eb-ui min-h-screen bg-white font-sans text-neutral-700">
      {spaceBanner && <ActiveSpaceBanner name={spaceBanner.name} locale={locale} />}
      {/* Top bar — navy, like ERP systems; akcent = kolor klienta jeśli ustawiony */}
      <header
        className="text-white h-11 flex items-center px-5 gap-4 text-xs"
        style={{ backgroundColor: branding.color || "#1a2332" }}
      >
        <Link href={`/${locale}/app/dashboard`} className="font-bold tracking-wide shrink-0">
          EVENT<span className="text-blue-300">BOARD</span>
        </Link>
        <span className="text-white/30">|</span>
        {branding.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt="" className="h-6 w-auto max-w-[120px] object-contain shrink-0" />
        )}
        <span className="text-white/80 truncate">{org.name}</span>
        <span className="ml-auto text-[10px] bg-white/15 text-white px-2 py-0.5 rounded font-medium">
          {org.plan}
        </span>
        <OrgNotificationBell />
        <AccountMenu locale={locale} />
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-neutral-200 min-h-[calc(100vh-44px)] bg-neutral-50 py-3">
          <nav className="space-y-0.5 px-2">
            {orgNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800 transition-colors"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>

        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-6 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
