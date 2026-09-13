"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function DashboardHeader() {
  const pathname = usePathname();
  const t = useTranslations("Dashboard");

  const pathWithoutLocale = pathname.replace(/^\/(pl|en)\//, "/");
  const exactDashboard = pathWithoutLocale === "/dashboard";

  if (exactDashboard) return null;

  const base = pathWithoutLocale.split("/").slice(0, 3).join("/");
  const key = base || pathWithoutLocale || "/dashboard";

  const title = t(`header.${key}.title`);
  const subtitle = t(`header.${key}.subtitle`);

  return (
    <div className="border-b border-olive/25 pb-6">
      <h1 className="font-script text-3xl font-normal text-ink tracking-tight mb-1">{title}</h1>
      <p className="font-serif text-base italic text-ink tracking-wide opacity-90">{subtitle}</p>
    </div>
  );
}
